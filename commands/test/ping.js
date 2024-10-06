const { SlashCommandBuilder } = require('discord.js');
const { 
  CacheServices,
  UserServices,
  UserLevelsServices,
  UserItemsServices,
  CustomerServices,
  UserCustomerStatsServices,
  KafeServices,
  ScoresServices,
  MathServices,
  FormatServices
} = require('../../services/all-services.js');
const { CronServices, cronJobs } = require('../../cron/cron.js');

module.exports = {
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const exampleUsers = ['456', '789'];
    exampleUsers.push(interaction.user.id);
    const userId1 = interaction.user.id;
    const userId2 = '763074931021316136';

    const key1 = {
      id: userId1,
      name: 'user_id'
    }

    const key2 = {
      id: 1,
      name: 'customer_id'
    }

    try {
      console.log(cronJobs);
      for (let key of Object.keys(cronJobs)) {
        console.log('Cron Job:', key);
      }
    }
    catch (e) {
      console.error('Ping Error:', e);
    }

    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    });
  }
}
