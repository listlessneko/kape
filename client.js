const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');

const environment = process.env.NODE_ENV || 'dev';
const { token } = require(`./config/${environment}-config.json`);

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
