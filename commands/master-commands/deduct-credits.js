import { SlashCommandBuilder } from 'discord.js';
import { UserServices } from '../../services/user-services.js';
import { MathServices } from '../../services/math-services.js';
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'MasterCommand.DeductCredits';
export default {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('deduct-credits')
    .setDescription('Deduct credits from user.')
    .addUserOption(option => 
      option
      .setName('user')
      .setDescription('Input username.')
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount.')
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

      const cachedUser = await UserServices.getBalance(user.id);
      const inDebt = amount > cachedUser.balance;
      const willBeLiable = (cachedUser.balance - amount) < cachedUser.max_debt;


      if (willBeLiable) {
        if (isSelf) {
          return await interaction.reply({
            content: `Word from the wise. Do not sacrifice more than what you have.`
          });
        }
        return await interaction.reply({
          content: `Hey. This person is already poor enough. Go rob someone else.`
        });
      }

      let result = await UserServices.subtractBalance(user.id, amount);
      result = MathServices.displayCurrency(result.userBalance.balance);

      if (inDebt) {
        if (isSelf) {
          return await interaction.reply({
            content: `You have taken **${funds.amount} ${funds.units}** from youself and sent it to the *Void*. You are now in debt.\nYour New Balance: **${result.amount} ${result.units}**`
          });
        }
        return await interaction.reply({
          content: `You have taken **${funds.amount} ${funds.units}** from **${user.username}** and sent it to the *Void*. They are now in debt because of you.\n${user.username}'s New Balance: **${result.amount} ${result.units}**`
        });
      }
      if (isSelf) {
        return await interaction.reply({
          content: `You have taken **${funds.amount} ${funds.units}** from youself and sent it to the *Void*. You are weird.\nYour New Balance: **${result.amount} ${result.units}**`
        });
      }
      return await interaction.reply({
        content: `Transfer completed. You have taken **${funds.amount} ${funds.units}** from **${user.username}** and sent it to the *Void*.\n\n${user.username}'s New Balance: **${result.amount} ${result.units}**`
      });
    } catch (e) {
      ErrorServices.handleError(commandName, e);
    }
  }
}
