const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe.`
    });
  }
}
