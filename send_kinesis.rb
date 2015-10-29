#!/usr/bin/env ruby

require 'json'
require 'aws-sdk'

kinesis = Aws::Kinesis::Client.new
stream_name = ARGV.shift
data = JSON.parse File.read(ARGV.shift)

resp = kinesis.put_record({
  stream_name: stream_name,
  data: data.to_json,
  partition_key: Random.rand(2**32).to_s
})
