const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

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
    const amount = interaction.options.getNumber('amount');

    const result = await UserServices.addBalance(amount, user.id);

    if (user === interaction.user) {
      return await interaction.reply({
        content: `You have given yourself **${amount} credits**. You are spoiled.\nYour New Balance: **${result.new_balance} credits**`
      });
    }

    return await interaction.reply({
      content: `Transfer completed. You have given **${amount} credits** to **${user.username}**.\n\n${user.username}'s New Balance: **${result.new_balance} credits**`
    });
  }
}
