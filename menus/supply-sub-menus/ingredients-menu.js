import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

const ingredients = supplies.categories.find(category => category.name === 'Ingredients');

export const customId = ingredients.custom_id + '-sub-menu';
export const content = ingredients.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(ingredients.placeholder)

for (let group of ingredients.groups) {
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
