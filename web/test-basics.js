var util = require('util')
    async = require('async');

var WebSocketClient = require('websocket').w3cwebsocket;
var TestInterface = require('./test-interface');

function startInterface(callback) {
    var cube = new TestInterface();
    cube.connect(function(err) {
        callback(err, cube);
    });
}

module.exports.testInterface = {
    setUp: function (callback) {
        startInterface((function(err, cube) {
            this.connectError = err;
            this.cube = cube;
            callback();
        }).bind(this));
    },
    tearDown: function (callback) {
        this.cube.disconnect(function() {
            callback();
        });
    },

    testGetIP: function (test) {
        test.expect(5);

        if(this.connectError !== undefined) {
            test.ok(false, "Connection error: " + this.connectError);
            test.done();
        } else {
            var ipMatcher = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

            test.ok(ipMatcher.test("192.168.1.1"));
            test.ok(!ipMatcher.test("192.168"));
            test.ok(!ipMatcher.test(""));

            var cube = this.cube; // FIXME
            this.cube.getIP(function(ip) {
                test.ok(ipMatcher.test(ip), ip + " is not a valid IP address.");
                test.ok(ip !== "0.0.0.0", "Cube failed to initialize network.");
                test.done();
            });
        }
    }
};

module.exports.testCommunication = {
    setUp: function (callback) {
        startInterface((function(err, cube) {
            this.connectError = err;
            this.cube = cube;

            this.cube.getIP((function(ip) {
                var address = util.format("ws://%s:%s/", ip, this.cube.port);
                this.ws = new WebSocketClient(address);
                callback();
            }).bind(this));
        }).bind(this));
    },
    tearDown: function (callback) {
        var ctx = this;

        async.parallel([
            function (cb) {
                ctx.cube.disconnect(function() {
                    cb();
                });
            },
            function (cb) {
                ctx.ws.close();
                cb();
            }
        ], function(err) { callback(); });
    },

    testOneFrame: function(test) {
        test.expect(1);

        var done = false;

        var frame = new ArrayBuffer(512);
        var view = new Uint8Array(frame);
        for (var i = 0; i < view.length; i++)
            view[i] = Math.floor(Math.random()*256);

        this.ws.onerror = function(err) {
            if (done) return;
            done = true;

            console.log(err);
            test.ok(false);
            test.done();
        };

        this.ws.onclose = function() {
            if (done) return;
            done = true;

            test.ok(false);
            test.done();
        };

        this.ws.onmessage = function(event) {
            if (done) return;
            done = true;

            var message = event.data;
            test.ok(message === "512");
            test.done();
        };

        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(frame);
        } else {
            this.ws.onopen = (function() {
                this.ws.send(frame);
            }).bind(this);
        }
    },
    //testOverMTU: function(test) {
    //    test.expect(1);
    //}
};
