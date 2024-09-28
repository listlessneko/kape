const { Events } = require('discord.js');

const opener = process.env.NODE_ENV === 'main' ? 'K2 is on the clock.' : 'B2 is behind the clock.';

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`This is ${client.user.username}. ${opener}`);
  },
};
