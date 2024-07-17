const path = require('node:path')

const { Events } = require('discord.js');

const { client } = require(path.join(__dirname, '..', 'client.js'))

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching '${interaction.commandName} was found.`);
        return;
      }

      if (interaction.commandName === 'ping') {
        try {
          await command.execute(interaction);
          return;
        }
        catch (error) {
          console.error('There was an error executing this command.', error);
          await interaction.reply({
            content: `Sorry. Kapé Kafe is currently closed. Please come again. Maybe...`,
          });
        }
      }

      try {
        await command.execute(interaction);
      }
      catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ 
            content: `There was a problem with your request.`,
          });
        }
        else {
          await interaction.reply({ 
            content: `There was a problem with your request.`,
          });
        }
      }
    } 
  },
};
