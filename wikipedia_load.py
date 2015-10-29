#!/usr/bin/env python

import os
import sys
import re
import time
import fnmatch
import uuid
import json
from multiprocessing import Pool
from boto import kinesis


INSERT_IN_BATCHES = False
BATCH_SIZE = 100
NUM_PROCESSES = 1
AWS_REGION = 'ap-northeast-1'

def find_article_files(data_dir):
    files = []
    for root, dirnames, filenames in os.walk(data_dir):
        for filename in filenames:
            article_path = os.path.join(root, filename)
            files.append(article_path)

    return files

def process(data_dir, num_processes):
    article_files = find_article_files(data_dir)
    print "Loading {0} articles".format(len(article_files))
    if num_processes > 1:
        print "Loading using {0} processes".format(num_processes)
        pool = Pool(processes=num_processes)
        pool.map(process_article, article_files, len(article_files)/num_processes + 1)
    else:
        for article_file in article_files:
            process_article(article_file)


def process_article(article_path):
    global processed_count
    global start_time
    global kinesis_stream
    global doc_buffer

    with open (article_path, "r") as article_file:
        text = article_file.read()

    lines = text.split("\n")
    header = lines[0]
    m = re.match(r'<doc id=\"([0-9]+)\" url=\"(.+)\" title=\"(.+)\"', header)
    if m:
        article_id = int(m.group(1))
        article_text = "\n".join(lines[1:-1])
        doc = {
            'article_id': str(uuid.uuid4()),
            'url': m.group(2),
            'title': m.group(3),
            'body': article_text
        }

        if INSERT_IN_BATCHES:
            doc_buffer.append(json.dumps(doc))
            if len(doc_buffer) == BATCH_SIZE:
                kinesis.put_records(kinesis_stream, doc_buffer, str(uuid.uuid4()))
                doc_buffer = []
        else:
            kinesis.put_record(kinesis_stream, json.dumps(doc), str(uuid.uuid4()))
            print "Sent article '{}' ({})".format(doc['title'], doc['article_id'])

    else:
        print "Header not found in {0}".format(article_file)



if __name__ == '__main__':
    processed_count = 0
    doc_buffer = []
    start_time = time.time()
    data_dir = "data"
    kinesis_stream = "lambdastorm_input"
    kinesis = kinesis.connect_to_region(AWS_REGION)

    process(data_dir, NUM_PROCESSES)
