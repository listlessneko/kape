const path = require('node:path');
const { 
  SlashCommandBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');
const { UserServices } = require('../../services/user-services.js');
const { MathServices } = require('../../services/math-services.js');
const { FormatServices } = require('../../services/format-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer your currency to another user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to transfer.')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId1 = interaction.user;
    const userId2 = interaction.options.getUser('user');
    let amount = interaction.options.getNumber('amount');
    amount = MathServices.wholeNumber(amount);
    const amountUnits = FormatServices.determineUnits(amount);

    const user1 = await UserServices.getUsers(userId1.id);
    const user1Balance = MathServices.wholeNumber(Math.abs(user1.balance));
    const user1BalanceUnits = FormatServices.determineUnits(user1.balance);

    const liability = (user1.balance - amount) <= -100 ? true : false;

    if (!liability) {
      const components = new StringSelectMenuBuilder()
        .setCustomId('confirm-debt')
        .setPlaceholder('Select one.')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Yes')
            .setValue('yes')
            .setDescription(`You agree to being in debt with interest.`),
          new StringSelectMenuOptionBuilder()
            .setLabel('No')
            .setValue('no')
            .setDescription('You agree to being a bad person.')
          )

      const row = new ActionRowBuilder().addComponents(components);


      const response = await interaction.reply({
        content: `It seems you have too low of a balance. Would you still like to transfer credits and go into debt?\nCurrent Debt: **${user1Balance} ${user1BalanceUnits}**\nMax: 100 credits`,
        components: [row]
      });

      try {
        const collector = await response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          if (i.user.id === interaction.user.id) {
            if (i.values[0] === 'yes') {
              const result = await UserServices.transferCredits(amount, userId1.id, userId2.id);
              console.log('Transfer Cmd - Result:', result);

              const user1NewBalance = await MathServices.wholeNumber(result.user1.new_balance) ;
              const user1NewBalanceUnits = FormatServices.determineUnits(result.user1.new_balance) ;
              const user2NewBalance = await MathServices.wholeNumber(result.user2.new_balance) ;
              const user2NewBalanceUnits = FormatServices.determineUnits(result.user2.new_balance) ;

              await interaction.editReply({
                content: `Successfully transferred **${amount} ${amountUnits}** to **${userId2.username}** You are now in debt.\nNew Balances:\nYou: **${user1NewBalance} ${user1NewBalanceUnits}**\n${userId2.username}: **${user2NewBalance} ${user2NewBalanceUnits}**`,
                components: []
              });
              collector.stop('Transfer completed.');
              return;
            }
            else if (i.values[0] === 'no') {
              await interaction.editReply({
                content: `How selfish...`,
                components: []
              });
              return collector.stop('Transfer canceled.');
            }
          }
          else if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: `Please wait your turn.`,
              ephemeral: true
            });
          }
        });

        collector.on('end', (collected, reason) => {
          console.log(reason);
        });
      }
      catch (e) {
        await interaction.editReply({ 
          content: `Hm... Take your time then.`, 
          components: [] 
        });
      }

    }

    else if (liability) {
      await interaction.reply({
      content: `Your Balance is **${user1Balance} ${user1BalanceUnits}**.\n\nIt seems you're too poor to give the inputted amount to anyone money. Focus on yourself first before choosing generosity.`
      });
      return collector.stop('Transfer declined.');
    }

    else {
      const result = await UserServices.transferCredits(amount, userId1.id, userId2.id);

      const user1NewBalance = await MathServices.wholeNumber(result.user1.new_balance) ;
      const user1NewBalanceUnits = FormatServices.determineUnits(result.user1.new_balance) ;
      const user2NewBalance = await MathServices.wholeNumber(result.user2.new_balance) ;
      const user2NewBalanceUnits = FormatServices.determineUnits(result.user2.new_balance) ;

      await interaction.editReply({
        content: `Successfully transferred **${amount} ${amountUnits}** to **${userId2.username}** You are now in debt.\nNew Balances:\nYou: **${user1NewBalance} ${user1NewBalanceUnits}**\n${userId2.username}: **${user2NewBalance} ${user2NewBalanceUnits}**`,
        components: []
      });
      return collector.stop('Transfer completed.');
    }
  }
}
