import { SlashCommandBuilder } from 'discord.js';
import { UserServices } from '../../services/user-services.js';
import { MathServices } from '../../services/math-services.js';
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'MasterCommand.AddCredits';
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('add-credits')
    .setDescription('Add credits to user.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount.')
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
      const funds = MathServices.displayCurrency(amount);

      let result = await UserServices.addBalance(user.id, amount);
      result = MathServices.displayCurrency(result.userBalance.balance);

      if (isSelf) {
        return await interaction.reply({
          content: `You have given yourself **${funds.amount} ${funds.units}**. You are spoiled.\nYour New Balance: **${result.amount} ${result.units}**`
        });
      }
      return await interaction.reply({
        content: `Transfer completed. You have given **${funds.amount} ${funds.units}** to **${user.username}**.\n\n${user.username}'s New Balance: **${result.amount} ${result.units}**`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
