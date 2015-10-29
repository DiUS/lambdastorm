var sentiment = require('sentiment');

exports.handler = function (event, context) {
    var body = event.body;
    delete event.body;
    var sentimentResult = sentiment(body);
    delete sentimentResult.words;
    delete sentimentResult.tokens;
    event.sentiment = sentimentResult;

    context.succeed(event);
};
