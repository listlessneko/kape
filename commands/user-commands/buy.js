const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the cafe.'),

  async execute(interaction) {
    const grandOpening = new Date('2024-08-31');
    const now = new Date();
    const remaining_days = Math.ceil( (Math.abs(grandOpening-now)) / (1000 * 60 * 60 * 24) );
    interaction.reply({
      content: `Under construction. Please come back for our grand opening in **${remaining_days} days**.`
    });
  },
}
