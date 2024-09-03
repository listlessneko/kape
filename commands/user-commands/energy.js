const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('energy')
    .setDescription('Check user energy levels.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const currentEnergy = await UserServices.getUsers(user.id);

    if (user === interaction.user) {
      if (currentEnergy.max_energy) {
        return interaction.reply({
          content: `You have max **${currentEnergy.energy} energy**. Why don't you go do something?`
        });
      }
      if (currentEnergy.energy < 100 && currentEnergy.energy > 0) {
        return interaction.reply({
          content: `You have **${currentEnergy.energy} energy**. Working hard?`
        });
      }
      else if (currentEnergy.min_energy) {
        return interaction.reply({
          content: `You have **${currentEnergy.energy} energy**. A..are you still alive?`
        });
      }
    }
    else {
      if (currentEnergy.max_energy) {
        return interaction.reply({
          content: `**${user.username}** has **${currentEnergy.energy} energy**. Be careful with that one.`
        });
      }
      if (currentEnergy.energy < 100 && currentEnergy.energy > 0) {
        return interaction.reply({
          content: `**${user.username}** has **${currentEnergy.energy} energy**. They are surviving.`
        });
      }
      else if (currentEnergy.min_energy) {
        return interaction.reply({
          content: `**${user.username}** has **${currentEnergy.energy} energy**. Perhaps they are dead now.`
        });
      }
    }
  }
}
