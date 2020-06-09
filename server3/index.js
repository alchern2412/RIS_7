const config = require('config')
const fs = require('fs');


const PORT = config.get('PORT') || 5555;
const HOST = config.get('HOST3') || '127.0.0.4';
const CLIENT_HOST = config.get('HOST_DISPATCHER') || '127.0.0.1';

const BROADCAST_ADDR = config.get('HOST_BROADCAST') || '127.0.0.255';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

let coordinator_exists = 0;

server.on('listening', function () {
    const address = server.address();
    console.log('UDP Server listening on ' + address.address + ':' + address.port);
});

server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port + ' - ' + message);
    const coordinator = JSON.parse(fs.readFileSync('./coordinator.json', 'utf8'));

    switch (message.toString()) {
        case "TIME": {
            const message = new Date().toUTCString()
            server.send(message, 0, message.length, PORT, CLIENT_HOST, function (err, bytes) {
                if (err) {
                    console.error(err)
                };
            });
            break;
        }

        case 'COORDINATOR':
            let msgResponse = '';
            if (coordinator.HOST_COORDINATOR === HOST) {
                msgResponse = 'YES'
            } else {
                msgResponse = 'NO'
            }
            server.send(msgResponse, 0, msgResponse.length, remote.port, remote.address, function (err, bytes) {
                if (err) throw err;
                // console.log('UDP server message sent to ' + remote.address + ':' + remote.port);
            });
            break
        case 'YES':
            coordinator_exists = 0
            break
        case 'GET_RANK':

            const remoteAddr = remote.address.split('');
            const myAddr = HOST.split('')

            console.log(`Remote address: ${remote.address}`);
            if (remoteAddr[remoteAddr.length - 1] >= myAddr[myAddr.length - 1]) {
                // console.log('My Rank is LESS')
                // coordinator_exists = 0
            } else {
                coordinator.HOST_COORDINATOR = HOST
                fs.writeFileSync('./coordinator.json', JSON.stringify(coordinator))
                coordinator_exists = 0
            }
            break
    }
});

server.bind(PORT, HOST, () => {
    server.setBroadcast(true)
    setInterval(() => {
        const coordinator = JSON.parse(fs.readFileSync('./coordinator.json', 'utf8'));
        console.log('coordinator_exists', coordinator_exists)
        if (coordinator.HOST_COORDINATOR === HOST) {
            console.log(`I am coordinator. It's okay!`)
            coordinator_exists = 0;
        } else {
            const message = Buffer.from("COORDINATOR");
            server.send(message, 0, message.length, PORT, coordinator.HOST_COORDINATOR, function (err, bytes) {
                if (err) {
                    console.error(err)
                };
            });
            coordinator_exists++;

            setTimeout(() => {
                if (coordinator_exists > 3) {
                    const message = Buffer.from("GET_RANK");
                    server.send(message, 0, message.length, PORT, BROADCAST_ADDR, function (err, bytes) {
                        if (err) {
                            console.error(err)
                        };
                    });
                }
            }, 3000)
        }
    }, 5000)
});