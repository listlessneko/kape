import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { UserServices } from '../../services/user-services.js'; 
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'MasterCommand.RemoveEnergy';
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('remove-energy')
    .setDescription('Remove energy to user.')
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
      if (!this.allowedUserId.includes(interaction.user.id)){
        return await interaction.reply({
          content: `You do not have permission to use this command. Please consult with the developer.`,
          ephemeral: true
        });
      }
      const user = interaction.options.getUser('user') ?? interaction.user;
      const isSelf = user.id === interaction.user.id;
      const amount = interaction.options.getNumber('amount');

      const userEnergy = await UserServices.getEnergy(user.id);
      const atMinEnergy = userEnergy.energy === userEnergy.min_energy;

      if (atMinEnergy) {
        if (isSelf) {
          logger.log(`[LOG] Interaction User '${user.id}' is already at min '${userEnergy.energy}.`);
          return await interaction.reply({
            content: `You are already at **${userEnergy.energy} energy**. Do you want to die?`
          });
        }
        logger.log(`[LOG] User '${user.id}' is already at min '${userEnergy.energy}.`);
        return await interaction.reply({
          content: `**${user.username}** is already at **${userEnergy.energy}** energy. Are you trying to kill them?`
        });
      }

      let result = await UserServices.removeEnergy(user.id, amount);
      result = result.userEnergy;
      const isDead = result.energy === result.min_energy;

      if (isDead) {
        if (isSelf) {
          logger.log(`[LOG] ${commandName} Interaction User '${user.id}' lost '${amount}' energy and now has '${userEnergy.energy}' energy. They are dead.`);
          return await interaction.reply({
            content: `Your energy is now at **${result.energy}**. You are dead.`
          });
        }
        logger.log(`[LOG] ${commandName} User '${user.id}' lost '${amount}' energy and now has '${userEnergy.energy}' energy. They are now dead.`);
        return await interaction.reply({
          content: `**${user.username}**'s energy is now at **${result.energy}**. You have killed them.`
        });
      }

      if (isSelf) {
        logger.log(`[LOG] ${commandName} Interaction User '${user.id}' lost '${amount}' energy and now has '${userEnergy.energy}' energy.`);
        return await interaction.reply({
          content: `You have removed **${amount} energy** from yourself and now have **${result.energy}**. You are just wasting your efforts.`
        });
      }
      logger.log(`[LOG] ${commandName} User '${user.id}' lost '${amount}' energy and now has '${userEnergy.energy}' energy.`);
      return await interaction.reply({
        content: `You have removed **${amount} energy** from **${user.username}**. They now have **${result.energy}**. What are you going to do with that energy?`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
