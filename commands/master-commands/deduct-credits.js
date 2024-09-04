const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require('../../services/user-services.js');
const { MathServices } = require('../../services/math-services.js');
const { FormatServices } = require('../../services/format-services.js');

module.exports = {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('deduct-credits')
    .setDescription('Deduct credits from user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount.')
    )
    .addUserOption(option => 
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const user = interaction.options.getUser('user') ?? interaction.user;
    const originalAmount = interaction.options.getNumber('amount');

    const cachedUser = await UserServices.getUsers(user.id);
    const currentBalance = cachedUser.balance;

    const originalResult = await UserServices.subtractBalance(originalAmount, user.id);

    const amountUnits = FormatServices.determineUnits(originalAmount);
    const amount = await MathServices.wholeNumber(originalAmount);
    const resultUnits = FormatServices.determineUnits(originalResult.new_balance);
    const result = await MathServices.wholeNumber(originalResult.new_balance);

    if (user === interaction.user) {
      if (originalAmount > currentBalance) {
        return interaction.reply({
          content: `You have taken **${amount} ${amountUnits}** from youself and sent it to the *Void*. You are now in debt.\nYour New Balance: **${result} ${resultUnits}**`
        });
      }
      return interaction.reply({
        content: `You have taken **${amount} ${amountUnits}** from youself and sent it to the *Void*. You are weird.\nYour New Balance: **${result} ${resultUnits}**`
      });
    }

    if (amount > currentBalance) {
        return interaction.reply({
          content: `You have taken **${amount} ${amountUnits}** from **${user.username}** and sent it to the *Void*. They are now in debt because of you.\n${user.username}'s New Balance: **${result} ${resultUnits}**`
        });
    }
    return interaction.reply({
      content: `Transfer completed. You have taken **${amount} ${amountUnits}** from **${user.username}** and sent it to the *Void*.\n\n${user.username}'s New Balance: **${result} ${resultUnits}**`
    });
  }
}
