
const express = require('express');
const fs = require('fs');
const path = require('path');
const { middleware } = require('@line/bot-sdk');

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

app.use(middleware(config));
app.use(express.json());

const CONFIG_PATH = path.resolve('./config/config.json');

function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { albums: [] };
  }
}

function saveConfig(configData) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));
}

app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch(err => {
      console.error('Webhook error:', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'image') {
    const groupId = event.source.groupId;
    const messageId = event.message.id;

    const configData = loadConfig();
    let group = configData.albums.find(a => a.id === groupId);
    if (!group) {
      group = { id: groupId, folderName: `群組-${groupId}`, messages: [] };
      configData.albums.push(group);
    }

    if (!group.messages) group.messages = [];
    if (!group.messages.includes(messageId)) {
      group.messages.push(messageId);
      saveConfig(configData);
    }
  }
}

app.get('/', (req, res) => {
  res.send('Webhook Server is running!');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
