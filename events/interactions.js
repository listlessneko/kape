import { Events } from 'discord.js';
import { client } from '../client.js';

export default {
  name: Events.InteractionCreate,
  on: true,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.cache['commands'].get(interaction.commandName);

      if (!command) {
        console.warn(`[WARN] No command matching ${interaction.commandName} was found.`);
        return;
      }

      if (interaction.commandName === 'ping') {
        try {
          await command.execute(interaction);
          return;
        }
        catch (error) {
          console.error('[ERROR] There was an error executing this command.', error);
          await interaction.reply({
            content: `Sorry. Kapé Kafe is currently closed. Please come again. Maybe...`,
          });
        }
      }

      try {
        await command.execute(interaction);
      }
      catch (error) {
        if (interaction.replied || interaction.deferred) {
          console.error(`[ERROR] This interaction has already been replied or deferred.`, error);
          await interaction.followUp({
            content: `There was a problem with your request.`,
          });
          return;
        }
        else {
          console.error(`[ERROR] There was an error with executing this command.`, error);
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
        console.warn(`[WARN] No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.autocomplete(interaction);
      }
      catch (error) {
        console.error(`[ERROR] There was an error with interaction autocompletion.`, error);
      }
    }
  },
};
