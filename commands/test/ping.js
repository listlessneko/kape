const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    const exampleUsers = ['456', '789'];
    await UserServices.getBalance(interaction.user.id);
    exampleUsers.push(interaction.user.id);
    await UserServices.getUsers(...exampleUsers);
    await interaction.reply({
      content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    });
  }
}
