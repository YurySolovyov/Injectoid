(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports === 'object') {
        factory(exports);
    } else {
        factory(root);
    }
}(this, function (exports) {

    var fnRegexp = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var parseFunctionArgs = function(func) {
        var matched = func.toString().match(fnRegexp);
        return matched[1].split(/\s*,\s*/gi).filter(function(arg) {
            return arg && arg.length > 0;
        });
    };

    var invokeCallback = function(modulesList, callback) {
        return callback.apply(null, modulesList);
    };

    var buildDepsList = function(args, readyModules) {
        return args.map(function(moduleName) {
            return readyModules[moduleName];
        });
    };

    var modulesAreReady = function(args, readyModules) {
        return args.every(function(arg) {
            return readyModules.hasOwnProperty(arg);
        });
    };

    var checkForCircular = function(moduleName, moduleDependencies, pendingModules, checked) {
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
                checkForCircular(moduleName, callbackDeps, pendingModules, checked);
            }
        });
    };

    var checkProviderType = function(provider) {
        if (typeof provider === 'undefined') {
            throw new TypeError("Provider must be a function, object or value");
        }
    };

    var resolveAvailablePendingRuns = function(pendingRuns, readyModules) {
        if (pendingRuns.length === 0) { return; }
        pendingRuns.forEach(function(pendingRunInfo) {
            var pendingRunArgs = pendingRunInfo.args;
            var modulesReady = modulesAreReady(pendingRunArgs, readyModules);
            if (!modulesReady) { return }
            var runDependencies = buildDepsList(pendingRunArgs, readyModules);
            invokeCallback(runDependencies, pendingRunInfo.callback);
        });
    };

    var Injectoid = function() {
        var self = this;
        var readyModules = {};
        var pendingModules = {};
        var pendingRuns = [];

        var tryRegisterModule = function(moduleName, args, providerFunc) {
            var modulesReady = modulesAreReady(args, readyModules);
            if (modulesReady) {
                var moduleDependencies = buildDepsList(args, readyModules);
                var resolver = invokeCallback(moduleDependencies, providerFunc);
                registerModule(moduleName, resolver);
                tryResolvePendingModules();
            }
            return modulesReady;
        };

        var tryResolvePendingModules = function() {
            var pendingModulesKeys = Object.keys(pendingModules);
            if (pendingModulesKeys.length === 0) { return; }
            pendingModulesKeys.forEach(function(moduleName) {
                var moduleInfo = pendingModules[moduleName];
                if(!moduleInfo) { return; }
                tryRegisterModule(moduleName, moduleInfo.args, moduleInfo.callback);
            });
        };

        var registerModule = function(moduleName, moduleObj) {
            delete pendingModules[moduleName];
            readyModules[moduleName] = moduleObj;
        };

        var resolveFunction = function(moduleName, func) {
            var args = parseFunctionArgs(func);
            checkForCircular(moduleName, args, pendingModules);
            var registered = tryRegisterModule(moduleName, args, func);
            if (!registered) {
                pendingModules[moduleName] = {
                    args: args,
                    callback: func
                };
            }
        };

        var resolveSimpleValue = function(moduleName, value) {
            registerModule(moduleName, value);
            tryResolvePendingModules();
        };

        var resolveModule = function(moduleName, provider) {
            checkProviderType(provider);
            if (typeof provider === 'function') {
                resolveFunction(moduleName, provider);
            } else {
                resolveSimpleValue(moduleName, provider);
            }
            resolveAvailablePendingRuns(pendingRuns, readyModules);
        };

        self.provide = function(moduleName, provider) {
            resolveModule(moduleName, provider);
            return self;
        };

        self.run = function(callback) {
            var args = parseFunctionArgs(callback);
            if (modulesAreReady(args, readyModules)) {
                var moduleDependencies = buildDepsList(args, readyModules);
                invokeCallback(moduleDependencies, callback);
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
