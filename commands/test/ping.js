const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserLevelsServices } = require('../../services/user-levels-services.js');
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
const { ScoresServices } = require(path.join(__dirname, '..', '..', 'services', 'scores-services.js'));
const { KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const usersCache = client.usersCache;
const userLevelsCache = client.userLevelsCache;
const userItemsCache = client.userItemsCache;
const wait = require('node:timers/promises').setTimeout;
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));
const food = items.categories.find(category => category.name === 'Food')
const dinner = food.types.find(type => type.name === 'Dinner');

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

    try {
      const userTest1 = await UserLevelsServices.getUserLevels(userId1);
      //console.log('Ping Cmd - Get User Levels:', userTest1.dataValues);
      //console.log('Ping Cmd - Current Level Exp:', userTest1.current_level_exp);
      userTest1.current_level_exp += 25;
      //console.log('Ping Cmd - New Current Level Exp:', userTest1.current_level_exp);
      await userTest1.save();
      //console.log('Ping Cmd - Saved Current Level Exp:', userTest1.current_level_exp);
      userLevelsCache.set(userId1, userTest1);
      //console.log('Ping Cmd - Get User Levels:', userTest1.dataValues);
      const userTest2 = await UserLevelsServices.checkLevel(userId1);
      console.log('Ping Cmd - Check Level:', userTest2);
    }
    catch (e) {
      console.error('Ping Error:', e);
    }

    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    });
  }
}
