const config = require('config')
const fs = require('fs')
const PORT = config.get('PORT') || 5555;
const HOST = config.get('HOST_DISPATCHER') || '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('listening', function () {
    const address = server.address();
    console.log('UDP Server listening on ' + address.address + ':' + address.port);
});

const client = {};

server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port + ' - ' + message);
    switch (message.toString()) {
        case "TIME": {
            const coordinator = JSON.parse(fs.readFileSync('./coordinator.json', 'utf8'));

            const message = Buffer.from("TIME");
            server.send(message, 0, message.length, PORT, coordinator.HOST_COORDINATOR, function (err, bytes) {
                if (err) {
                    console.error(err)
                };
            });
            client.host = remote.address
            client.port = remote.port
            break;
        }
        default:
            server.send(message, 0, message.length, client.port, client.host, function (err, bytes) {
                if (err) {
                    console.error(err)
                };
            });
            break;

    }
});

server.bind(PORT, HOST);