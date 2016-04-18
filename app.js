'use strict';

require('dotenv').config();
const builder = require('botbuilder');
const jade = require('jade');
const restify = require('restify');
const request = require('request');


// Create the API server for the bot
let server = restify.createServer();
server.listen(process.env.PORT || 3000, () => {
    console.log(`Your bot is listening to https://${process.env.SL_PUBLIC_URL}`);
    console.log(`Make sure you have added https://${process.env.SL_PUBLIC_URL}/api/messages as your messaging endpoint`);
});

// Setup the integration with BotFramework
let connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD,
});
server.post('/api/messages', connector.listen());

// Create a bot and add dialogs
let helloBot = new builder.UniversalBot(connector);
helloBot.dialog('/', new builder.IntentDialog()
    .matches(/^set name/i, builder.DialogAction.beginDialog('/profile'))
    .matches(/^quit/i, builder.DialogAction.endDialog())
    .matches(/^what.+(best|favorite).+IDE/i, builder.DialogAction.beginDialog('/sourcelair'))
    .matches(/^(\?|help)/i, builder.DialogAction.beginDialog('/help'))
    .matches(/^ip/, builder.DialogAction.beginDialog('/ip'))
    .onDefault((session) => {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            session.send(`Hm, I did not understand you ${session.userData.name} :(`);
        }
    }));
helloBot.dialog('/profile',  [
    (session) => {
        if (session.userData.name) {
            builder.Prompts.text(session, 'What would you like to change it to?');
        } else {
            builder.Prompts.text(session, 'Hi! What is your name?');
        }
    },
    (session, results) => {
        session.userData.name = results.response;
        session.send(`Hello ${session.userData.name}, it\'s great to meet you. I\'m bot.`);
        session.endDialog();
    }
]);
helloBot.dialog('/sourcelair',  [
    (session) => {
        session.send('It\'s SourceLair of course <3');
        session.endDialog();
    }
]);
helloBot.dialog('/help', [
    (session) => {
        session.send('You can always ask me some questions, for example what is my favorite IDE');
        session.endDialog();
    }
]);
helloBot.dialog('/ip', [
    (session) => {
        builder.Prompts.text(session, 'Which IP you\'d like to track?');
    },
    (session, results) => {
        var ip = results.response;
        request('http://ip-api.com/json/' + ip, (error, response, body) => {
            if (error) {
                session.send('Ooops, there was an error with your request "%s"', error);
                session.endDialog();
                return;
            }
            if (response.statusCode !== 200) {
                session.send('Ooops, we got a wrong status code "%s"', response.statusCode);
                session.endDialog();
                return;
            }

            try {
                body = JSON.parse(body);
            } catch(err) {
                session.send('Hmmm, the server responded with a wrong resopnse, interesting...');
                session.endDialog();
                return;
            }

            if (body.status !== 'success') {
                session.send('There\'s something wrong here, does this help? "%s"', body.message);
                session.endDialog();
                return;
            }

            session.send('Hooray, the IP is located at %s, %s', body.city, body.country);
            session.endDialog();
        });
    }
]);

// Setup the iframe for the webchat
let iframeUrl = `https://webchat.botframework.com/embed/${process.env.BOT_HANDLE}?s=${process.env.APP_IFRAME_SECRET}`;
server.get('/', (req, res, next) => {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(jade.renderFile('index.jade', {iframeUrl: iframeUrl}));
    next();
});
