const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
//const { LeaderboardsServices } = require('../../services/leaderboards-services.js');
const { ScoresServices } = require(path.join(__dirname, '..', '..', 'services', 'scores-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rps-score')
    .setDescription('Display rock paper scissors score against Kapé.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const userInstance = await ScoresServices.getUsers(user.id);
    const scores = userInstance.dataValues;
    console.log('RPS Score Cmd - Scores:', scores);
    console.log('RPS Score Cmd - Scores Wins:', scores.wins);
    console.log('RPS Score Cmd - Scores Losses:', scores.losses);
    console.log('RPS Score Cmd - Scores Draws:', scores.draws);

    await interaction.reply({
      content: `__**Rock Paper Scissors Against Kapé**__\nVictories: ${scores.wins}\nDefeats: ${scores.losses}\nDraws: ${scores.draws}`
    });
  }
}
