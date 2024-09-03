const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { client } = require('../../client.js');
const commands = client.commands;

module.exports = {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display list of commands.'),

  async execute(interaction) {
    const commandsList = [];

    for (const [commandName, command] of commands) {
      const options = command.data.options;

      if (!('allowedUserId' in command)) {
        console.log(commandName);
        if (options.length > 0) {
          options.forEach(option => {
            if (option instanceof SlashCommandSubcommandBuilder) {
              commandsList.push(`**/${commandName} ${option.name}**\n*${option.description}*`)
            }
            else {
              commandsList.push(`**/${commandName}**\n*${command.data.description}*`)
            }
          });
        }
        else {
          commandsList.push(`**/${commandName}**\n*${command.data.description}*`)
        }
      }
    }
    return await interaction.reply({
      content: `__**List of Commands**__\n\n${commandsList.join('\n\n')}`
    });
  },
};
