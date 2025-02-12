import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

export const customId = 'supplies-main-menu';
export const content = 'Welcome to the Kafe Warehouse. What supplies do you need today?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('See what is in stock.')

for (const category of supplies.categories) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(category.name)
      .setValue(category.value)
      .setDescription(category.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
