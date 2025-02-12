import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

const ingredients = supplies.categories.find(category => category.name === 'Ingredients')
const powders = ingredients.groups.find(group => group.name === 'Powders');

export const customId = powders.custom_id;
export const content = powders.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(powders.placeholder)

for (let item of powders.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(item.name)
      .setValue(item.value)
      .setDescription(item.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Ingredients Menu')
    .setValue('ingredients-menu')
    .setDescription('Go back to Ingredients Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Supplies Main Menu')
    .setValue('supplies-main-menu')
    .setDescription('Go back to Supplies Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You chnage your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
