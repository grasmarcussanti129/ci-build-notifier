const nodemailer = require('nodemailer');
const { WebClient } = require('@slack/web-api');
const config = require('./config.json');

/**
 * Sends an email notification about build status.
 * @param {string} subject - The subject of the email.
 * @param {string} message - The message body of the email.
 */
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

    // Send the email with the specified options
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email: ', error);
            return;
        }
        console.log('Email sent: ' + info.response);
    });
}

/**
 * Sends a Slack notification about build status.
 * @param {string} message - The message to be sent to Slack.
 */
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

/**
 * Monitors the build status and sends notifications accordingly.
 * This is a mocked response for demonstration purposes.
 */
function monitorBuildStatus() {
    const buildStatus = Math.random() > 0.5 ? 'success' : 'failure';

    const message = buildStatus === 'success' ? 'Build succeeded!' : 'Build failed!';
    notifyEmail('Build Status Update', message);
    notifySlack(message);
}

// Run the build status monitor
monitorBuildStatus();