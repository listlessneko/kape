
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const content = `*You ruffle through your bag. Hm...*`;
const customId = 'inventory-menu';

function row(userItems) {
  const inventory = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('View your inventory.')

  userItems.forEach(userItem => {
    //console.log('Inventory Menu  - UserItem:', userItem);
    const quantity = userItem.quantity;
    const i = userItem.kafeItem;
    console.log('Inventory Menu - Item:', i);
    inventory.addOptions(
      new StringSelectMenuOptionBuilder()
      .setLabel(
        (() => {
          if (i.energy_replen.min === i.energy_replen.max) {
            return `x${quantity} ${i.name} (${i.cost} credits, ${i.energy_replen.max} energy)`;
          }
          else {
            return `x${quantity} ${i.name} (${i.cost} credits, ${i.energy_replen.min} - ${i.energy_replen.max} energy)`;
          }
        })()
      )
      .setValue(i.value)
      .setDescription(i.description)
    )
  });

  inventory.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Nevermind')
      .setValue('nevermind')
      .setDescription('Close bag.')
  )

  return new ActionRowBuilder().addComponents(inventory);
}

module.exports = {
  content,
  row,
  customId
}
