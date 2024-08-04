const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
//const Users = require(path.join(__dirname, '..', '..', 'data', 'users.js'));
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const currency = client.currency;

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer your currency to another user.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to transfer.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId1 = interaction.user.id;
    const userId2 = interaction.options.getUser('user').id;
    const amount = interaction.options.getNumber('amount');

    await UserServices.transferBalance(userId1, userId2, amount);

    const user1 = await UserServices.checkUserData(userId1);
    const user2 = await UserServices.checkUserData(userId2);

    console.log('Balances:');
    console.log('currentUser Id:', user1.user_id);
    console.log('currentUser Balance:', user1.balance);
    console.log('targetUser Id:', user2.user_id);
    console.log('targetUser Balance:', user2.balance);

    if (amount > user1.balance) {
      return interaction.reply({
        content: `Your Balance is **${user1.balance}** credits.\n\nIt seems you're too poor to give anyone money. Focus on yourself first before choosing generosity.`
      });
    }
    else {
      return interaction.reply({
        content: `Successfully transferred **${targetAmount}** to **${targetUser.username}**.\nNew Balances:\nYou: ${currentUser.balance}\n${targetUser.username}: ${targetUser.balance}`
      });
    }
  }
}
