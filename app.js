const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const botResponses = require('./botResponses');
const exceljs = require('exceljs');
const moment = require('moment');

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
        saveHistorial(from, msg.body);

        console.log(`${chalk.yellow(msg.body, from, to)}`);
    });
};

const sendMessage = (to, msg) => {
    client.sendMessage(to, msg);
};

const sendMedia = (to, file) => {
    const mediaFile = MessageMedia.fromFilePath(`./media/${file}`);
    client.sendMessage(to, mediaFile);
};

//save number and message in a excel file
const saveHistorial = (number, msg) => {
    const pathChat = `./chats/${number}.xlsx`;
    const workbook = new exceljs.Workbook();
    const today = moment().format('DD-MM-YYYY hh:mm');

    if (fs.existsSync(pathChat)) {
        workbook.xlsx.read(pathChat)
            .then(() => {
                const worksheet = workbook.getWorksheet(1);
                const lastRow = worksheet.lastRow;
                let getRowInsert = worksheet.getRow(++(lastRow.number));
                getRowInsert.getCell('A').value = today;
                getRowInsert.getCell('A').value = msg;
                getRowInsert.commit();
                worksheet.xlsx.writeFile(pathChat)
                    .then(() => {
                        console.log('Chat added!')
                    }).catch(() => {
                        console.log('Something went wrong!')
                    });
            });
    } else {
        //create a xlsx file with phone number
        const worksheet = workbook.addWorksheet('Chats');
        worksheet.columns = [
            { header: 'Fecha', key: 'date' },
            { header: 'Mensaje', key: 'message' }
        ];
        worksheet.addRow([today, msg]);
        workbook.xlsx.writeFile(pathChat)
            .then(() => {
                console.log('History created!')
            }).catch(() => {
                console.log('Something went wrong!');
            });
    };
};

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withoutSession();
