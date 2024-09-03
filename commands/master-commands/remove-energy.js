const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js')); 

module.exports = {
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
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const user = interaction.options.getUser('user') ?? interaction.user;
    const amount = interaction.options.getNumber('amount');

    const userEnergy = await UserServices.getUsers(user.id);

    if (user.id === interaction.user.id) {
      console.log('Remove Energy Command - Is Commander:', user.id === interaction.user.id);
      if (userEnergy.min_energy) {
        return await interaction.reply({
          content: `You are already at **${userEnergy.energy} energy**. Do you want to die?`
        });
      }

      const result = await UserServices.removeEnergy(amount, user.id);

      if (result.min_energy) {
        return await interaction.reply({
          content: `Your energy is now at **${result.new_energy}**. You are dead now.`
        });
      }

      return await interaction.reply({
        content: `You have removed **${amount} energy** from yourself and now have **${result.new_energy}**. You are just wasting your efforts.`
      });
    }

    else {
      console.log('Remove Energy Command - Is Commander:', user.id === interaction.user.id);
      if (userEnergy.min_energy) {
        return await interaction.reply({
          content: `**${user.username}** is already at **${userEnergy.energy}** energy. Are you trying to kill them?`
        });
      }

      const result = await UserServices.removeEnergy(amount, user.id);

      if (result.min_energy) {
        return await interaction.reply({
          content: `**${user.username}**'s energy is now at **${result.new_energy}**. You have killed them.`
        });
      }

      return await interaction.reply({
        content: `You have removed **${amount} energy** from **${user.username}**. They now have **${result.new_energy}**. What are you going to do with that energy?`
      });
    }
  }
}
