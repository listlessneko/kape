const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const food = items.categories.find(category => category.name === 'Food')
const dinner = food.types.find(type => type.name === 'Dinner');

const content = dinner.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(dinner.custom_id)
  .setPlaceholder(dinner.placeholder)

for (i of dinner.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(i.name)
      .setValue(i.value)
      .setDescription(i.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Food Menu')
    .setValue('food')
    .setDescription('Go back to Food Menu.'),
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
  customId: dinner.custom_id
}
