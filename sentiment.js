var sentiment = require('sentiment');
var AWS = require('aws-sdk');
var kinesis = new AWS.Kinesis();

exports.handler = function (event, context) {
    var body = event.body;
    delete event.body;
    var sentimentResult = sentiment(body);
    delete sentimentResult.words;
    delete sentimentResult.tokens;
    event.sentiment = sentimentResult;

    if (sentimentResult.score < 0) {
        kinesis.putRecord({
            Data: JSON.stringify(event),
            PartitionKey: Math.floor(Math.random()*Math.pow(2, 32)).toString(),
            StreamName: "lambdastorm_negative"
        }, function(err, data) {
            context.done(err, data);
        });
    } else if (sentimentResult.score > 0) {
        kinesis.putRecord({
            Data: JSON.stringify(event),
            PartitionKey: Math.floor(Math.random()*Math.pow(2, 32)).toString(),
            StreamName: "lambdastorm_positive"
        }, function(err, data) {
            context.done(err, data);
        });
    }

    context.succeed(event);
};
