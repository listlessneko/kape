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
    const currentBalance = await UserServices.getBalance(user.id);

    console.log('user:', user);
    console.log('username:', user.username);

    if (user === interaction.user) {
      if (currentBalance < 100) {
        await UserServices.addBalance(user.id, .5);
        const newBalance = await UserServices.getBalance(user.id);
        return interaction.reply({
          content: `You have **${currentBalance}** credits.\nYou good? *The bot beeps in pity.* Here's **50 parts**. It's the most I can spare right now.\nYour New Balance: **${newBalance} credits**`
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
