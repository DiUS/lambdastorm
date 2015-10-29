var AWS = require('aws-sdk');
var lambda = new AWS.Lambda();

var topology = {
  entry: "wordcount",
  bolts: {
    wordcount: {
      functionName: "wordcount",
      next: ["kinesisoutput"]
    },
    kinesisoutput: {
      functionName: "kinesisoutput"
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

exports.handler = function(event, context) {
  var bolt = topology.bolts[topology.entry];
  if (event.Records) {
    event.Records.forEach(function(record) {
      var payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
      invokeBolt(bolt, JSON.parse(payload), context, handleBoltResult);
    });
  }
  else {
    invokeBolt(bolt, event, context, handleBoltResult);
  }
};

// invokeBolt(topology.bolts.exclaim1, {data: "value1"}, {succeed: function(output) {console.log(JSON.stringify(output.Payload))}}, handleBoltResult);
