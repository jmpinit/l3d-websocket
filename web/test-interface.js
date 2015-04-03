var colors = require('colors'),
    util = require('util');

var OpenOCD = require('./open-ocd');

var commands = {
    getIP: 'a'
}

function TestInterface() {
    this.ocd = new OpenOCD();
    this.port = 6666;
}

TestInterface.prototype._grabLinkInfo = function(message) {
    if (message.indexOf("comm=") == 0) {
        this.commAddress = parseInt(message.split('=')[1], 16);
        
        this.ocd.when('halted', (function() { // first halt from reset
            //this.ocd.when('halted', (function() { // second halt from breakpoint
            setTimeout((function() {
                this.ocd.send('capture "resume"');

                if (this._connectCallback !== undefined && this._connectCallback !== null) {
                    this._connectCallback();
                }
            }).bind(this), 1000);
            //}).bind(this));
        }).bind(this));
    } else {
        console.log("could not grab link info".red, message);
        // TODO error event
    }
};

TestInterface.prototype.connect = function(callback) {
    this._connectCallback = callback;
    this.messageHandlers = [ this._grabLinkInfo.bind(this) ];

    this.ocd.on('semihost-message', (function(data) {
        var message = data.message.slice(1, data.message.length);

        var handler = this.messageHandlers.shift();
        handler(message);
    }).bind(this));

    this.ocd.connect(this.port, (function(err) {
        if (err) {
            callback(err);
        } else {
            this.ocd.send(
                [
                    'tcl_notifications on',
                    'capture "arm semihosting enable"',
                    'reset run'
                ]
            );
        }
    }).bind(this));
};

TestInterface.prototype.disconnect = function(callback) {
    this.ocd.disconnect(callback);
};

TestInterface.prototype.sendCommand = function(command, callback) {
    var ocdCommand = util.format('capture "mwb 0x%s %d"', this.commAddress.toString(16), command.charCodeAt(0));

    this.messageHandlers.push(callback);
    this.ocd.send(ocdCommand, function(reply) {});
};

TestInterface.prototype.getIP = function(callback) {
    this.sendCommand(commands.getIP, function(reply) {
        callback(reply);
    });
};

module.exports = TestInterface;
