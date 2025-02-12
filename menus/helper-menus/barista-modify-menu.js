import { logger } from '../../logger.js';
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';

const menuName = 'BaristaModifyMenu';
export const customId = 'barista-modify-menu';

/**
 * Creates a dynamic Content and ActionRow for modifiable barista supply items to be displayed on a StringSelectMenu.
 * - Intended as a helper function in order to create a StringSelectMenu that offers varying modifications such as amount and methods of adding ingredients.
 *
 * @param {object} opts An object containing the optional parameters to create the menu.
 * @returns {object} An object containing the menu information.
 */

export function createMenu(opts) {
  const helperName = `${menuName}.createMenu`;
  logger.log(`[LOG] ${helperName} opts:`, opts);
  const prevMenu = opts.prevMenu;
  const supplyItem = opts.currentItem;
  const modification = supplyItem.modifications.find(modification => modification.name === opts.modification);
  logger.log(`[LOG] ${helperName} modification:`, modification);

  const content = modification.description;

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(modification.description)

  for (const variation of modification.variations ) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(variation.name)
        .setValue(variation.value)
        .setDescription(variation.description)
    )
  }

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Go Back')
      .setValue(`${prevMenu}`)
      .setDescription('Go back.'),
  )

  const row = new ActionRowBuilder().addComponents(selectMenu);

  return { content, row };
}
