exports.handler = function(event, context) {
  context.succeed({data: event.data + "!"});
};
