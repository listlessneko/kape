const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));

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
    const items = await UserItemsServices.getUserItems({ requestModelInstance: false }, user.id);

    if (items.length > 0) {
      const thisUserItems = items.map(item => `${item.quantity} ${item.name}`);

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
