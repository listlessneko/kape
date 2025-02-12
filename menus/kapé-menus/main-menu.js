import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

export const customId = 'kapé-main-menu';
export const content = 'Welcome to Kapé Kafe. What would you like to order today?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Check out our menu.')

for (const category of kapéItems.categories) {
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
