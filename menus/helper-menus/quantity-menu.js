import { logger } from '../../logger.js';
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';

const menuName = 'QuantityMenu';
export const content = 'Select number of items.';
export const customId = 'quantity-menu';

/**
 * Creates a dynamic ActionRow of incremental item quantities to be displayed on a StringSelectMenu.
 * - Intended as a helper function in order to create a StringSelectMenu that offers multiple, differing quantity options.
 *
 * @param {object} opts An object containing the optional parameters to create the menu.
 * @param {string} opts.menu A string indicating the name of the menu the item lives in.
 * @param {string} opts.action A string indicating the immediate action this item is being used for.
 * @param {number} opts.quantity A number indicating the quantity of the item being used.
 * @param {string} opts.itemName A string containing the item's name.
 * @returns {object} A component containg the menu information.
 */

export function row(opts) {
  const helperName = `${menuName}.row`;

  const menu = opts.menu;
  logger.log(`[DEBUG] ${helperName} Menu:`, menu);
  const action = opts.action;
  const itemName = opts.itemName;
  let quantity = opts.quantity;
  console.log(`[DEBUG] ${helperName} Num Initial:`, quantity);

  quantity = quantity <= 20 ? quantity : 20;
  console.log(`[DEBUG] ${helperName} Num After:`, quantity);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select number of items.')

  let i = 1;
  while (i < (quantity + 1)) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
      .setLabel(`${i}`)
      .setValue(`${i}`)
      .setDescription(`${action} ${i} ${itemName}`)
    )
    i++;
  }

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Go Back')
      .setValue(`${menu}`)
      .setDescription('Go back.'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Nevermind')
      .setValue('nevermind')
      .setDescription('You change your mind.')
  )

  return new ActionRowBuilder().addComponents(selectMenu);
}
