import { logger } from '../../logger.js';
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { client } from '../../client.js';

const thisCommandName = 'HelpCommand';

export default {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display list of commands.'),

  async execute(interaction) {
    const commands = client.cache['commands'];
    const mainCommandsList = [];
    const hasSubcommands = [];

    try {
      for (const [commandName, command] of commands) {
        const commandsList = [];
        const options = command.data.options;
        //logger.debug(`[DEBUG] ${thisCommandName} command:`, commandName);
        //logger.debug(`[DEBUG] ${thisCommandName} options:`, options);

        if (!('allowedUserId' in command)) {
          if (options.length > 0 && options.every(option => option instanceof SlashCommandSubcommandBuilder)) {
            options.forEach(option => {
              if (!hasSubcommands.includes(commandName)) {
                logger.log(`[LOG] ${thisCommandName} Push to hasSubcommand:`, commandName);
                hasSubcommands.push(commandName);
                commandsList.push(`__**/${commandName}**__\n`);
              } 
              //logger.log(`[LOG] ${thisCommandName} Has Subcommand:`, commandName);
              commandsList.push(`- **${option.name}**: *${option.description}*\n`)
            });
            commandsList.push('\n');
            mainCommandsList.push(commandsList.join(''));
            //logger.log(`[TEST] ${thisCommandName}:`, commandsList.join(''));
          } if (!hasSubcommands.includes(commandName)) {
            logger.log(`[LOG] ${thisCommandName} Not in hasSubcommands:`, commandName);
            commandsList.push(`__**/${commandName}**__\n*${command.data.description}*\n\n`)
            mainCommandsList.push(commandsList.join(''));
          }
        }
      }
      return await interaction.reply({
        content: `__**List of Commands**__\n\n${mainCommandsList.join('')}`
      }); 
    }
    catch (e) {
      logger.error(`[ERROR] ${thisCommandName}:`, e);
    }
  },
};
