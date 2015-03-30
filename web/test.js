var util = require('util');

var WebSocketClient = require('websocket').w3cwebsocket;
var DebugInterface = require('./debug-interface');

var port = 2525;

function connect(client) {
    client.onerror = function(error) {
        console.log('Connection Error', error);
    }

    client.onopen = function() {
        console.log('WebSocket Client Connected');

        if (client.readyState === client.OPEN) {
            var frame = new ArrayBuffer(512);
            var view = new Uint8Array(frame);
            for(var i = 0; i < view.length; i++)
                view[i] = Math.floor(Math.random()*256);
            client.send(frame);
            console.log("sent frame");
        }
    };

    client.onclose = function() {
        console.log('echo-protocol Client Closed');
    };

    client.onmessage = function(e) {
        if (typeof e.data === 'string') {
            console.log("Received: '" + e.data + "'");
        }
    };
}

/*var address = util.format("ws://192.168.1.5:%s/", port);
ws = new WebSocketClient(address);

console.log("connecting to", address);
connect(ws);
*/

var debug = new DebugInterface();

exports.testGetIP = function(test) {
    test.expect(1);
    debug.getIP(function(ip) {
        test.ok(ip === "192.168.1.5");
        test.done();
    });
}
