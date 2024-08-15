const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const food = items.categories.find(category => category.name === 'Food');

const content = food.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(food.custom_id)
  .setPlaceholder(food.placeholder)

for (type of food.types) {
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
  customId: food.custom_id
}
