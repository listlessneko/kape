const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks');

const content = drinks.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(drinks.custom_id)
  .setPlaceholder(drinks.placeholder)

for (type of drinks.types) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(type.value)
      .setDescription(type.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Main Menu')
    .setValue('main-menu')
    .setDescription('Go back to Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: drinks.custom_id
}
