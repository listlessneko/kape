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
    console.log('Transfer Cmd - User 1:', userId1.id);
    const userId2 = interaction.options.getUser('user');
    console.log('Transfer Cmd - User 2:', userId2.id);
    const originalAmount = interaction.options.getNumber('amount');
    console.log('Transfer Cmd - Original Amount:', originalAmount);
    const amount = MathServices.wholeNumber(originalAmount);
    console.log('Transfer Cmd - Amount (Whole Number):', amount);
    const amountUnits = FormatServices.determineUnits(originalAmount);
    console.log('Transfer Cmd - Amount (Units):', amountUnits);

    const user1 = await UserServices.getUsers(userId1.id);
    const user1BalanceUnits = FormatServices.determineUnits(user1.balance);
    const user1Balance = MathServices.wholeNumber(user1.balance);

    const amountDiff = user1.balance - originalAmount;
    const liability = (amountDiff) < -100 ? true : false;
    console.log('Transfer Cmd - Liability:', liability);
    const loan = amountDiff < 0 && amountDiff  > -100 ? true : false;
    console.log('Transfer Cmd - Loan:', loan);

    if (liability) {
      await interaction.reply({
      content: `Your Balance is **${user1Balance} ${user1BalanceUnits}**.\n\nIt seems you are too poor to give the inputted amount to anyone money. Focus on yourself first before choosing generosity.`
      });
      return console.log('Transfer declined.');
    }

    else if (!liability) {
      if (!loan) {
        const result = await UserServices.transferCredits(originalAmount, userId1.id, userId2.id);

        const user1NewBalanceUnits = FormatServices.determineUnits(result.user1.new_balance) ;
        const user1NewBalance = await MathServices.wholeNumber(result.user1.new_balance) ;
        const user2NewBalanceUnits = FormatServices.determineUnits(result.user2.new_balance) ;
        const user2NewBalance = await MathServices.wholeNumber(result.user2.new_balance) ;

        await interaction.reply({
          content: `Successfully transferred **${amount} ${amountUnits}** to **${userId2.username}** You are now in debt.\nNew Balances:\nYou: **${user1NewBalance} ${user1NewBalanceUnits}**\n${userId2.username}: **${user2NewBalance} ${user2NewBalanceUnits}**`,
          components: []
        });
        return console.log('Transfer completed.');
      }

      else if (loan) { 
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

        const originalDebt = user1.balance < 0 ? user1.balance : 0;
        const debtUnits = FormatServices.determineUnits(originalDebt);
        const debt = MathServices.wholeNumber(originalDebt);

        const response = await interaction.reply({
          content: `It seems you have too low of a balance. Would you still like to transfer credits and go into debt?\nCurrent Debt: **${debt} ${debtUnits}**\nMax: 100 credits`,
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
                const result = await UserServices.transferCredits(originalAmount, userId1.id, userId2.id);
                console.log('Transfer Cmd - Result:', result);

                const user1NewBalanceUnits = FormatServices.determineUnits(result.user1.new_balance) ;
                console.log('Transfer - User 1 New Balance Units:', user1NewBalanceUnits);
                const user1NewBalance = await MathServices.wholeNumber(result.user1.new_balance) ;
                console.log('Transfer - User 1 New Balance:', user1NewBalance);

                const user2NewBalanceUnits = FormatServices.determineUnits(result.user2.new_balance) ;
                console.log('Transfer - User 2 New Balance Units:', user2NewBalanceUnits);
                const user2NewBalance = await MathServices.wholeNumber(result.user2.new_balance) ;
                console.log('Transfer - User 2 New Balance:', user2NewBalance);

                await interaction.editReply({
                  content: `Successfully transferred **${amount} ${amountUnits}** to **${userId2.username}** You are in debt.\nNew Balances:\nYou: **${user1NewBalance} ${user1NewBalanceUnits}**\n${userId2.username}: **${user2NewBalance} ${user2NewBalanceUnits}**`,
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
    }
  }
}
