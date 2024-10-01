const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserItemsServices } = require('../../services/user-items-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check user inventory.')
    .addUserOption(option => 
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const instance = await UserItemsServices.getUserItems(user.id);

    if (instance.items.length > 0) {
      const thisUserItems = instance.items.map(item => `${item.quantity} ${item.name}`);

      console.log('Inventory Cmd: Items successfully displayed.');
      return interaction.reply({
        content: `**${user.username}** has:\n${thisUserItems.join('\n')}`
      });
    }
    else {
      if (user === interaction.user) {
        console.log('Inventory Cmd: Lack of items successfully displayed (Interaction User).')
        return interaction.reply({
          content: `You have nothing. It's okay... Don't think about it too much.`
        });
      }
      console.log('Inventory Cmd: Lack of items successfully displayed.')
      return interaction.reply({
        content: `**${user.username}** has no items.`
      });
    }
  }
}
