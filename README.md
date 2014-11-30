Injector
========
Injector helps you to compose your app using modules

###Usage:

```javascript
var app = new Injector();

app.provide('logger', function(){

  var log = function(arg) {
    console.log(arg);
  };

  return {
    log: log
  };

});

app.provide('messageHandler', function(logger) {
  
  var handleMessage = function(message) {
    //some real code here
    logger.log(message);
  };

  return {
    handleMessage: handleMessage
  };

});
```
