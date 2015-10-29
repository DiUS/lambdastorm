var AWS = require('aws-sdk');
var kinesis = new AWS.Kinesis();

exports.handler = function(event, context) {
  kinesis.putRecord({
    Data: JSON.stringify(event),
    PartitionKey: Math.floor(Math.random()*Math.pow(2, 32)).toString(),
    StreamName: "lambdastorm_output"
  }, function(err, data) {
    context.done(err, data);
  });
};
