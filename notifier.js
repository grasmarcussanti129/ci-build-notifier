const nodemailer = require('nodemailer');
const { WebClient } = require('@slack/web-api');
const config = require('./config.json');

function notifyEmail(subject, message) {
    const transporter = nodemailer.createTransport({
        service: config.email.service,
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    });

    const mailOptions = {
        from: config.email.user,
        to: config.email.to,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log('Error sending email: ', error);
        }
        console.log('Email sent: ' + info.response);
    });
}

function notifySlack(message) {
    if (config.slack.enabled) {
        const slackClient = new WebClient(config.slack.token);
        slackClient.chat.postMessage({
            channel: config.slack.channel,
            text: message
        }).then((res) => {
            console.log('Message sent to Slack:', res.ts);
        }).catch((err) => {
            console.error('Error sending Slack message:', err);
        });
    }
}

function monitorBuildStatus() {
    // Here you would typically check the build status from the CI system
    // This is a mocked response for demonstration purposes
    const buildStatus = Math.random() > 0.5 ? 'success' : 'failure';

    if (buildStatus === 'success') {
        const message = 'Build succeeded!';
        notifyEmail('Build Status Update', message);
        notifySlack(message);
    } else {
        const message = 'Build failed!';
        notifyEmail('Build Status Update', message);
        notifySlack(message);
    }
}

// Run the build status monitor
monitorBuildStatus();
