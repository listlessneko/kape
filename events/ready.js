const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`This is ${client.user.username}. K2 is on the clock.`);
  },
};
