const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

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
    const items = await UserServices.getUserItems(user.id);

    if (items.length > 0) {
      const thisUserItems = items.map(item => `${item.amount} ${item.item.name}`);

      return interaction.reply({
        content: `**${user.username}** has:\n${thisUserItems.join('\n')}`
      });
    }
    else {
      if (user === interaction.user) {
        return interaction.reply({
          content: `You have nothing. It's okay... Don't think about it too much.`
        });
      }
      return interaction.reply({
        content: `**${user.username}** has no items.`
      });
    }
  }
}
