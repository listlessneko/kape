import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import baristaKapéItems from '../../../data/barista-kapé-items.json' assert { type: 'json' };

const categories = baristaKapéItems.categories.map(category => ({
  ...category,
  types: category.types.map(type => ({
    ...type,
    items: type.items.filter(item => item.prepared === false)
  })).filter(type => type.items.length > 0)
})).filter(category => category.types.length > 0);

export const customId = 'barista-kapé-main-menu';
export const content = 'What brew would you like to see?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Select a category')

for (const category of categories) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(category.name)
      .setValue(`barista-kapé-${category.value}-menu`)
      .setDescription(category.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Close')
    .setValue('close')
    .setDescription('You\'re finished with studying for now.'),
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
