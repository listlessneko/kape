import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { InventoryServices } from '../../services/inventory-services.js';
import { KafeItems, Supplies } from '../../models/models-barrel.js';
import { ErrorServices } from '../../services/error-services.js';
import { InsufficientResourcesError } from '../../errors/error-barrel.js';

const allKafeItems = await KafeItems.findAll();
const allSupplyItems = await Supplies.findAll();

const commandName = `MasterCommand.RemoveItems`;
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('remove-items')
    .setDescription('Remove items to user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('kafe-items')
        .setDescription('Remove kafe items from user inventory.')
        .addStringOption(option =>
          option
          .setName('item')
          .setDescription('Input item name.')
          .setAutocomplete(true)
          .setRequired(true)
        )
        .addNumberOption(option =>
          option
          .setName('quantity')
          .setDescription('Input quantity of items.')
          .setRequired(true)
        )
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username.')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('supply-items')
        .setDescription('Remove supply items from user kafe inventory.')
        .addStringOption(option =>
          option
          .setName('item')
          .setDescription('Input item name.')
          .setAutocomplete(true)
          .setRequired(true)
        )
        .addNumberOption(option =>
          option
          .setName('quantity')
          .setDescription('Input quantity of items.')
          .setRequired(true)
        )
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username.')
        )
    ),

  async autocomplete(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();

      const itemChoices = subcommand === 'kafe-items' ? allKafeItems : allSupplyItems;

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

    try {
      if (!this.allowedUserId.includes(interaction.user.id)){
        return await interaction.reply({
          content: `You do not have permission to use this command. Please consult with the developer.`,
          ephemeral: true
        });
      }
      const user = interaction.options.getUser('user') ?? interaction.user;
      let selectedItem = interaction.options.getString('item');
      const quantity = interaction.options.getNumber('quantity');

      const itemChoices = subcommand === 'kafe-items' ? allKafeItems : allSupplyItems;
      const model = subcommand === 'kafe-items' ? 'UserItems' : 'UserKafeSupplies';

      selectedItem = itemChoices.find(item => item.value === selectedItem);

      const userAccount = {
        model: model,
        id: user.id,
        fieldName: 'user_id',
      };

      const userItems = await InventoryServices.removeItemsFromAccount(userAccount, selectedItem.item_id, quantity);
      logger.debug(`[DEBUG] ${commandName} Item name:`, userItems.userItem.name);
      logger.debug(`[DEBUG] ${commandName} Item quantity (removed):`, quantity);
      logger.debug(`[DEBUG] ${commandName} Item quantity (current):`, userItems.userItem.quantity);

      return await interaction.reply({
        content: `You have removed **${quantity} ${selectedItem.name}** from **${user.username}** and sent them to the *Void*.`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
      if (e instanceof InsufficientResourcesError ) {
        return await interaction.reply({
           content: `This user does not have ${selectedItem.name} in their inventory.`
        });
      }
      return await interaction.reply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*`
      });
    }
  }
}

