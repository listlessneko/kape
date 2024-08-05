const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('grand-opening')
    .setDescription('When will the cafe open?'),

  async execute(interaction) {
    const grandOpening = new Date('2024-08-31');
    const now = new Date();
    const remaining_days = Math.ceil( (Math.abs(grandOpening-now)) / (1000 * 60 * 60 * 24) );
    interaction.reply({
      content: `Under construction. Please come back for our grand opening in **${remaining_days} days**.`
    });
  },
}
