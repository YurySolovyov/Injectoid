(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports === 'object') {
        factory(exports);
    } else {
        factory(root);
    }
}(this, function (exports) {
    var Injectoid = function() {
        var self = this;
        var funcRegexp = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var readyModules = {};
        var pendingModules = {};
        var pendingRuns = [];

        var parseFunctionArgs = function(func) {
            var matched = func.toString().match(funcRegexp);
            return matched[1].split(/\s*,\s*/gi).filter(function(arg) {
                return arg && arg.length > 0;
            });
        };

        var buildDepsList = function(args) {
            return args.map(function(module) {
                return readyModules[module];
            });
        };

        var modulesAreReady = function(args) {
            return args.every(function(arg) {
                return readyModules.hasOwnProperty(arg);
            });
        };

        var invokeCallback = function(modulesList, callback) {
            return callback.apply(null, modulesList);
        };

        var checkForCircular = function(moduleName, moduleDependencies, checked) {
            var checked = checked || [];
            moduleDependencies.forEach(function(dependencyName) {
                var pendingCallback = pendingModules[dependencyName];
                if (!pendingCallback) return;
                var callbackDeps = parseFunctionArgs(pendingCallback);
                checked = checked.concat(callbackDeps);
                if (checked.indexOf(moduleName) > -1) {
                    var message = 'Circular dependency detected: ' + moduleName + ' <=> ' + dependencyName;
                    throw new Error(message);
                } else {
                    checkForCircular(moduleName, callbackDeps, checked);
                }
            });
        };

        var resolveAvailablePendingRuns = function() {
            pendingRuns.forEach(function(pendingRunInfo) {
                var pendingRunArgs = pendingRunInfo.args;
                if (modulesAreReady(pendingRunArgs)) {
                    invokeCallback(buildDepsList(pendingRunArgs), pendingRunInfo.callback);
                }
            });
        };

        var tryResolvePendingModules = function() {
            Object.keys(pendingModules).forEach(function(pendingModuleName) {
                var pendingCallback = pendingModules[pendingModuleName];
                if (!pendingCallback) return;
                resolveModules(pendingModuleName, pendingCallback)
            });
        };

        var resolveModule = function(moduleName, resolver) {
            delete pendingModules[moduleName];
            readyModules[moduleName] = resolver;
        };

        var resolveModules = function(moduleName, provider) {
            if (typeof provider === 'function') {
                var args = parseFunctionArgs(provider);
                checkForCircular(moduleName, args);
                if (modulesAreReady(args)) {
                    var resolver = invokeCallback(buildDepsList(args), provider);
                    resolveModule(moduleName, resolver);
                    tryResolvePendingModules();
                } else {
                    pendingModules[moduleName] = provider;
                }
            } else {
                resolveModule(moduleName, provider);
                tryResolvePendingModules();
            }
            resolveAvailablePendingRuns();
        };

        self.provide = function(moduleName, provider) {
            resolveModules(moduleName, provider);
            return self;
        };

        self.run = function(callback) {
            var args = parseFunctionArgs(callback);
            if (modulesAreReady(args)) {
                invokeCallback(buildDepsList(args), callback);
            } else {
                pendingRuns.push({
                    args: args,
                    callback: callback
                });
            }
            return self;
        };

    };
    exports.Injectoid = Injectoid;
}));
