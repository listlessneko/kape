const { SlashCommandBuilder } = require('discord.js');
const { UserLevelsServices } = require('../../services/user-levels-services.js');
const { FormatServices } = require('../../services/format-services.js');

module.exports = {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check user current level.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const userInstance = await UserLevelsServices.checkLevel(user.id);
    const userLevelDataValues = Object.entries(userInstance);

    const userLevelInfo = [];

    const excludedFields = ['user_id', 'level_up', 'prev_exp_req'];

    userLevelDataValues.forEach(([field, value]) => {
      if (!excludedFields.includes(field)) {
        userLevelInfo.push(`${FormatServices.nameFormatter(field)}: ${value}`);
      }
    });

    if (user === interaction.user) {
      await interaction.reply({
        content: `**Your current Level and Exp stats:**\n${userLevelInfo.join('\n')}`
      });
      return console.log(`${user.id} (Interaction User) level stats displayed.`);
    }

    await interaction.reply({
      content: `**${user.username}'s current Level and Exp stats:**\n${userLevelInfo.join('\n')}`,
    });
    return console.log(`${user.id} level stats displayed.`);
  }
}
