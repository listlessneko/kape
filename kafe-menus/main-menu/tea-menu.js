const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const tea = drinks.types.find(type => type.name === 'Tea');

const content = tea.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(tea.custom_id)
  .setPlaceholder(tea.placeholder)

for (i of tea.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(`${i.name} (${i.cost} credits)`)
      .setValue(i.value)
      .setDescription(i.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Drinks Menu')
    .setValue('drinks')
    .setDescription('Go back to Drinks Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Main Menu')
    .setValue('main-menu')
    .setDescription('Go back to Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You chnage your mind.')
)

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: tea.custom_id
}
