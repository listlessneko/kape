const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const tea = drinks.types.find(type => type.name === 'Tea');
const subCustomId = 'tea-sub-menu'

const content = tea.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
  .setPlaceholder(tea.placeholder)

for (i of tea.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(`${i.name} (${i.cost} credits, ${i.energy_replen} energy)`)
      .setValue(i.value)
      .setDescription(i.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Go Back')
    .setValue('drinks-sub-menu')
    .setDescription('Go back.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: subCustomId
}
