import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { MathServices } from '../../services/math-services.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

const food = kapéItems.categories.find(category => category.name === 'Food')
const breakfast = food.types.find(type => type.name === 'Breakfast');

export const customId = breakfast.custom_id;
export const content = breakfast.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(breakfast.custom_id)
  .setPlaceholder(breakfast.placeholder)

for (let i of breakfast.items) {
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
    .setValue('kapé-food-menu')
    .setDescription('Go back to Food Menu.'),
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
