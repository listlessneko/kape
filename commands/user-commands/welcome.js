const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Greetings.'),

  async execute(interaction) {
    try {
      return await interaction.reply({
        content: `Welcome to **Kapé Kafe**. I am **K2**, the one and only barista of this establishment. Though we specialize in coffee, we offer a modest range of drinks and food. Make yourself comfortable and please let me know if you need anything. If you have any questions, use the **/help** command.`
      }); 
    }
    catch (e) {
      console.error('Welcome Cmd Error:', e);
    }
  },
}
