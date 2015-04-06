var util = require('util');

var WebSocketClient = require('websocket').w3cwebsocket;
var TestInterface = require('./test-interface');

function startInterface(callback) {
    var cube = new TestInterface();
    cube.connect(function(err) {
        callback(err, cube);
    });
}

module.exports = {
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

exports.testCommunication = {
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

        var frame = new ArrayBuffer(512);
        var view = new Uint8Array(frame);
        for (var i = 0; i < view.length; i++)
            view[i] = Math.floor(Math.random()*256);

        this.cube.ws.onmessage = function(event) {
            var message = event.data;
            test.ok(message === "512");
            test.done();
        };

        if (client.readyState === client.OPEN) {
            this.cube.ws.send(frame);
        } else {
            this.cube.ws.onopen = function() {
                this.cube.ws.send(frame);
            };
        }
    },
    //testOverMTU: function(test) {
    //    test.expect(1);
    //}
};
