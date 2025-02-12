import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../../data/barista-supplies.json' assert { type: 'json' };

const mainMenu = {
  name: 'Main Menu',
  value: 'barista-supplies'
}
const type = {
  name: 'Ingredients',
  value: 'ingredients'
};
const targetGroup = {
  name: 'Tea Leaves',
  value: 'tea-leaves'
};

const theGroup = supplies.categories
  .find(category => category.name === type.name)?.groups
  .find(group => group.name === targetGroup.name);

export const customId = `${mainMenu.value}-${theGroup.custom_id}-menu`;
export const content = theGroup.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(theGroup.placeholder)

for (let item of theGroup.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(item.name)
      .setValue(item.value)
      .setDescription(item.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel(`${type.name} Menu`)
    .setValue(`${mainMenu.value}-${type.value}-menu`)
    .setDescription(`Go back to ${type.name} Menu.`),
  new StringSelectMenuOptionBuilder()
    .setLabel(`${mainMenu.name}`)
    .setValue(`${mainMenu.value}-main-menu`)
    .setDescription(`Go back to ${mainMenu.name}.`),
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
