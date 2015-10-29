var AWS = require('aws-sdk');
var lambda = new AWS.Lambda();

var topology = {
  entry: "wordCount",
  bolts: {
    wordCount: {
      functionName: "LambdaStorm",
      next: "language"
    },
    language: {
      functionName: "LambdaStorm"
    }
  }
};

function invokeBolt(bolt, data, context, resultHandler) {
  console.log("Invoking function " + bolt.functionName + " with data " + JSON.stringify(data));
  lambda.invoke({
    FunctionName: bolt.functionName,
    Payload: JSON.stringify(data)
  }, function(err, output) {
    resultHandler(bolt, output, context);
  });
}

function handleBoltResult(bolt, output, context) {
  console.log("Got output " + JSON.stringify(output) + " from function " + bolt.functionName);
  if (bolt.next) {
    var nextBolt = topology.bolts[bolt.next];
    var data = JSON.parse(output.Payload);
    invokeBolt(nextBolt, data, context, handleBoltResult);
  } else {
    context.succeed(output);
  }
}

exports.handler = function(event, context) {
  var bolt = topology.bolts[topology.entry];
  invokeBolt(bolt, event, context, handleBoltResult);
};

invokeBolt(topology.bolts.wordCount, {key1: "value1"}, {succeed: function(output) {console.log(JSON.stringify(output.Payload))}}, handleBoltResult);
