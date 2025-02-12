import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';

export const customId = 'barista-modify-coffee-beans-menu';
export const content = 'Do something to the coffee beans.';

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder('What will you do to the beans?')

selectMenu.addOptions(
  new StringSelectMenuOptionBuilder()
    .setLabel('Brew')
    .setValue('brewed')
    .setDescription('Just dum– slowly pour hot water over it.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Espresso')
    .setValue('espresso-shot')
    .setDescription('Tamper and pull a shot of espresso.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Cancel')
    .setValue('barista-coffee-beans-menu')
    .setDescription('Go back to Coffee Beans Menu.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
