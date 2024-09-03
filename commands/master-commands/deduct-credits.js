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
    const amount = interaction.options.getNumber('amount');

    const currentBalance = await UserServices.getUsers({requestModelInstance: false}, user.id);

    const result = await UserServices.subtractBalance(amount, user.id);

    if (user === interaction.user) {
      if (amount > currentBalance.balance) {
        return interaction.reply({
          content: `You have taken **${amount} credits** from youself and sent it to the Void. You are now in debt.\nYour New Balance: **${result.new_balance} credits**`
        });
      }
      return interaction.reply({
        content: `You have taken **${amount} credits** from youself and sent it to the Void. You are weird.\nYour New Balance: **${result.new_balance} credits**`
      });
    }

    if (amount > currentBalance.balance) {
        return interaction.reply({
          content: `You have taken **${amount} credits** from **${user.username}** and sent it to the Void. They are now in debt because of you.\n${user.username}'s New Balance: **${result.new_balance} credits**`
        });
    }
    return interaction.reply({
      content: `Transfer completed. You have taken **${amount} credits** from **${user.username}** and sent it to the Void.\n\n${user.username}'s New Balance: **${result.new_balance} credits**`
    });
  }
}
