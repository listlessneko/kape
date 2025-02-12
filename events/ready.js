import { Events } from 'discord.js';

const opener = process.env.NODE_ENV === 'main' ? 'K2 is on the clock.' : 'B2 is behind the clock.';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`This is ${client.user.username}. ${opener}`);
  },
};
