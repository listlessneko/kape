const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

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
    let amount = interaction.options.getNumber('amount');

    const current = await UserServices.getUsers(user.id);

    let result = await UserServices.subtractBalance(amount, user.id);

    amount = await MathServices.wholeNumber(amount);
    const amountUnits = await MathServices.wholeNumber(amount);
    result = await MathServices.wholeNumber(result.new_balance);
    const resultUnits = await MathServices.wholeNumber(result.new_balance);

    if (user === interaction.user) {
      if (amount > current.balance) {
        return interaction.reply({
          content: `You have taken **${amount} ${amountUnits}** from youself and sent it to the Void. You are now in debt.\nYour New Balance: **${result} ${resultUnits}**`
        });
      }
      return interaction.reply({
        content: `You have taken **${amount} ${amountUnits}** from youself and sent it to the Void. You are weird.\nYour New Balance: **${result} ${resultUnits}**`
      });
    }

    if (amount > current.balance) {
        return interaction.reply({
          content: `You have taken **${amount} ${amountUnits}** from **${user.username}** and sent it to the Void. They are now in debt because of you.\n${user.username}'s New Balance: **${result} ${resultUnits}**`
        });
    }
    return interaction.reply({
      content: `Transfer completed. You have taken **${amount} ${amountUnits}** from **${user.username}** and sent it to the Void.\n\n${user.username}'s New Balance: **${result} ${resultUnits}**`
    });
  }
}
