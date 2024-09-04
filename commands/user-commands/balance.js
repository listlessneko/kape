const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require('../../services/user-services.js');
const { MathServices } = require('../../services/math-services.js');
const { FormatServices } = require('../../services/format-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check user balance.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const userInfo = await UserServices.getUsers(user.id);
    const balance = MathServices.wholeNumber(userInfo.balance);
    const units = FormatServices.determineUnits(userInfo.balance);

    if (user === interaction.user) {
      if (userInfo.balance < 10) {
        const pityChances = [5, 1, .50, .25];
        const thresholds = [.001, .25, .50, 1];
        const chance = Math.random();
        console.log('Balance - Chance:', chance);
        const selection = thresholds.findIndex(threshold => chance < threshold);
        console.log('Balance - Selection:', selection);
        let pity = pityChances[selection];
        console.log('Balance - Pity:', pity);
        const result = await UserServices.addBalance(pity, user.id);

        const pityUnits = FormatServices.determineUnits(pity);
        pity = await MathServices.wholeNumber(pity);

        const prev_balanceUnits = FormatServices.determineUnits(result.prev_balance);
        const prev_balance = await MathServices.wholeNumber(result.prev_balance);
        const new_balanceUnits = FormatServices.determineUnits(result.new_balance);
        const new_balance = await MathServices.wholeNumber(result.new_balance);

        return interaction.reply({
          content: `You have **${prev_balance} ${prev_balanceUnits}**.\nYou good? *The bot beeps in pity.* Here is **${pity} ${pityUnits}**. It is the most I can spare right now.\nYour New Balance: **${new_balance} ${new_balanceUnits}**`
        });
      }
      return interaction.reply({
        content: `You have **${balance} ${units}**.`
      });
    }
    return interaction.reply({
      content: `**${user.username}** has **${balance} ${units}**.`
    });
  }
}
