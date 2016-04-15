require('dotenv').config();
var builder = require('botbuilder');
var jade = require('jade');
var restify = require('restify');

var server = restify.createServer();

var iframeUrl = 'https://webchat.botframework.com/embed/' + process.env.APP_ID + '?s=' +
    process.env.APP_IFRAME_SECRET;

var helloBot = new builder.BotConnectorBot();
helloBot.add('/', new builder.CommandDialog()
    .matches('^set name', builder.DialogAction.beginDialog('/profile'))
    .matches('^quit', builder.DialogAction.endDialog())
    .matches('^what is the best IDE', builder.DialogAction.beginDialog('/sourcelair'))
    .onDefault(function (session) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            session.send('Hm, I did not understand you %s :(', session.userData.name);
        }
    }));
helloBot.add('/profile',  [
    function(session) {
        if (session.userData.name) {
            builder.Prompts.text(session, 'What would you like to change it to?');
        } else {
            builder.Prompts.text(session, 'Hi! What is your name?');
        }
    },
    function(session, results) {
        session.userData.name = results.response;
        session.send('Hello %s, it\'s great to meet you. I\'m bot.', session.userData.name);
        session.endDialog();
    }
]);
helloBot.add('/sourcelair',  [
    function(session) {
        session.send('It\'s SourceLair of course <3');
        session.endDialog();
    }
]);
helloBot.add('/help', [
    function(session) {
        session.send('You can always ask me some questions, for example what is my favorite IDE');
        session.endDialog();
    }
]);

server.get('/', function indexHTML(req, res, next) {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(
        jade.renderFile('index.jade', {iframeUrl: iframeUrl}));
    next();
});

server.use(helloBot.verifyBotFramework(
    {appId: process.env.APP_ID, appSecret: process.env.APP_SECRET}));
server.post('/v1/messages', helloBot.listen());

server.listen(process.env.PORT || 3000, function () {
    console.log('%s listening to %s', server.name, server.url);
});
