import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import supplies from '../../data/supplies.json' assert { type: 'json' };

const beverages = supplies.categories.find(category => category.name === 'Beverages')
const miscellaneous = beverages.groups.find(group => group.name === 'Miscellaneous');

export const customId = miscellaneous.custom_id;
export const content = miscellaneous.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(miscellaneous.placeholder)

for (let item of miscellaneous.items) {
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
