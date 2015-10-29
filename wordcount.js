var count = require('word-count');

exports.handler = function (event, context) {
  var body = event.body;
  delete event.body;
  event.word_count = count(body);


  context.succeed(event);
};
