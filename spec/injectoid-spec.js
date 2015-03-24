var Injectoid = require('../dist/injectoid.js').Injectoid;

describe("instance creation", function () {
    it("should create an Injectoid instance", function() {
        var app = new Injectoid();
        expect(app.provide).toBeDefined();
        expect(app.run).toBeDefined();
    });
});

describe(".provide method", function () {
    var app;
    beforeEach(function() {
        app = new Injectoid();
    });

    it("should accept plain object", function () {
        var object = { foo: 42 };
        app.provide('Module', object);
        app.provide('TestModule', function(Module) {
            expect(Module).toBe(object);
            return {};
        });
    });

    it("should accept a function", function() {
        app.provide('Module', function() {
            return { foo: 42 };
        });
        app.provide('TestModule', function(Module) {
            expect(Module).toEqual({ foo: 42 });
        });
    });

    it("should allow pending modules", function() {
        app.provide('ModuleOne', function(ModuleTwo) {
            return { foo: ModuleTwo.bar };
        });

        app.provide('ModuleTwo', function(ModuleThree) {
            return { bar: ModuleThree.bax };
        });

        app.provide('ModuleThree', function() {
            return { bax: 42 };
        });

        app.provide('TestModule', function(ModuleOne) {
            expect(ModuleOne.foo).toBe(42);
            return {};
        });
    });

    it("should throw on circular dependency", function() {
        app.provide('ModuleOne', function(ModuleTwo) {
            return { foo: 42 };
        });
        expect(function() {
            app.provide('ModuleTwo', function(ModuleOne) {
                return { foo: 24 };
            });
        }).toThrow();
    });

    it("should throw when passind undefined as provider", function() {
        expect(function() {
            app.provide('ModuleOne', undefined);
        }).toThrow();
    });
});


describe(".run method", function () {
    var app;
    beforeEach(function() {
        app = new Injectoid();
    });

    it("should recive registered modules", function() {
        var moduleObj = { foo: 42 };

        app.provide('Module', moduleObj);
        app.run(function(Module) {
            expect(Module).toBe(moduleObj);
        });
    });

    it("should allow pending runs", function() {
        var moduleOne = { foo: 42 };
        var moduleTwo = { bar: 24 };

        app.run(function(ModuleOne, ModuleTwo) {
            expect(ModuleOne).toBe(moduleOne);
            expect(ModuleTwo).toBe(moduleTwo);
        });

        app.provide('ModuleOne', moduleOne);
        app.provide('ModuleTwo', moduleTwo);
    });
});
