const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
const { KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const usersCache = client.usersCache;
const userItemsCache = client.userItemsCache;

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
      //const testItem1 = await KafeItems.findOne({
      //  where: {
      //    name: 'Drip Coffee'
      //  }
      //});
      //console.log('Ping - Test Item 1:', testItem1);
      //await UserItemsServices.addItems(testItem1, 1, userId1);
      //
      //const testItem2 = await KafeServices.findItem('drip-coffee');
      //console.log('Ping - Test Item 2:', testItem2);
      //await UserItemsServices.addItems(testItem2, 1, userId1);

      //const cachedUserItems = await UserItemsServices.getUserItems({requestModelInstance: true}, userId1);
      //cachedUserItems.items.forEach(cachedItem => console.log('Ping - Cached User Items:', cachedItem.dataValues));

      //const cachedItems = userItemsCache.get(userId1);
      //console.log('Ping - Cached Items:', cachedItems);
      //const userItemsInventory = cachedItems.items.map(cachedItem => cachedItem.dataValues);
      //console.log('Ping - User Items Inventory:', userItemsInventory);
      //userItemsInventory.forEach(cachedItem => {
      //  console.log('Ping - Item Data Values:', cachedItem.name);
      //});
      const testUser = await UserServices.getUsers({requestModelInstance: false}, userId1);
      console.log('Ping - User:', testUser);
    }
    catch (e) {
      console.error('Ping Error:', e);
    }

    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    });
  }
}
