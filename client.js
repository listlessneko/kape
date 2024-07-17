const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require(path.join(__dirname, 'config', 'config.json'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(token);

module.exports = {
  client
}
