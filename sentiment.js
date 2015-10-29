var sentiment = require('sentiment');

exports.handler = function (event, context) {
    var body = event.body;
    event.sentiment = sentiment(body);
    context.succeed(event);
};
