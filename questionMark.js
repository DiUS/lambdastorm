exports.handler = function (event, context) {
    console.log("Question mark called with: " + event.data);
    context.succeed({data: event.data + "?"});
};
