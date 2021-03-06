var AWS = require('aws-sdk');
var lambda = new AWS.Lambda();

var topology = require('./topology.json');

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
  var data = JSON.parse(output.Payload);
  if (bolt.next) {

       for (var i = 0; i < bolt.next.length; i++) {
            var nextBolt = topology.bolts[bolt.next[i]];
            console.log("-bolt: " + JSON.stringify(nextBolt));
            invokeBolt(nextBolt, data, context, handleBoltResult);
       }

  } else {
      console.log("Graph ended on bolt " + JSON.stringify(bolt) + " with value " + JSON.stringify(output));
      context.succeed(data);
  }
}

exports.handler = function handler(event, context) {
  if (event.Records) {
    event.Records.forEach(function(record) {

      var payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');

      for (var i = 0; i < topology.entry.length; i++) {
        var bolt = topology.bolts[topology.entry[i]];
        invokeBolt(bolt, JSON.parse(payload), context, handleBoltResult);
      }

    });
  }
  else {
    for (var i = 0; i < topology.entry.length; i++) {
      var bolt = topology.bolts[topology.entry[i]];
      invokeBolt(bolt, event, context, handleBoltResult);
    }
  }
};

// exports.handler({body: "cats are stupid"} , {succeed: function(output) {console.log(JSON.stringify(output.Payload))}});
