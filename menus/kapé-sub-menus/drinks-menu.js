import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

const drinks = kapéItems.categories.find(category => category.name === 'Drinks');

export const customId = 'kapé-drinks-sub-menu';
export const content = drinks.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(drinks.placeholder)

for (let type of drinks.types) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(`kapé-${type.value}-sub-menu`)
      .setDescription(type.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
