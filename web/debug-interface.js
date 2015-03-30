var async = require("async");

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var openToIdentify = 4000; // time to wait in ms for devices to reset before requesting identity
var timeout = openToIdentify + 1000;

// ASCII codes for filtering incoming lines
var reply = '`'; 
var info = '~';

var cmds = {
    'ip': 'a',
    'dfu': 'b'
};

function findPorts(callback) {
    var identify = new Buffer(1);
    identify[0] = 63; // = ?

    serialport.list(function (err, ports) {
        if (err) callback(err);

        async.map(ports,
            function(portInfo, callback) {
                var port = new SerialPort(portInfo.comName, {
                    baudrate: 115200,
                    parser: serialport.parsers.readline("\r\n")
                });

                var timeoutID = setTimeout(function() {
                    if(port.isOpen())
                        port.close();
                    callback(null, null);
                }, timeout);

                port.on("open", function() {
                    setTimeout(function() {
                        if(port.isOpen())
                            port.write(identify);
                    }, openToIdentify); // give Arduinos time to finish resetting

                    port.on("data", function(data) {
                        clearTimeout(timeoutID);

                        var reply = data.trim();

                        switch(reply) {
                            case "`reset":
                                port.removeAllListeners();
                                callback(null, { id: "reset", port: port });
                                break;
                            case "`spark":
                                port.removeAllListeners();
                                callback(null, { id: "spark", port: port });
                                break;
                            default:
                                console.log("weird data", data);
                                callback(null, null);
                                break;
                        }
                    });
                });
            },
            function(err, identities) {
                var ports = {};
                for (var i = 0; i < identities.length; i++) {
                    var id = identities[i];
                    if(id != null) {
                        ports[id.id] = id.port;
                    }
                }

                if ("reset" in ports && "spark" in ports) {
                    callback(err, ports.reset, ports.spark);
                } else if ("reset" in ports) {
                    console.log("Spark AWOL. Resetting.");

                    // spark is awol, so reset it and try again
                    ports.reset.write("r");

                    setTimeout(function() {
                        findPorts(callback);
                    }, 10000);
                } else {
                    callback(new Error("No devices found."));
                }
            }
        );
    });
}

function DebugInterface() {
    var interface = this;

    this.callbackQueue = [];
    this.commandQueue = [];

    findPorts(function(err, resetPort, sparkPort) {
        if (err) throw err;

        interface.resetPort = resetPort;
        interface.sparkPort = sparkPort;

        if (interface.sparkPort.isOpen()) {
            interface.setupSparkPort();
        } else {
            interface.sparkPort.on('open', function() {
                interface.setupSparkPort;
            });
        }
    });
}

DebugInterface.prototype.setupSparkPort = function() {
    var interface = this;

    this.sparkPort.on("data", function(data) {
        var line = data.toString().trim();

        switch(data[0]) {
            case reply:
                var callback = interface.callbackQueue.shift();
            callback(line.slice(1, line.length));
            break;
            case info:
                console.log("info:", line.slice(1, line.length));
            break;
            default:
                console.log("unflagged:", line);
            break
        }
    });

    // send commands queued before connection was open
    for(var i = 0; i < this.commandQueue.length; i++) {
        var command = this.commandQueue.shift();
        this.sparkPort.write(command);
    }
}

DebugInterface.prototype.ask = function(cmd, callback) {
    this.callbackQueue.push(callback);

    if(this.sparkPort !== undefined && this.sparkPort.isOpen()) {
        this.sparkPort.write(cmd);
    } else {
        this.commandQueue.push(cmd);
    }
}

DebugInterface.prototype.getIP = function(callback) {
    this.ask(cmds.ip, function(ip) { callback(ip); });
}

module.exports = DebugInterface;
