import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../../data/barista-supplies.json' assert { type: 'json' };

export const customId = 'barista-supplies-main-menu';
export const content = 'What are we making today?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Select a category')

for (const category of supplies.categories) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(category.name)
      .setValue(`barista-supplies-${category.value}-menu`)
      .setDescription(category.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Confirm')
    .setValue('confirm')
    .setDescription('Finish the order.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Clear')
    .setValue('clear')
    .setDescription('Restart the order.'),
    new StringSelectMenuOptionBuilder()
    .setLabel('Cancel')
    .setValue('cancel')
    .setDescription('You woke up and chose violence today.'),
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
