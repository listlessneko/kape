const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks');
const subCustomId = 'barista-drinks-menu';

const content = drinks.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
  .setPlaceholder('Select type of drink to make.')

for (type of drinks.types) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(`barista-${type.value}-menu`)
      .setDescription(type.description)
  )
}

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: subCustomId
}
