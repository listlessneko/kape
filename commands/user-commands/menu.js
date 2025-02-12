import { SlashCommandBuilder } from 'discord.js';
import { MathServices } from '../../services//all-services.js';
import kapéItems from '../../data/kapé-items.json' assert { type: 'json' };

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Display menu of available Kapé items.')
    .addSubcommandGroup(group =>
      group
        .setName('drinks')
        .setDescription('Select a drinks menu to display.')
        .addSubcommand(subcommand =>
          subcommand
            .setName('coffee')
            .setDescription('Display coffee menu.')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('tea')
            .setDescription('Display tea menu to display.')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('non-caffeinated')
            .setDescription('Display non-caffeinated menu.')
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('food')
        .setDescription('Select a food menu.')
        .addSubcommand(subcommand =>
          subcommand
            .setName('breakfast')
            .setDescription('Display breakfast menu.')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('lunch')
            .setDescription('Display lunch menu.')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('dinner')
            .setDescription('Display dinner menu.')
        )
    ),

  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    console.log('Menu Cmd - Subcommand Group:', subcommandGroup);
    const subcommand = interaction.options.getSubcommand();
    console.log('Menu Cmd - Subcommand:', subcommand);
    const menu = [];

    try {
      const category = kapéItems.categories.find(category => category.value === subcommandGroup);
      //console.log('Menu Cmd - Category:', category);
      const type = category.types.find(type => type.value === subcommand);
      //console.log('Menu Cmd - Type:', type);
      const itemsFormatted = type.items.map(item => {
        const cost = MathServices.displayCurrency(item.cost);
        //console.log('Menu Cmd - Cost:', cost);
        const energy = MathServices.formatEnergy(item.energy_replen.min, item.energy_replen.max);
        //console.log('Menu Cmd - Energy:', energy);
        if (item.energy_replen.min !== item.energy_replen.max) {
          menu.push(`**${item.name}**\n-# ${cost.amount} ${cost.units}, ${energy.min} energy to ${energy.max} energy\n*${item.description}*\n`);
        }
        else {
          menu.push(`**${item.name}**\n-# ${cost.amount} ${cost.units}, ${energy.max} energy\n*${item.description}*\n`);
        }
      });
      console.log('Menu Cmd - Items Formatted:', itemsFormatted);

      await interaction.reply({
        content: `${type.icon} __**${type.name}**__\n\n${menu.join('\n')}`
      });
    }
    catch (e) {
      console.error('Menu Cmd Error:', e);
    }
  },
}
