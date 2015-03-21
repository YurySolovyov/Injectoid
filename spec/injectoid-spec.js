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
});


describe(".run method", function () {
    var app;
    beforeEach(function() {
        app = new Injectoid();
    });

    it("should recive registered modules", function() {
        app.provide('Module', function() {
            return { foo: 42 };
        });
        app.run(function(Module) {
            expect(Module).toEqual({ foo: 42 });
        });
    });
});
