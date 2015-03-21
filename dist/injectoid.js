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

    var Injectoid = function() {
        var self = this;
        var readyModules = {};
        var pendingModules = {};
        var pendingRuns = [];

        var resolveAvailablePendingRuns = function() {
            if (pendingRuns.length === 0) { return; }
            pendingRuns.forEach(function(pendingRunInfo) {
                var pendingRunArgs = pendingRunInfo.args;
                var modulesReady = modulesAreReady(pendingRunArgs, readyModules);
                if (!modulesReady) { return }
                var runDependencies = buildDepsList(pendingRunArgs, readyModules);
                invokeCallback(runDependencies, pendingRunInfo.callback);
            });
        };

        var tryResolvePendingModules = function() {
            var pendingModulesKeys = Object.keys(pendingModules);
            if (pendingModulesKeys.length === 0) { return; }
            pendingModulesKeys.forEach(function(pendingModuleName) {
                var pendingCallback = pendingModules[pendingModuleName];
                if (!pendingCallback) return;
                resolveModules(pendingModuleName, pendingCallback)
            });
        };

        var resolveModule = function(moduleName, resolver) {
            delete pendingModules[moduleName];
            readyModules[moduleName] = resolver;
        };

        var resolveFunction = function(moduleName, func) {
            var args = parseFunctionArgs(func);
            checkForCircular(moduleName, args, pendingModules);
            if (modulesAreReady(args, readyModules)) {
                var moduleDependencies = buildDepsList(args, readyModules);
                var resolver = invokeCallback(moduleDependencies, func);
                resolveModule(moduleName, resolver);
                tryResolvePendingModules();
            } else {
                pendingModules[moduleName] = func;
            }
        };

        var resolveSimpleValue = function(moduleName, value) {
            resolveModule(moduleName, value);
            tryResolvePendingModules();
        };

        var resolveModules = function(moduleName, provider) {
            if (typeof provider === 'function') {
                resolveFunction(moduleName, provider);
            } else {
                resolveSimpleValue(moduleName, provider);
            }
            resolveAvailablePendingRuns();
        };

        self.provide = function(moduleName, provider) {
            resolveModules(moduleName, provider);
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
