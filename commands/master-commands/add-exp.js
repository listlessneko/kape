
import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { UserServices } from '../../services/user-services.js'; 
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'MasterCommand.AddExp';
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('add-exp')
    .setDescription('Add experience to user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount of experience.')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    try {
      if (!this.allowedUserId.includes(interaction.user.id)) {
        return await interaction.reply({
          content: `You do not have permission to use this command. Please consult with the developer.`,
          ephemeral: true
        });
      }
      const user = interaction.options.getUser('user') ?? interaction.user;
      const isSelf = user.id === interaction.user.id;
      const amount = interaction.options.getNumber('amount');

      let result = await UserServices.addExp(user.id, amount);
      result = result.userLevel;

      if (isSelf) {
        logger.log(`[LOG] ${commandName} Interaction User '${user.id}' gave themself '${amount}' experience and now has '${result.current_level_exp}' experience.`);

        return await interaction.reply({
          content: `You have given **${amount} experience** to yourself and now have **${result.current_level_exp} experience**. Where do you get all this knowledge and wisdom from?`
        });
      }
      logger.log(`[LOG] ${commandName} User '${user.id}' received '${amount}' experience and now has '${result.current_level_exp}' experience.`);
      return await interaction.reply({
        content: `You have given **${amount} experience** to **${user.username}**. They are now at **${result.current_level_exp} experience**.`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
