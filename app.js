const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const botResponses = require('./botResponses');


const SESSION_FILE_PATH = './session.json';
let sessionData;
let client;

const withSession = () => {
    const spinner = ora(`Loading ${chalk.yellow('Validating Whatsapp session...')}`);
    sessionData = require(SESSION_FILE_PATH);
    spinner.start();
    client = new Client({ session: sessionData });

    client.on('ready', () => {
        console.log('\nClient is ready!');
        spinner.stop();
        listenMessage();
    });

    client.on('auth_failure', () => {
        spinner.stop();
        console.log('Authentications Error! Please re-authenticate with a new qrcode (delete session.json)');
    });

    client.initialize();
};

//qrcode generate
const withoutSession = () => {
    console.log('Session not saved');
    client = new Client();

    client.on('qr', (qr) => {
        console.log(qr);
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', (session) => {
        //save session credentials
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(sessionData), (err) => {
            if (err) console.log(err);
        });
        console.log('Your session has been saved!');
    });

    client.initialize();
};

const listenMessage = () => {
    client.on('message', (msg) => {
        let { from, to, body } = msg;
        //delete accent marks and lowercase
        body = body.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        //find key word to give a response
        body = body.split(' ').find(word => botResponses[word]);
        let response = botResponses[body] || 'El robot no puede responder a eso, vuelve a intentarlo.';
        sendMessage(from, response);
        console.log(`${chalk.yellow(body, from, to)}`);
    });
};

const sendMessage = (to, msg) => {
    client.sendMessage(to, msg);
};

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withoutSession();
