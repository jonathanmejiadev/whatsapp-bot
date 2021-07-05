const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');


const SESSION_FILE_PATH = './session.json';

const withSession = () => {

};

//qrcode generate
const withoutSession = () => {
    console.log('Session not saved');
    const client = new Client();

    client.on('qr', (qr) => {
        console.log(qr);
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', (session) => {
        //save session credentials
        let sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(sessionData), (err) => {
            if (err) console.log(err);
        });
        console.log('Your session has been saved!');
    });

    client.initialize();
};

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withoutSession();
