const { Events } = require('discord.js');
const { client } = require('../client.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.cache['commands'].get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
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
          return;
        }
        else {
          await interaction.reply({ 
            content: `There was a problem with your request.`,
          });
          return;
        }
      }
    }
    else if (interaction.isAutocomplete()) {
      const command = client.cache['commands'].get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.autocomplete(interaction);
      }
      catch (error) {
        console.error(error);
      }
    }
  },
};
