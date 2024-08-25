const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const coffee = drinks.types.find(type => type.name === 'Coffee');

const content = coffee.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(coffee.custom_id)
  .setPlaceholder(coffee.placeholder)

for (i of coffee.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(`${i.name} (${i.cost} credits, ${i.energy_replen} energy)`)
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
  customId: coffee.custom_id
}
