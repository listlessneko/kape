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
    const currentEnergy = await UserServices.getEnergy(user.id);

    console.log('user:', user);
    console.log('username:', user.username);

    if (user === interaction.user) {
      if (currentEnergy < 100 && currentEnergy > 0) {
        return interaction.reply({
          content: `You have **${currentEnergy.energy} energy**.\nWorking hard?`
        });
      }
      return interaction.reply({
        content: `You have max **${currentEnergy.energy} energy**. Why don't you go do something?`
      });
    }

    return interaction.reply({
      content: `**${user.username}** has **${currentEnergy.energy} energy**.`
    });
  }
}
