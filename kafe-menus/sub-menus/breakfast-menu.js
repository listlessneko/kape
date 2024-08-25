const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const food = items.categories.find(category => category.name === 'Food')
const breakfast = food.types.find(type => type.name === 'Breakfast');
const subCustomId = 'breakfast-sub-menu'

const content = breakfast.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
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
    .setLabel('Go Back')
    .setValue('food-sub-menu')
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
