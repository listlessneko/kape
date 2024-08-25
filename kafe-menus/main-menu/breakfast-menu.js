const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const food = items.categories.find(category => category.name === 'Food')
const breakfast = food.types.find(type => type.name === 'Breakfast');

const content = breakfast.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(breakfast.custom_id)
  .setPlaceholder(breakfast.placeholder)

for (i of breakfast.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(`${i.name} (${i.cost} credits, ${i.energy_replen} energy)`)
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
  customId: breakfast.custom_id
}
