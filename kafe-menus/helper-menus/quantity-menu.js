const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const content = 'Select number of items.';
const customId = 'quantity-menu';

function row(menu, action, num, item) {
  console.log('Quantity Menu - Menu:', menu);
  console.log('Quantity Menu - Num Initial:', num);
  num = num <= 20 ? num : 20;
  console.log('Quantity Menu - Num After:', num);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select number of items.')

  let i = 1;
  while (i < (num + 1)) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
      .setLabel(`${i}`)
      .setValue(`${i} ${item}`)
      .setDescription(`${action} ${i} ${item}`)
    )
    i++;
  }

  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Go Back')
      .setValue(`${menu}`)
      .setDescription('Go back.'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Nevermind')
      .setValue('nevermind')
      .setDescription('You change your mind.')
  )

  return new ActionRowBuilder().addComponents(selectMenu);
}

module.exports = {
  content,
  row,
  customId
}
