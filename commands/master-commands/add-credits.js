const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require('../../services/user-services.js');
const { MathServices } = require('../../services/math-services.js');
const { FormatServices } = require('../../services/format-services.js');

module.exports = {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('add-credits')
    .setDescription('Add credits to user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount.')
        .setRequired(true)
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
    let amount = interaction.options.getNumber('amount');

    let result = await UserServices.addBalance(amount, user.id);

    const amountUnits = FormatServices.determineUnits(amount);
    amount = await MathServices.wholeNumber(amount);
    const resultUnits = FormatServices.determineUnits(result.new_balance);
    result = await MathServices.wholeNumber(result.new_balance);

    if (user === interaction.user) {
      return await interaction.reply({
        content: `You have given yourself **${amount} ${amountUnits}**. You are spoiled.\nYour New Balance: **${result} ${resultUnits}**`
      });
    }

    return await interaction.reply({
      content: `Transfer completed. You have given **${amount} ${amountUnits}** to **${user.username}**.\n\n${user.username}'s New Balance: **${result} ${resultUnits}**`
    });
  }
}
