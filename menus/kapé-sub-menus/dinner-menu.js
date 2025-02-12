import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { MathServices } from '../../services/math-services.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

const dinner = kapéItems.categories
  .find(category => category.name === 'Food')?.types
  .find(type => type.name === 'Dinner');

export const customId = 'kapé-dinner-sub-menu';
export const content = dinner.content;

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(customId)
  .setPlaceholder(dinner.placeholder)

for (let i of dinner.items) {
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
    .setValue('kapé-food-sub-menu')
    .setDescription('Go back.'),
  new StringSelectMenuOptionBuilder()
    .setLabel('Nevermind')
    .setValue('nevermind')
    .setDescription('You change your mind.')
)

export const row = new ActionRowBuilder().addComponents(selectMenu);
