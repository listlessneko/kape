const path = require('node:path');
const { 
  SlashCommandBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

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
    const amount = interaction.options.getNumber('amount');

    const user1Current = await UserServices.getBalance(userId1.id);

    if (amount > user1Current.balance) {
      const components = new StringSelectMenuBuilder()
        .setCustomId('confirm-debt')
        .setPlaceholder('Select one.')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Yes')
            .setValue('yes')
            .setDescription('You agree to being in debt with interest.'),
          new StringSelectMenuOptionBuilder()
            .setLabel('No')
            .setValue('no')
            .setDescription('You agree to being a bad person.')
          )

      const row = new ActionRowBuilder().addComponents(components);

      const response = await interaction.reply({
        content: `It seems you have too low of a balance. Would you still like to transfer credits and go into debt?`,
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
              await UserServices.transferCredits(userId1.id, userId2.id, amount);
              const user1New = await UserServices.getBalance(userId1.id);
              const user2New = await UserServices.getBalance(userId2.id);
              await interaction.editReply({
                content: `Successfully transferred **${amount}** to **${userId2.username}** You are now in debt.\nNew Balances:\nYou: ${user1New.balance}\n${userId2.username}: ${user2New.balance}`,
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
              collector.stop('Transfer declined.');
              return;
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

    //  return await interaction.reply({
    //    content: `Your Balance is **${user1Current.balance}** credits.\n\nIt seems you're too poor to give anyone money. Focus on yourself first before choosing generosity.`
    //  });
    }

    else {
      await UserServices.transferCredits(userId1.id, userId2.id, amount);

      const user1New = await UserServices.getBalance(userId1.id);
      const user2New = await UserServices.getBalance(userId2.id);

      return await interaction.reply({
        content: `Successfully transferred **${amount}** to **${userId2.username}**.\nNew Balances:\nYou: ${user1New.balance}\n${userId2.username}: ${user2New.balance}`
      });
    }
  }
}
