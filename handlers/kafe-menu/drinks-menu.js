const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks');

const content = drinks.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(drinks.custom_id)
  .setPlaceholder(drinks.description)

for (type of drinks.types) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(type.value)
      .setDescription(type.description)
  )
}

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: drinks.custom_id
}
