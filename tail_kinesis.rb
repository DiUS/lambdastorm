#!/usr/bin/env ruby

require 'json'
require 'uri'
require 'aws-sdk'

kinesis = Aws::Kinesis::Client.new

stream_name = ARGV.shift

shards = kinesis.describe_stream(:stream_name => stream_name)[:stream_description][:shards]

iterators = {}

shards.each do |shard|
  response = kinesis.get_shard_iterator(:stream_name => stream_name, :shard_id => shard[:shard_id], :shard_iterator_type => 'LATEST')
  iterators[shard[:shard_id]] = response[:shard_iterator]
end

while true
  shards.each do |shard|
    response = kinesis.get_records(:shard_iterator => iterators[shard[:shard_id]], :limit => 100)
    iterators[shard[:shard_id]] = response[:next_shard_iterator]
    response[:records].each do |record|
      json = JSON.parse record[:data]
      puts "Received #{json}"
    end
  end
  sleep 1
end
