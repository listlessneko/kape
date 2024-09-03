const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { MathServices } = require('../../services/math-services.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const food = items.categories.find(category => category.name === 'Food')
const lunch = food.types.find(type => type.name === 'Lunch');

const content = lunch.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(lunch.custom_id)
  .setPlaceholder(lunch.placeholder)

for (i of lunch.items) {
  const max = MathServices.formatNumber(i.energy_replen.max);
  const min = MathServices.formatNumber(i.energy_replen.min);

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(
        (() => {
          if (i.energy_replen.min === i.energy_replen.max) {
            return `${i.name} (${i.cost} credits, ${max} energy)`;
          }
          else {
            return `${i.name} (${i.cost} credits, ${min} to ${max} energy)`;
          }
        })()
      )
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
  customId: lunch.custom_id
}
