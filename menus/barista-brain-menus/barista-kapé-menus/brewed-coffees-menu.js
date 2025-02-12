import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from "discord.js";
import baristaKapéItems from '../../../data/barista-kapé-items.json' assert { type: 'json' };

const mainMenu = {
  name: 'Main Menu',
  value: 'barista-kapé'
}
const targetCategory = {
  name: 'Brews',
  value: 'brews'
};
const targetType = {
  name: 'Brewed Coffees',
  value: 'brewed-coffees'
};

const theType = baristaKapéItems.categories
  .find(category => category.name === targetCategory.name).types
  .find(type => type.name === targetType.name).items
  .filter(item => item.prepared === false);

export const customId = `${mainMenu.value}-${targetType.value}-menu`;
export const content = 'What brew would you like to see?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Select a brew.')

for (const item of theType) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(item.name)
      .setValue(item.id)
      .setDescription(item.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel(`${targetCategory.name} Menu`)
    .setValue(`${mainMenu.value}-${targetCategory.value}-menu`)
    .setDescription(`Go back to the ${targetCategory.name} Menu.`),
  new StringSelectMenuOptionBuilder()
    .setLabel(`${mainMenu.name} Menu`)
    .setValue(`${mainMenu.value}-main-menu`)
    .setDescription(`Go back to the ${mainMenu.name} Menu.`),
  new StringSelectMenuOptionBuilder()
    .setLabel('Close')
    .setValue('close')
    .setDescription('You\'re finished with studying for now.'),
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
