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

const theCategory = baristaKapéItems.categories
  .find(category => category.name === targetCategory.name).types
  .map(type => ({
    ...type,
    items: type.items
      .filter(item => item.prepared === false)
  })).filter(type => type.items.length > 0);

export const customId = `${mainMenu.value}-${targetCategory.value}-menu`;
export const content = 'What brew would you like to see?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Select a type of brew')

for (const type of theCategory) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(`${mainMenu.value}-${type.value}-menu`)
      .setDescription(type.description)
  )
}

selectMenu.addOptions(
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
