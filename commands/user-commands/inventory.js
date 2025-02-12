import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { UserItemsServices } from '../../services/user-items-services.js';
import { InventoryServices } from '../../services/inventory-services.js';
import { ErrorServices } from '../../services/error-services.js';
import * as Models from '../../models/models-barrel.js';
import { CacheServices } from '../../services/cache-services.js';

const commandName = 'Inventory';
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check user inventory.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('personal')
        .setDescription('Display personal items.')
      .addUserOption(option => 
        option
        .setName('user')
        .setDescription('Input username.')
      )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kafe')
        .setDescription('Display supply items.')
      .addUserOption(option => 
        option
        .setName('user')
        .setDescription('Input username.')
      )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let subcommandName;

    const user = interaction.options.getUser('user') ?? interaction.user;
    const userAccount = {
      id: user.id,
      fieldName: 'user_id',
    };

    try {
      try {
        subcommandName = `${commandName}.personal`;
        if (subcommand === 'personal') {

          userAccount.targetModel = 'UserItems';
          userAccount.sourceModel = {};
          userAccount.sourceModel.name = 'KafeItems';
          userAccount.sourceModel.alias = 'kafeItem';

          const userItems = await CacheServices.findEntryWithItems(userAccount);

          // check for when quantities are 0 since database will always have an entry regardless of user item quantity
          let thisUserItems = userItems.items
            .filter(item => item.quantity > 0)
            .map(item => `${item.quantity} ${item.name}`);

          if (thisUserItems.length > 0) {
            logger.log(`[LOG] ${subcommandName}: Items successfully displayed.`);
            return interaction.reply({
              content: `**${user.username}** has:\n${thisUserItems.join('\n')}`
            });
          }

          if (user === interaction.user) {
            logger.log(`[LOG] ${subcommandName}: Lack of items successfully displayed (Interaction User).`);
            return interaction.reply({
              content: `You have nothing. It's okay... Don't think about it too much.`
            });
          }
          logger.log(`[LOG] ${subcommandName}: Lack of items successfully displayed.`)
          return interaction.reply({
            content: `**${user.username}** has no items.`
          });
        }
      } catch (e) {
        ErrorServices.handleError(subcommandName, e);
      }
      try {
        if (subcommand === 'kafe') {

          userAccount.targetModel = 'UserKafeSupplies';
          userAccount.sourceModel = {};
          userAccount.sourceModel.name = 'Supplies';
          userAccount.sourceModel.alias = 'Supply';

          const userSupplies = await CacheServices.findEntryWithItems(userAccount);

          if (userSupplies.items.length > 0) {
            const thisUserSupplies = userSupplies.items.map(item => `${item.quantity} ${item.name}`);

            logger.log(`[LOG] ${subcommandName}: Supplies successfully displayed.`);
            return interaction.reply({
              content: `**${user.username}** has:\n${thisUserSupplies.join('\n')}`
            });
          }
          else {
            if (user === interaction.user) {
              logger.log(`[LOG] ${subcommandName}: Lack of supplies successfully displayed (Interaction User).`)
              return interaction.reply({
                content: `You have nothing. It's okay... Don't think about it too much.`
              });
            }
            logger.log(`[LOG] ${subcommandName}: Lack of supplies successfully displayed.`)
            return interaction.reply({
              content: `**${user.username}** has no supplies.`
            });
          }
        }
      } catch (e) {
        ErrorServices.handleError(subcommandName, e);
      }
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
