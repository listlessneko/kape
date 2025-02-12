import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

const beverages = supplies.categories.find(category => category.name === 'Beverages')
const soda = beverages.groups.find(group => group.name === 'Soda');

export const customId = soda.custom_id + '-sub-menu';
export const content = soda.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(soda.placeholder)

for (let item of soda.items) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(item.name)
      .setValue(item.value)
      .setDescription(item.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Beverages Menu')
    .setValue('beverages-menu')
    .setDescription('Go back to Beverages Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Supplies Main Menu')
    .setValue('supplies-main-menu')
    .setDescription('Go back to Supplies Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You chnage your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
