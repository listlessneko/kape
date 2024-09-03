const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { MathServices } = require('../../services/math-services.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const drinks = items.categories.find(category => category.name === 'Drinks')
const noncaffeinated = drinks.types.find(type => type.name === 'Non-Caffeinated');
const subCustomId = 'non-caffeinated-sub-menu'

const content = noncaffeinated.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(subCustomId)
  .setPlaceholder(noncaffeinated.placeholder)

for (i of noncaffeinated.items) {
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


