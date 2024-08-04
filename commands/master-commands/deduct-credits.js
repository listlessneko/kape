const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('deduct-credits')
    .setDescription('Deduct credits from user.')
    .addUserOption(option => 
      option
        .setName('user')
        .setDescription('Input username.')
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const amount = interaction.options.getNumber('amount');

    await UserServices.subtractBalance(user.id, amount);

    if (user === interaction.user) {
      return interaction.reply({
        content: `You have taken **${amount} credits** from youself and sent it to the Void. You are weird.\nYour New Balance: **${await UserServices.getBalance(user.id)} credits**`
      });
    }

    return interaction.reply({
      content: `Transfer completed. You have taken **${amount} credits** from **${user.username}** and sent it to the Void.\n\n${user.username}'s New Balance: **${await UserServices.getBalance(user.id)} credits**`
    });
  }
}
