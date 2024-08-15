const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js')); 

module.exports = {
  cooldown: 5,
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
    const user = interaction.options.getUser('user') ?? interaction.user;
    const amount = interaction.options.getNumber('amount');

    const userEnergy = await UserServices.getEnergy(user.id);

    if (user.id === interaction.user.id) {
      if (userEnergy.min === true) {
        return await interaction.reply({
          content: `You are already at (**${userEnergy.energy}**) energy. Do you want to die?`
        });
      }

      const result = await UserServices.removeEnergy(user.id, amount);

      return await interaction.reply({
        content: `You have removed **${amount} energy** from yourself and now have **${result.energy}**. You're just wasting your efforts.`
      });
    }

    else {
      if (userEnergy.min === true) {
        return await interaction.reply({
          content: `**${user.username}** is already at (**${userEnergy.energy}**) energy. Are you trying to kill them?`
        });
      }

      const result = await UserServices.removeEnergy(user.id, amount);

      return await interaction.reply({
        content: `You have removed **${amount} energy** from **${user.username}**. They are now at **${result.energy}**.`
      });
    }
  }
}
