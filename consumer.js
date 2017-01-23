
/**
 * Copyright 2014 Confluent Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var KafkaRest = require('kafka-rest'),
    argv = require('minimist')(process.argv.slice(2));

var api_url = argv.url || "http://localhost:8082";
var topicName = argv.topic;
var consumerGroup = argv.group;
var messageLimit = argv['message-limit'];
var fromBeginning = argv['from-beginning'];
var format = argv.format || "avro";
var help = (argv.help || argv.h);

const Twitter = require('twitter');
const weatherReply = require('./replies').weatherReply;
const infoReply = require('./replies').infoReply;

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

if (help || topicName === undefined || (format != "binary" && format != "avro")) {
    console.log("Consumes and prints values of messages from a Kafka topic via the REST proxy API wrapper.");
    console.log();
    console.log("Usage: node console_consumer.js [--url <api-base-url>] --topic <topic> [--group <consumer-group-name>] [--message-limit <num_messages>] [--from-beginning] [--format <avro|binary>]");
    process.exit(help ? 0 : 1);
}

if (consumerGroup === undefined)
    consumerGroup = "console-consumer-" + Math.round(Math.random() * 100000);

var kafka = new KafkaRest({"url": api_url});
var consumed = 0;
var consumerConfig = {
    "format": format
};
if (fromBeginning) {
    consumerConfig['auto.offset.reset'] = 'smallest';
}
kafka.consumer(consumerGroup).join(consumerConfig, function(err, consumer_instance) {
    if (err) return console.log("Failed to create instance in consumer group: " + err);

    console.log("Consumer instance initialized: " + consumer_instance.toString());
    var stream = consumer_instance.subscribe(topicName);
    stream.on('data', function(msgs) {
        for(var i = 0; i < msgs.length; i++) {
            var oneTweet = msgs[i].value;
            if (format == "binary") {
                console.log(oneTweet.toString('utf8'));
                // Also available: msgs[i].key, msgs[i].partition
            } else {
                console.log(JSON.stringify(oneTweet));
            }
            // replies with 'more info' message if the tweet is directed @ bot; else looks up user location and generates 'weather' tweet. 
            if (oneTweet.in_reply_to_user_id === '823016304852537344') postTweet(infoReply(oneTweet));
            else if (oneTweet.screen_name !== 'climatetruthbot') weatherReply(oneTweet).then(newTweet => postTweet(newTweet));
        }

        consumed += msgs.length;
        if (messageLimit !== undefined && consumed >= messageLimit)
            consumer_instance.shutdown(logShutdown);
    });
    stream.on('error', function(err) {
        console.log("Consumer instance reported an error: " + err);
        console.log("Attempting to shut down consumer instance...");
        consumer_instance.shutdown(logShutdown);
    });
    stream.on('end', function() {
        console.log("Consumer stream closed.");
    });

    // Events are also emitted by the parent consumer_instance, so you can either consume individual streams separately
    // or multiple streams with one callback. Here we'll just demonstrate the 'end' event.
    consumer_instance.on('end', function() {
        console.log("Consumer instance closed.");
    });

    // Also trigger clean shutdown on Ctrl-C
    process.on('SIGINT', function() {
        console.log("Attempting to shut down consumer instance...");
        consumer_instance.shutdown(logShutdown);
    });

});

function logShutdown(err) {
    if (err)
        console.log("Error while shutting down: " + err);
    else
        console.log("Shutdown cleanly.");
}

const postTweet = ({ content, tweetIdToReplyTo }) =>  {
  console.log(content, tweetIdToReplyTo)
  client.post('statuses/update', {
      status: content,
      in_reply_to_status_id: tweetIdToReplyTo
    }, (error, tweet, response) => {
     if (error) {
         console.log(error);
       } else {
         console.log("Successfully sent tweet at " + new Date());
       }
    }) 
}
