const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Display full menu.'),

  async execute(interaction) {
    const menu = [];
    for (category of items.categories) {
      for (type of category.types) {
        if (type.items.length > 0) {
          menu.push(
            `${type.icon} __**${type.name}**__\n${type.items.map(item => `${item.name}, ${item.cost} credits\n*${item.description}*\n`).join('\n')}`
          );
        }
      }
    }
    console.log(menu);
    interaction.reply({
      content: menu.join('\n---\n\n')
    });
    },
  }
