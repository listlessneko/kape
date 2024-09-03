const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js')); 

module.exports = {
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
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const user = interaction.options.getUser('user') ?? interaction.user;
    const amount = interaction.options.getNumber('amount');

    const userEnergy = await UserServices.getUsers(user.id);
    console.log('User Energy:', userEnergy);

    if (user.id === interaction.user.id) {
      if (userEnergy.max_energy) {
        return await interaction.reply({
          content: `You are already at max **${userEnergy.energy} energy**. Be careful.`
        });
      }

      if (userEnergy.min_energy) {
        const result = await UserServices.addEnergy(amount, user.id);

        return await interaction.reply({
          content: `You have brought yourself back to life. Current energy is at **${result.new_energy}**.`
        });
      }

      const result = await UserServices.addEnergy(amount, user.id);

      return await interaction.reply({
        content: `You have given **${amount} energy** to yourself and now have **${result.new_energy}**. Where do you get all this energy from?`
      });
    }

    else {
      if (userEnergy.max_energy) {
        return await interaction.reply({
          content: `**${user.username}** is already at max **${userEnergy.energy} energy**. Be careful.`
        });
      }
      if (userEnergy.min_energy) {
        const result = await UserServices.addEnergy(amount, user.id);

        return await interaction.reply({
          content: `You have brought **${user.username}** back to life. They now have **${result.new_energy} energy**. Are you a deity?`
        });
      }

      const result = await UserServices.addEnergy(amount, user.id);

      return await interaction.reply({
        content: `You have given **${amount} energy** to **${user.username}**. They are now at **${result.new_energy} energy**.`
      });
    }
  }
}
