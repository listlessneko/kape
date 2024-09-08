const { SlashCommandBuilder } = require('discord.js');
const { ScoresServices } = require('../../services/scores-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('fate-scores')
    .setDescription('Display flip a coin scores.')
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
      let elementalize = string.split('_');
      let properfy = elementalize.map(word => {
        if (isLetter(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      });
      return newString = properfy.join(' ');
    }

    const user = interaction.options.getUser('user') ?? interaction.user.id;
    const scoresCache = await ScoresServices.getFateScores(user);
    const scoresDataValues = Object.entries(scoresCache.dataValues);
    const scores = [];

    const excludedKeys = ['id', 'user_id', 'createdAt', 'updatedAt'];

    scoresDataValues.forEach(([key, value]) => {
      if (!excludedKeys.includes(key)) {
        scores.push(`${nameFormatter(key)}: ${value}`);
      }
    });

    console.log('Fate Scores - Scores:', scores);

    return await interaction.reply({
      content: `__**Scores Against Fate**__\n${scores.join('\n')}`,
    });
  }
}
