DEPRECATED. DON'T USE IT. NAIVE IDEA. USE [WEBPACK](https://github.com/webpack/webpack) OR [ROLLUP](https://github.com/rollup/rollup)
========

Injectoid [![npm version](https://badge.fury.io/js/injectoid.svg)](http://badge.fury.io/js/injectoid)
========
Injectoid helps you to compose your app using modules


### Installing

npm:

`npm install injectoid`

browsers:

Should work with require.js and common.js (not tested)
or
Works as global `Injectoid` constructor

### Usage

```javascript
var Injectoid = require('injectoid').Injectoid;
var app = new Injectoid();

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
Creates new Injectoid instance. Should be used with `new`

```javascript
var app = new Injectoid();
```
### `app.provide(moduleName, provider);`

Adds module to app with specified `moduleName`.
* `moduleName: [string]`.
Used to name module in an app.
* `provider: [function | object | value]`. Can be a factory function, or just plain JavaScript value/object.

  * If function form is used, DI feature becomes available.
    * **NOTE:** function MUST return some value/object, so module can be treated as available.

    * Required modules become available as arguments of `provider` function.

    * If some required modules are not available, `provider` function is put into a queue, until all required modules are available.

  * If value/object form is used, module gets immediately available as `moduleName`

### `app.run(resolvable);`
Calls `resolvable` with resolved modules. Useful if you need to obtain a reference to some module, or call something just once.
* `resolvable: [function]`. Called with resolved modules as arguments.
    * If some required modules are not available, `resolvable` function is put into a queue, as in `app.provide` case.

### License

MIT © Yury Solovyov
