const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { ScoresServices } = require(path.join(__dirname, '..', '..', 'services', 'scores-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rps-scores')
    .setDescription('Display rock paper scissors score against Kapé.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    function isLetter(char) {
      const code = char.charCodeAt(0);
      return (code >= 97 && code <= 120);
    }

    function nameFormatter(string) {
      let newString = '';
      console.log('RPS Scores - New String:', newString);
      let elementalize = string.split('_');
      console.log('RPS Scores - Elementalize:', elementalize);
      let properfy = elementalize.map(word => {
        if (isLetter(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      });
      console.log('RPS Scores - Properfy:', properfy);
      return newString = properfy.join(' ');
    }

    const user = interaction.options.getUser('user') ?? interaction.user;
    const userInstance = await ScoresServices.getRpsScores(user.id);
    const scoresDataValues = Object.entries(userInstance.dataValues);
    console.log('RPS Score Cmd - Scores Data Values:', scoresDataValues);
    const scores = [];

    const excludedKeys = ['id', 'user_id'];

    scoresDataValues.forEach(([key, value]) => {
      if (!excludedKeys.includes(key)) {
        scores.push(`${nameFormatter(key)}: ${value}`);
      }
    });

    console.log('RPS Score Cmd - Scores:', scores);

    return await interaction.reply({
      content: `__**Rock Paper Scissors Against Kapé**__\n${scores.join('\n')}`
    });
  }
}
