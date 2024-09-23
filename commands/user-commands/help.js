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
    const hasSubcommands = [];

    try {
      for (const [commandName, command] of commands) {
      const options = command.data.options;

        if (!('allowedUserId' in command)) {
          if (options.length > 0) {
            options.forEach(option => {
              if (option instanceof SlashCommandSubcommandBuilder) {
                console.log('Has Subcommand:', commandName);
                commandsList.push(`**/${commandName} ${option.name}**\n*${option.description}*`)
                if (!hasSubcommands.includes(commandName)) {
                  console.log('Push to hasSubcommand:', commandName);
                  hasSubcommands.push(commandName);
                }
              }
            });
          }
          if (!hasSubcommands.includes(commandName)) {
            console.log('Not in hasSubcommands:', commandName);
            commandsList.push(`**/${commandName}**\n*${command.data.description}*`)
          }
        }
      }
      return await interaction.reply({
        content: `__**List of Commands**__\n\n${commandsList.join('\n\n')}`
      }); 
    }
    catch (e) {
      console.error('Help Cmd Error:', e);
    }
  },
};
