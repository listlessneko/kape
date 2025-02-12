import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';

export const customId = 'barista-modify-milk-menu';
export const content = 'Do something to the milk.';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('Modify the milk')

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Regular')
    .setValue('regular')
    .setDescription('Just dump it in.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Steamed')
    .setValue('steamed')
    .setDescription('Steam the milk.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Frothed')
    .setValue('frothed')
    .setDescription('Froth the milk.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Cancel')
    .setValue('barista-milk-menu')
    .setDescription('Go back to Milk Menu.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
