import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

const beverages = supplies.categories.find(category => category.name === 'Beverages');

export const customId = beverages.custom_id;
export const content = beverages.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(beverages.placeholder)

for (let group of beverages.groups) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(group.name)
      .setValue(group.value)
      .setDescription(group.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Supplies Main Menu')
    .setValue('supplies-main-menu')
    .setDescription('Go back to Supplies Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
