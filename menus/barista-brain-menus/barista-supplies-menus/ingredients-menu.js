import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../../data/barista-supplies.json' assert { type: 'json' };

const mainMenu = {
  name: 'Main Menu',
  value: 'barista-supplies'
}

const targetType = {
  name: 'Ingredients',
  value: 'ingredients'
}

const theType = supplies.categories.find(category => category.name === targetType.name);

export const customId = `${mainMenu.value}-${targetType.value}-menu`;
export const content = theType.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(theType.placeholder)

for (let group of theType.groups) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(group.name)
      .setValue(`${mainMenu.value}-${group.value}-menu`)
      .setDescription(group.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel(`${mainMenu.name}`)
    .setValue(`${mainMenu.value}-main-menu`)
    .setDescription(`Go back to ${mainMenu.name}.`),
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
