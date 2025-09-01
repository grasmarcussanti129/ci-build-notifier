const nodemailer = require("nodemailer");
const { WebClient } = require("@slack/web-api");
const config = require("./config.json");

// dashboard bits
const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const { BuildsStore } = require("./buildsStore.js");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const store = new BuildsStore(200);
const sseClients = new Set();

function sseBroadcast(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) res.write(data);
}

/**
 * Email notification
 */
function notifyEmail(subject, message) {
  const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: { user: config.email.user, pass: config.email.pass }
  });

  const mailOptions = { from: config.email.user, to: config.email.to, subject, text: message };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error sending email:", error);
    else console.log("Email sent:", info.response);
  });
}

/**
 * Slack notification
 */
function notifySlack(message) {
  if (config.slack.enabled) {
    const slackClient = new WebClient(config.slack.token);
    slackClient.chat.postMessage({ channel: config.slack.channel, text: message })
      .then(res => console.log("Slack msg sent:", res.ts))
      .catch(err => console.error("Error sending Slack:", err));
  }
}

/**
 * Monitor build (mocked success/failure for now)
 */
function monitorBuildStatus() {
  const status = Math.random() > 0.5 ? "success" : "failure";
  const build = {
    id: nanoid(8),
    timestamp: Date.now(),
    status,
    branch: "main",
    commit: Math.random().toString(16).slice(2, 9),
    author: "Amisha",
    durationMs: Math.floor(20_000 + Math.random() * 60_000),
    url: config.ci.url
  };

  const message = status === "success" ? "Build succeeded!" : "Build failed!";
  notifyEmail("Build Status Update", message);
  notifySlack(message);

  // push to dashboard
  store.add(build);
  sseBroadcast("build", build);
  console.log("Build recorded:", build);
}

// -------- Express API --------
app.get("/api/builds", (req, res) => {
  const limit = parseInt(req.query.limit || "20", 10);
  res.json(store.list(limit));
});

app.get("/api/stats", (req, res) => {
  const limit = parseInt(req.query.limit || "20", 10);
  res.json(store.stats(limit));
});

app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  sseClients.add(res);
  res.write(`event: hello\ndata: "connected"\n\n`);
  req.on("close", () => sseClients.delete(res));
});

// seed with some history
for (let i = 0; i < 5; i++) monitorBuildStatus();

// tick builds every 15s
setInterval(monitorBuildStatus, 15000);

// start dashboard server
app.listen(PORT, () => {
  console.log(`Notifier + Dashboard running on http://localhost:${PORT}`);
});
