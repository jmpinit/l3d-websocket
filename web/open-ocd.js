var net = require('net'),
    async = require('async'),
    colors =  require('colors');

var debug = false;

var terminator = 0x1A;

function OpenOCD() {
    this.client = new net.Socket();
    this.replyHandlers = [];
    this.eventHandlers = {};
    this.stateHandlers = {};

    this.state = null;
}

OpenOCD.prototype.send = function(command, callback) {
    callback = callback || function() {};

    if (Object.prototype.toString.call(command) === '[object Array]') {
        var commands = command;

        async.mapSeries(commands,
            (function(command, callback) {
                this.send(command, function(reply) {
                    callback(null, reply);
                });
            }).bind(this),

            function (err, replies) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, replies);
                }
            }
        );
    } else {
        var message = new Buffer(command.length + 1);

        if (debug) console.log("command".blue, command);

        message.write(command);
        message[message.length-1] = terminator;

        this.replyHandlers.push(callback);
        this.client.write(message);
    }
};

OpenOCD.prototype.when = function(state, callback) {
    if (this.state === state) {
        callback();
    } else {
        if (!(state in this.stateHandlers)) {
            this.stateHandlers[state] = [];
        }

        this.stateHandlers[state].push(callback);
    }
};

OpenOCD.prototype.on = function(type, callback) {
    // TODO reject non-existent event types

    if (!(type in this.eventHandlers))
        this.eventHandlers[type] = [];

    this.eventHandlers[type].push(callback);
};

OpenOCD.prototype.callEventHandlers = function(type, data) {
    if (type in this.eventHandlers) {
        var handlers = this.eventHandlers[type];
        async.applyEach(handlers, data, function() {});
    }
};

OpenOCD.prototype.updateState = function(newState) {
    this.state = newState;

    if (debug) console.log("state".yellow, this.state);

    if (this.state in this.stateHandlers) {
        var handlers = this.stateHandlers[this.state];
        async.parallel(handlers);
        delete this.stateHandlers[this.state];
    }
};

OpenOCD.prototype.handleEvent = function(eventString) {
    var parts = eventString.trim().split(' ');
    var data = {};

    if (parts.length % 2 == 0) {
        for (var i = 0; i < parts.length; i += 2) {
            data[parts[i]] = parts[i+1];
        }

        if (debug) console.log("event".green, data);
        
        if ('type' in data) {
            var type = data.type;
            delete data['type'];

            if (type == 'target_event') {
                type = data.event;
                delete data['event'];
            }

            this.callEventHandlers(type, data);

            // state change?
            if (type == 'target_state') {
                this.updateState(data.state);
            }
        } else {
            console.log("malformed event (missing type):".red, eventString);
        }
    } else {
        console.log("malformed event:".red, eventString);
    }
};

OpenOCD.prototype.connect = function(port, callback) {
    port = port || 6666;

    this.client.on('data', (function(data) {
        var message = data.slice(0, data.length-1).toString();

        if (message.indexOf("type") == 0) {
            var lines = message.split('\r\n\u001A');

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();

                if(line != "") {
                    this.handleEvent(lines[i]);
                }
            }
        } else {
            if (debug) console.log("reply".gray, message);
            var handler = this.replyHandlers.shift();
            handler(message);
        }
    }).bind(this));

    this.client.on('error', function(err) {
        callback(err);
    });

    this.client.connect(port, '127.0.0.1', function() {
        callback();
    });
};

OpenOCD.prototype.disconnect = function(callback) {
    this.client.removeAllListeners();
    this.client.end();
    this.client.destroy();
    callback();
};

module.exports = OpenOCD;
