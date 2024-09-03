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
    const userInfo = await UserServices.getUsers(user.id);

    if (user === interaction.user) {
      if (userInfo.balance < 10) {
        const result = await UserServices.addBalance(.25, user.id);
        return interaction.reply({
          content: `You have **${result.prev_balance} credits**.\nYou good? *The bot beeps in pity.* Here's **25 parts**. It's the most I can spare right now.\nYour New Balance: **${result.new_balance} credits**`
        });
      }
      return interaction.reply({
        content: `You have **${userInfo.balance} credits**.`
      });
    }

    return interaction.reply({
      content: `**${user.username}** has **${userInfo.balance} credits**.`
    });
  }
}
