import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

const food = kapéItems.categories.find(category => category.name === 'Food');

export const customId = food.custom_id;
export const content = food.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(food.placeholder)

for (let type of food.types) {
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel(type.name)
      .setValue(type.value)
      .setDescription(type.description)
  )
}

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Main Menu')
    .setValue('kapé-main-menu')
    .setDescription('Go back to Main Menu.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
