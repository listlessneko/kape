import { logger } from '../../logger.js';
import { client } from '../../client.js';
import { BaseInteraction, ComponentType, SlashCommandBuilder } from 'discord.js';
import { MutexServices, InventoryServices, JsonSearchServices, CacheServices, FormatServices } from '../../services/all-services.js';
import * as Models from '../../models/models-barrel.js';
import kafeItems from '../../data/kafe-items.json' assert { type: 'json' }
import { BaristaServices } from '../../services/barista-services.js';
import drink from '../user-commands/drink.js';
import { CustomerServices } from '../../services/customer-services.js';

export default {
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('ping-2')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    const commandName = 'Ping 2 Cmd';
    const subcommandName = 'Ping 2 Cmd';

    try {

      const customerOrder = {
        stranger: 'stranger',
        acquaintance: 'acquaintance'
      };

      const relationshipStatus = {
        stranger: 'stranger',
        acquaintance: 'acquaintance'
      }

      console.log(`[TEST] ${subcommandName}:`, customerOrder[`${relationshipStatus.stranger}`]);

      return await interaction.reply({
        content: 'Nothing to see here. Move along.'
      });

    } catch (e) {
      console.error('Ping Error:', e);
    }
  }
}
