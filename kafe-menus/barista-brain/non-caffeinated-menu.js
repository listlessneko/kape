const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { MathServices } = require('../../services/math-services.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const noncaffeinated = drinks.types.find(type => type.name === 'Non-Caffeinated');
const subCustomId = 'barista-non-caffeinated-menu'

const content = noncaffeinated.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
  .setPlaceholder('Select type of non-caffeinated drink to make.')

for (i of noncaffeinated.items) {
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


