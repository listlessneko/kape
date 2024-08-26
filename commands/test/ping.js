const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
const { KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const usersCache = client.usersCache;
const userItemsCache = client.userItemsCache;
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    const exampleUsers = ['456', '789'];
    exampleUsers.push(interaction.user.id);
    const userId1 = interaction.user.id;
    const userId2 = '763074931021316136';

    try {
      await interaction.reply({ 
        content: 'Ping...'
      });
      originalMessage = 'Pong...?';
      messageOutput = '';
      for (let i = 0; i < originalMessage.length; i++) {
        if (originalMessage[i] === '.') {
          await wait(100);
          messageOutput += originalMessage[i];
          await interaction.editReply(messageOutput);
        } else {
          await wait(500);
          messageOutput += originalMessage[i];
          await interaction.editReply(messageOutput);
          await wait (500);
        }
      }
      console.log(interaction.options)
      await wait(2000);
      await interaction.followUp({
        content: 'Why are you still staring at the screen?',
      })
        .then(async (message) => {
          await wait(2000);
          await message.delete();
        });
    }
    catch (e) {
      console.error('Ping Error:', e);
    }

    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    });
  }
}
