import { SlashCommandBuilder } from 'discord.js';
import { InventoryServices } from '../../services/inventory-services.js';
import { KafeItems, Supplies } from '../../models/models-barrel.js';
import { ErrorServices } from '../../services/error-services.js';
import { logger } from '../../logger.js';

const allKafeItems = await KafeItems.findAll();
const allSupplyItems = await Supplies.findAll();

const commandName = `MasterCommand.AddItems`;
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('add-items')
    .setDescription('Add items to user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('kafe-items')
        .setDescription('Add kafe items to user inventory.')
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
        .setDescription('Add supply items to user kafe inventory.')
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
      if (!this.allowedUserId.includes(interaction.user.id)) {
        return await interaction.reply({
          content: `You do not have permission to use this command. Please consult with the developer.`,
          ephemeral: true
        });
      }

      const user = interaction.options.getUser('user') ?? interaction.user;
      let selectedItem = interaction.options.getString('item');
      const quantity = interaction.options.getNumber('quantity');

      const itemChoices = subcommand === 'kafe-items' ? allKafeItems : allSupplyItems;
      const targetModel = subcommand === 'kafe-items' ? 'UserItems' : 'UserKafeSupplies';
      const sourceModel = {};
      sourceModel.name = subcommand === 'kafe-items' ? 'KafeItems' : 'Supplies';
      sourceModel.alias = subcommand === 'kafe-items' ? 'kafeItem' : 'Supply';

      selectedItem = itemChoices.find(item => item.value === selectedItem);

      const userAccount = {
        id: user.id,
        fieldName: 'user_id',
        targetModel,
        sourceModel,
      };

      const userItems = await InventoryServices.addItemsToAccount(userAccount, selectedItem, quantity);
      logger.debug(`[DEBUG] ${commandName} Item name:`, userItems.userItem.name);
      logger.debug(`[DEBUG] ${commandName} Item quantity (added):`, quantity);
      logger.debug(`[DEBUG] ${commandName} Item quantity (current):`, userItems.userItem.quantity);

      if (user === interaction.user.id) {
        await interaction.reply({
          content: `You have given yourself **${quantity} ${selectedItem.name}**. What are you going to do with that?`
        });
      }
      return await interaction.reply({
        content: `You have given **${quantity} ${selectedItem.name}** to **${user.username}**.`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
      return await interaction.reply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*`
      });
    }
  }
}
