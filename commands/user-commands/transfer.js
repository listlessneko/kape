import { logger } from '../../logger.js';
import { 
  SlashCommandBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType
} from 'discord.js';
import {
  BalanceServices,
  CacheServices,
  ErrorServices,
  InventoryServices,
  MathServices,
} from '../../services/all-services.js';
import { KafeItems, Supplies } from '../../models/models-barrel.js';

const allKafeItems = await KafeItems.findAll();
const allSupplyItems = await Supplies.findAll();

const commandName = `UserCommand.Transfer`;
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer credits or items to another user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('credits')
        .setDescription('Transfer credits to another user.')
      .addStringOption(option =>
        option
        .setName('sender-account-type')
        .setDescription('Transfer funds from you personal or kafe balance.')
        .setRequired(true)
        .addChoices(
          { name: 'Personal', value: 'personal' },
          { name: 'Kafe', value: 'kafe' },
        )
      )
      .addStringOption(option =>
        option
        .setName('recipient-account-type')
        .setDescription('Transfer funds to a user\'s personal or kafe balance.')
        .setRequired(true)
        .addChoices(
          { name: 'Personal', value: 'personal' },
          { name: 'Kafe', value: 'kafe' },
        )
      )
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
      )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kafe-items')
        .setDescription('Transfer your kafe items to another user\'s personal inventory.')
        .addStringOption(option =>
          option
          .setName('item')
          .setDescription('Select item to transfer.')
          .setAutocomplete(true)
          .setRequired(true)
        )
        .addNumberOption(option =>
          option
          .setName('quantity')
          .setDescription('Select number of items to transfer.')
          .setRequired(true)
        )
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username.')
          .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('supply-items')
        .setDescription('Transfer your supply items to another user\'s kafe inventory.')
        .addStringOption(option =>
          option
          .setName('item')
          .setDescription('Select item to transfer.')
          .setAutocomplete(true)
          .setRequired(true)
        )
        .addNumberOption(option =>
          option
          .setName('quantity')
          .setDescription('Select number of items to transfer.')
          .setRequired(true)
        )
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username.')
          .setRequired(true)
        )
    ),

  async autocomplete(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();

      const itemChoices = subcommand === 'kafe-items' ? allKafeItems : allSupplyItems;
      logger.log(`[LOG] Autocomplete ItemChoices:`, itemChoices);

      const choices = itemChoices.map(item => ({
        name: item.name,
        value: item.value
      }));

      const filtered = choices
      .filter(choice => choice.value.includes(focusedValue))
      .slice(0, 25)
      .map(choice => ({
        name: choice.name,
        value: choice.value
      }));

      await interaction.respond(filtered);
    } catch (e) {
      ErrorServices.handleError(commandName, e)
    }
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let subcommandName;

    try {
      if (subcommand === 'credits') {
        subcommandName = `${commandName}.Credits`;

        const senderAccount = interaction.options.getString('sender-account');
        logger.log(`[LOG] ${subcommandName} senderAccount:`, senderAccount);
        const recipientAccount = interaction.options.getString('recipient-account');
        logger.log(`[LOG] ${subcommandName} recipientAccount:`, recipientAccount);

        let sender = {};
        sender.accountType = senderAccount;
        let recipient = {};
        recipient.accountType = recipientAccount;

        function identifyAccounts(user, account) {
          account.id = user.id;
          if (account.accountType === 'kafe') {
            account.username = user.username + '\'s Kafe';
            account.targetModel = 'UserKafeBalance';
          } else {
            account.username = user.username;
            account.targetModel = 'UserBalance';
          }
          return account;
        }
        sender = identifyAccounts(interaction.user, sender);
        logger.log(`[LOG] ${subcommandName} sender:`, sender);
        recipient = identifyAccounts(interaction.options.getUser('user'), recipient);
        logger.log(`[LOG] ${subcommandName} recipient:`, recipient);
        const amount = interaction.options.getNumber('amount');

        const accounts = {
          sender,
          recipient
        }
        logger.log(`[LOG] ${subcommandName} accounts:`, accounts);

        let guests = {
          [sender.targetModel]: sender.id,
          [recipient.targetModel]: recipient.id,
        };
        logger.log(`[TEST] ${subcommandName} guests:`, guests);
        let bouncer = {};

        try {
          bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

          const senderCurrentAccount = await CacheServices.getOrSetCacheEntry(sender, bouncer);
          const senderAccountBalanceDiff = senderCurrentAccount.balance - amount;
          const cannotTrust = senderAccountBalanceDiff < -100;
          const willBeInDebt = senderCurrentAccount.balance >= 0 && senderAccountBalanceDiff < 0 && senderAccountBalanceDiff > senderCurrentAccount.max_debt;
          const inDebt = senderCurrentAccount.balance < 0 && senderAccountBalanceDiff > senderCurrentAccount.max_debt;

          if (cannotTrust) {
            logger.log(`[LOG] ${subcommandName}: Transfer declined.`);
            const senderAccountCurrentBalance = MathServices.displayCurrency(senderCurrentAccount.balance);
            await interaction.reply({
            content: `Your Balance is **${senderAccountCurrentBalance.amount} ${senderAccountCurrentBalance.units}**.\n\nIt seems you are too poor to give the inputted amount to anyone money. Focus on yourself first before choosing generosity.`
            });
            await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
            return;
          }

          if (willBeInDebt || inDebt) {
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

            let debt = senderCurrentAccount.balance < 0 ? senderCurrentAccount.balance : 0;
            debt = MathServices.displayCurrency(debt);

            const response = await interaction.reply({
              content: `It seems you have too low of a balance. Would you still like to transfer credits and go into debt?\nCurrent Debt: **${debt.amount} ${debt.units}**\nMax: 100 credits`,
              components: [row]
            });

            try {
              const collector = await response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60_000
              });

              collector.on('collect', async i => {
                const isSender = i.user.id === interaction.user.id;
                if (isSender) {
                  if (i.values[0] === 'yes') {
                    logger.log(`[LOG] ${subcommandName}: Sender '${sender.id} agrees to be in debt.`);
                    const result = await BalanceServices.transfer(accounts, amount, bouncer);
                    logger.log(`[LOG] ${subcommandName} result.sender.balance:`, result.sender.balance);
                    logger.log(`[LOG] ${subcommandName} result.recipient.balance:`, result.recipient.balance);
                    const senderUpdatedAccountBalance = MathServices.displayCurrency(result.sender.balance);
                    const recipientUpdatedAccountBalance = MathServices.displayCurrency(result.recipient.balance);
                    const funds = MathServices.displayCurrency(amount);
                    const salt = willBeInDebt ? 'now' : 'still';

                    await interaction.editReply({
                      content: `Successfully transferred **${funds.amount} ${funds.units}** to **${recipient.username}**. You are ${salt} in debt.\nNew Balances:\nYou: **${senderUpdatedAccountBalance.amount} ${senderUpdatedAccountBalance.units}**\n${recipient.username}: **${recipientUpdatedAccountBalance.amount} ${recipientUpdatedAccountBalance.units}**`,
                      components: []
                    });
                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                    return collector.stop(`[LOG] ${subcommandName}: Transfer completed.`);
                  }
                  else if (i.values[0] === 'no') {
                    const salt = willBeInDebt ? '' : 'further ';
                    logger.log(`[LOG] Sender '${sender.id} declines to be in ${salt}debt.`);
                    await interaction.editReply({
                      content: `How selfish...`,
                      components: []
                    });
                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                    return collector.stop(`[LOG] ${subcommandName}: Transfer canceled.`);
                  }
                }
                await i.reply({
                  content: `Please wait your turn.`,
                  ephemeral: true
                });
              });

              collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                  interaction.editReply({
                    content: `Hm... Take your time then.`,
                    components: []
                  });
                }
                logger.log(reason);
              });
            } catch (e) {
              return await interaction.editReply({
                content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
                components: [],
              });
            }
          } else {
            // normal transfer
            const { success, sender: senderUpdatedAccount, recipient: recipientAccount, e } = await BalanceServices.transfer(accounts, amount, bouncer);
            if (!success) {
              throw e;
            }
            const senderUpdatedAccountBalance = MathServices.displayCurrency(senderUpdatedAccount.balance);
            const recipientUpdatedAccountBalance = MathServices.displayCurrency(recipientAccount.balance);
            const funds = MathServices.displayCurrency(amount);

            await interaction.reply({
              content: `Successfully transferred **${funds.amount} ${funds.units}** to **${recipient.username}** You are in debt.\nNew Balances:\nYou: **${senderUpdatedAccountBalance.amount} ${senderUpdatedAccountBalance.units}**\n${recipient.username}: **${recipientUpdatedAccountBalance.amount} ${recipientUpdatedAccountBalance.units}**`,
              components: []
            });
            await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
            return logger.log(`[LOG] ${subcommandName}: Transfer completed.`);
          }
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
          if (bouncer.transaction && !bouncer.transaction.finished) {
            await ErrorServices.handleAdvancedDataRollback(subcommandName, guests, bouncer);
          }
          return await interaction.reply({
            content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
            components: [],
          });
        }
      } if (subcommand === 'kafe-items') {
        subcommandName = `${commandName}.KafeItems`;
        return await interaction.reply({
          content: `Hello. Welcome to the Kapé Shipping Warehouse. We are currently under *construction*.\n*You hear a sudden crack followed by a loud, deafening bang. The construction bot continues as though nothing happened.*\nPlease come again later.`
        });
      } if (subcommand === 'supply-items') {
        subcommandName = `${commandName}.SupplyItems`;
        return await interaction.reply({
          content: `Hello. Welcome to the Kapé Shipping Warehouse. We are currently under *construction*.\n*You hear a sudden crack followed by a loud, deafening bang. The construction bot continues as though nothing happened.*\nPlease come again later.`
        });
      }
    } catch (e) {
      ErrorServices.handleError(subcommandName, e);
      return await interaction.reply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
