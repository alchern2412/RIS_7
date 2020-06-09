const config = require('config')

const PORT = config.get('PORT') || 5555;
const HOST = config.get('HOST_DISPATCHER') || '127.0.0.1';

const dgram = require('dgram');
const message = new Buffer('TIME');

const client = dgram.createSocket('udp4');

client.on('message', message => {
    console.log('Received time: ' + message.toString());
    client.close();
});

client.send(message, 0, message.length, PORT, HOST, function (err, bytes) {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST + ':' + PORT);
});

