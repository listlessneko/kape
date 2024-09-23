const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { MathServices } = require('../../services/math-services.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const coffee = drinks.types.find(type => type.name === 'Coffee');
const subCustomId = 'barista-coffee-menu'

const content = coffee.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
  .setPlaceholder('Select type of coffee to make.')

for (i of coffee.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(i.name)
      .setValue(i.value)
      .setDescription(i.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Go Back')
    .setValue('barista-drinks-menu')
    .setDescription('Go back.'),
)

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: subCustomId
}
