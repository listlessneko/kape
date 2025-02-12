import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { UserServices } from '../../services/user-services.js'; 
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'MasterCommand.AddEnergy';
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('add-energy')
    .setDescription('Add energy to user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount of energy.')
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

      const userEnergy = await UserServices.getEnergy(user.id);
      const atMaxEnergy = userEnergy.energy === userEnergy.max_energy;
      const atMinEnergy = userEnergy.energy === userEnergy.min_energy;

      if (atMaxEnergy) {
        if (isSelf) {
          logger.log(`[LOG] ${commandName} Interaction User '${user.id}' is already at max '${userEnergy.energy}' energy.`);
          return await interaction.reply({
            content: `You are already at max **${userEnergy.energy} energy**. Be careful.`
          });
        }
        logger.log(`[LOG] ${commandName} User '${user.id}' is already at max '${userEnergy.energy}' energy.`);
        return await interaction.reply({
          content: `**${user.username}** is already at max **${userEnergy.energy} energy**. Be careful.`
        });
      }
      if (atMinEnergy) {
        let result = await UserServices.addEnergy(user.id, amount);
        result = result.userEnergy;
        if (isSelf) {
          logger.log(`[LOG] ${commandName} Interaction User '${user.id}' is brought back to life. Current energy is at '${userEnergy.energy}' energy.`);

          return await interaction.reply({
            content: `You have brought yourself back to life. Current energy is at **${result.energy}**.`
          });
        }
        logger.log(`[LOG] ${commandName} User '${user.id}' is brought back to life. Current energy is at '${userEnergy.energy}' energy.`);
        return await interaction.reply({
          content: `You have brought **${user.username}** back to life. They now have **${result.energy} energy**. Are you a deity?`
        });
      }

      let result = await UserServices.addEnergy(user.id, amount);
      logger.debug(`[TEST] result:`, result);
      result = result.userEnergy;

      if (isSelf) {
        logger.log(`[LOG] ${commandName} Interaction User '${user.id}' gave themself '${amount}' energy and now has '${userEnergy.energy}' energy.`);

        return await interaction.reply({
          content: `You have given **${amount} energy** to yourself and now have **${result.energy}**. Where do you get all this energy from?`
        });
      }
      logger.log(`[LOG] ${commandName} User '${user.id}' received '${amount}' energy and now has '${userEnergy.energy}' energy.`);
      return await interaction.reply({
        content: `You have given **${amount} energy** to **${user.username}**. They are now at **${result.energy} energy**.`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
