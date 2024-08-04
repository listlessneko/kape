const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check user balance.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;

    console.log('user:', user);
    console.log('username:', user.username);

    if (user === interaction.user) {
      if (await UserServices.getBalance(user.id) < 100) {
        return interaction.reply({
          content: `You have **${await UserServices.getBalance(user.id)}** credits.\nYou good?`
        });
      }
      return interaction.reply({
        content: `You have **${await UserServices.getBalance(user.id)}** credits.`
      });
    }

    return interaction.reply({
      content: `**${user.username}** has **${await UserServices.getBalance(user.id)}** credits.`
    });
  }
}
