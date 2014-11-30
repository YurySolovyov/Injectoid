Injector
========
Injector helps you to compose your app using modules

###Usage

```javascript
var app = new Injector();

app.provide('logger', function() {

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
### API
### `Constructor`
Creates new Injector instance. Should be used with `new`

```javascript
var app = new Injector();
```
###`app.provide(moduleName, provider);`

Adds module to app with specified `moduleName`.
* `moduleName: [string]`.
Used to name module in an app.
* `provider: [function | object | value]`. Can be a factory function, or just plain JavaScript value/object.

  * If function form is used, DI feature becomes available.
    * **NOTE:** function MUST return some value/object, so module can be treated as initialized.

    * Required modules become available as arguments of factory function.

    * If not all required modules are available, factory function is put into a queue, until all required modules are registered.



  * If value/object form is used, module gets immediately available as `moduleName`

###`app.run(resolvable);`
* `resolvable: [function]`. Function is called with resolved modules as arguments. Useful if you need to obtain a reference to some module, or call something just once.

### License
The MIT License (MIT)
