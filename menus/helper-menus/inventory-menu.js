import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';

export const content = `*You ruffle through your bag. Hm...*`;
export const customId = 'inventory-menu';

/**
 * Creates a dynamic ActionRow from an array of items to be displayed on a StringSelectMenu.
 * - Intended as a helper function in order to create a StringSelectMenu that displays a user's personal inventory items.
 *
 * @param {array} userItems An array of items containing their individual properties.
 * @returns {object} A component containg the menu information.
 *
 */

export function row(userItems) {
  const inventory = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('View your inventory.')

  userItems.forEach(userItem => {
    const quantity = userItem.quantity;
    const kafeItem = userItem.kafeItem;
    if (quantity === 0) {
      return;
    }
    inventory.addOptions(
      new StringSelectMenuOptionBuilder()
      .setLabel(
        (() => {
          if (kafeItem.energy_replen.min === kafeItem.energy_replen.max) {
            return `${quantity} ${kafeItem.name} (${kafeItem.cost} credits, ${kafeItem.energy_replen.max} energy)`;
          }
          else {
            return `${quantity} ${kafeItem.name} (${kafeItem.cost} credits, ${kafeItem.energy_replen.min} - ${kafeItem.energy_replen.max} energy)`;
          }
        })()
      )
      .setValue(kafeItem.value)
      .setDescription(kafeItem.description)
    )
  });

  inventory.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Nevermind')
      .setValue('nevermind')
      .setDescription('Close bag.')
  )

  return new ActionRowBuilder().addComponents(inventory);
}

