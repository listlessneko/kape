const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js')); 

module.exports = {
  cooldown: 5,
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
    const user = interaction.options.getUser('user') ?? interaction.user;
    const amount = interaction.options.getNumber('amount');

    const userEnergy = await UserServices.getEnergy(user.id);
    console.log('User Energy:', userEnergy);

    if (user.id === interaction.user.id) {
      if (userEnergy.max === true) {
        return await interaction.reply({
          content: `You are already at max (**${userEnergy.energy}**) energy. Be careful.`
        });
      }

      const result = await UserServices.addEnergy(user.id, amount);

      return await interaction.reply({
        content: `You have given **${amount} energy** to yourself and now have **${result.energy}**. Where do you get all this energy from?`
      });
    }

    else {
      if (userEnergy.max === true) {
        return await interaction.reply({
          content: `**${user.username}** is already at max (**${userEnergy.energy}**) energy. Be careful.`
        });
      }

      const result = await UserServices.addEnergy(user.id, amount);

      return await interaction.reply({
        content: `You have given **${amount} energy** to **${user.username}**. They are now at **${result.energy}**.`
      });
    }
  }
}
