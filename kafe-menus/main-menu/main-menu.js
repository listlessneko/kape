const path = require('node:path');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

const content = 'Welcome to Kapé Kafe. What would you like to order today?';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId('main-menu')
  .setPlaceholder('Check out our menu.')

for (const category of items.categories) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(category.name)
      .setValue(category.value)
      .setDescription(category.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind')
)

const row = new ActionRowBuilder().addComponents(selectMenu);

module.exports = {
  content,
  row,
  customId: 'main-menu'
}
