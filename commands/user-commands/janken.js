import { logger } from '../../logger.js';
import { 
  SlashCommandBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from 'discord.js';
import {
  MathServices,
  UserServices,
  StatsServices,
  JsonSearchServices,
  CacheServices,
  FormatServices,
  ErrorServices,
} from '../../services/all-services.js';
import { setTimeout as wait } from 'node:timers/promises';
import { NotFoundError } from '../../errors/not-found-error.js';
import npcJanken from '../../data/npc-janken.json' assert { type: 'json' }
import { InsufficientResourcesError } from '../../errors/insufficient-resources-error.js';

const commandName = 'UserCommand.Janken';
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('janken')
    .setDescription('Play rock paper scissors with the kapé or npcs.')
    .addStringOption(option =>
      option
      .setName('npc')
      .setDescription('Input npc name to figh–... to play with.')
    ),

  async execute(interaction) {
    try {
      const fighter = {
        id: interaction.user.id
      }
      const fighterStatus = await UserServices.getEnergy(fighter.id);

      if (fighterStatus.energy < 5) {
        logger.log(`[LOG] ${commandName}: User ${fighterStatus.id} is too tired.`);
        return await interaction.reply({
          content: `Uh... You look tired. Get some rest and we can play again later.`,
          components: []
        });
      }

      const npcInteractionString = interaction.options.getString('npc');
      logger.debug(`[DEBUG] ${commandName} npcInteractionString:`, npcInteractionString);

      const selectedNpc = npcInteractionString ? npcInteractionString.toLowerCase() : 'kapé';
      logger.debug(`[DEBUG] ${commandName} selectedNpc:`, selectedNpc);

      let opponent;

      const npcExists = await JsonSearchServices.findNpcJanken(selectedNpc);
      if (!npcExists.success) {
        logger.log(`[LOG] ${commandName}: '${npcInteractionString}' does not exists.`);
        return await interaction.reply({
          content: `"${npcInteractionString}" does not exists. Are you remembering ghosts?`
        });
      } else {
        opponent = npcExists.found;
      }

      logger.log(`[LOG] ${commandName} opponent:`, opponent);

      const vsNotKapé = opponent.name !== 'kapé';

      let composite = {
        theKey: FormatServices.generateCompositeKey(fighter.id, opponent.id),
        targetModel: 'UserNpcRelationship',
        key1: {
          id: fighter.id,
          idName: 'user_id'
        },
        key2: {
          id: opponent.id,
          idName: 'npc_id'
        }
      }

      if (vsNotKapé) {
        logger.log(`[LOG] ${commandName} Figher ${fighter.id} challenges ${opponent.name}.`);
        const xUserNpc = await CacheServices.getOrSetCompositeCacheEntry(composite);
        logger.debug(`[TEST] ${commandName} xUserNpc:`, xUserNpc);
        const strangers = xUserNpc.relationship_level === 'stranger';
        logger.debug(`[TEST] ${commandName} strangers:`, strangers);

        if (strangers) {
          logger.log(`[LOG] ${commandName}: ${fighter.id} is not close enough to '${opponent.name}'.`)
          return await interaction.reply({
            content: `It seems you and the **${opponent.descriptive_name}** are not close enough to figh–... play games.`,
            components: []
          });
        }
      } else {
        logger.log(`[LOG] ${commandName} Figher ${fighter.id} challenges the bot, ${opponent.name}.`);
      }

      const userWeapons = new StringSelectMenuBuilder()
        .setCustomId('weapons')
        .setPlaceholder('Select your weapon.')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Rock')
            .setValue('rock')
            .setDescription('A solid choice.'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Paper')
            .setValue('paper')
            .setDescription('Do not fold easily.'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Scissors')
            .setValue('scissors')
            .setDescription('Cut your way to victory.'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Retreat')
            .setValue('retreat')
            .setDescription('Avoid risks.'),
        )

      const row = new ActionRowBuilder().addComponents(userWeapons);

      await interaction.reply({
        content: `Sai...`,
        components: []
      });
      await wait(1_000);

      await interaction.editReply({
        content: `Sai... shouwa...`,
        components: []
      });
      await wait(1_000);

      const response = await interaction.editReply({
        content: `Saishouwa guu...`,
        components: [row]
      });

      const collectorFilter = i => i.user.id === interaction.user.id;

      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000
      });

      const fighterWeapon = confirmation.values[0];
      const retreat = fighterWeapon === 'retreat';

      if (retreat) {
        logger.log(`[LOG] ${commandName}: The "Fighter" has retreated.`);
        return await interaction.editReply({
          content: `Scared? Come back after you have trained more.`,
          components: []
        });
      }

      const selectedWeapon = {
        rock: {
          weapon_icon: ':rock:',
          wins_against: 'scissors',
          wins_against_icon: ':scissors:',
          loses_against: 'paper',
          loses_against_icon: ':scroll:',
          losing_message: 'Busy being wrapped by your thoughts?'
        },
        paper: {
          weapon_icon: ':scroll:',
          wins_against: 'rock',
          wins_against_icon: ':rock:',
          loses_against: 'scissors',
          loses_against_icon: ':scissors:',
          losing_message: 'You should just cut your losses.'
        },
        scissors: {
          weapon_icon: ':scissors:',
          wins_against: 'paper',
          wins_against_icon: ':scroll:',
          loses_against: 'rock',
          loses_against_icon: ':rock:',
          losing_message: 'You got pummeled.'
        }
      };

      const opponentJanken = MathServices.getWeightedSelection(opponent.janken.weapons);
      const opponentWeapon = opponentJanken.choice;

      const fighterWon = fighterWeapon === selectedWeapon[opponentWeapon]['loses_against'];
      const draw = fighterWeapon === opponentWeapon;
      const fighterLost = fighterWeapon === selectedWeapon[opponentWeapon]['wins_against'];

      let fighterLevelUp = false;

      const energyConsumed = 5;

      const results = {
        victory: false,
        defeat: false,
        draw: false,
        weapon: fighterWeapon,
        energy_consumed: energyConsumed,
        rewards: {},
      };

      let guests = {
        'UserNpcJankenStats': [fighter.id, opponent.id],
        'UserEnergy': fighter.id
      };
      let bouncer = {};

      try {
        if (fighterWon) {
          logger.log(`[LOG] ${commandName}: Fighter victorious.`);

          const thresholds = [.001, .25, .50, 1];
          const chance = Math.random();
          const selection = thresholds.findIndex(threshold => chance < threshold);

          const expChances = [100, 50, 25, 10];
          const exp = expChances[selection];

          const creditsChances = [25, 10, 5, 2.5];
          const credits = creditsChances[selection];

          results.victory = true;
          results.rewards = {
            exp,
            credits,
          };

          guests['UserBalance'] = fighter.id
          guests['UserLevel'] = fighter.id
          logger.debug(`[TEST] ${commandName} guests:`, guests);

          bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

          await StatsServices.calculateJankenStats(composite, results, bouncer);
          await UserServices.removeEnergy(fighter.id, energyConsumed, bouncer);
          await UserServices.addBalance(fighter.id, results.rewards.credits, bouncer);
          const { userLevel, levelUp } = await UserServices.addExp(fighter.id, results.rewards.exp, bouncer);
          fighter.level = userLevel.level;
          fighterLevelUp = levelUp;

          await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

          await interaction.editReply({
            content: `Jan... ken... pon!\n\n(You) ${selectedWeapon[fighterWeapon]['weapon_icon']} vs. ${selectedWeapon[opponentWeapon]['weapon_icon']} (${opponent.proper_name})\n*Huh, you won.*\n\n-# **-${energyConsumed} energy**\n-# **+${results.rewards.exp} experience**\n-# **+${results.rewards.credits} credits**`,
            components: []
          });
        } if (draw) {
          logger.log(`[LOG] ${commandName}: A stale fight.`);
          const thresholds = [.50, 1];
          const chance = Math.random();
          const selection = thresholds.findIndex(threshold => chance < threshold);

          const expChances = [10, 5];
          const exp = expChances[selection];

          const creditsChances = [1, 0];
          const credits = creditsChances[selection];

          results.draw = true;
          results.rewards = {
            exp,
            credits,
          }

          guests['UserLevel'] = fighter.id;
          if (credits) guests['UserBalance'] = fighter.id;
          logger.debug(`[TEST] ${commandName} guests:`, guests);

          bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

          await StatsServices.calculateJankenStats(composite, results, bouncer);
          await UserServices.removeEnergy(fighter.id, energyConsumed, bouncer);
          if (credits) await UserServices.addBalance(fighter.id, results.rewards.credits, bouncer);
          const { userLevel, levelUp } = await UserServices.addExp(fighter.id, results.rewards.exp, bouncer);
          fighter.level = userLevel.level;
          fighterLevelUp = levelUp;

          await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

          const greens = credits ? '\n-# **+1 credit**' : '';

          await interaction.editReply({
            content: `Jan... ken... pon!\n\n(You) ${selectedWeapon[fighterWeapon]['weapon_icon']} vs. ${selectedWeapon[opponentWeapon]['weapon_icon']} (${opponent.proper_name})\n*That was stale, mate.*\n\n-# **-${energyConsumed} energy**\n-# **+${results.rewards.exp} experience**${greens}`,
            components: []
          });
        } if (fighterLost) {
          logger.log(`[LOG] ${commandName}: Fighter defeated.`);
          const exp = Math.random() < .50 ? 5 : 0;
          const credits = 0;

          results.defeat = true;
          results.rewards = {
            exp,
            credits,
          }

          if (exp) guests['UserLevel'] = fighter.id;
          logger.debug(`[TEST] ${commandName} guests:`, guests);

          bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

          await StatsServices.calculateJankenStats(composite, results, bouncer);
          await UserServices.removeEnergy(fighter.id, energyConsumed, bouncer);
          if (exp) {
            const {userLevel, levelUp } = await UserServices.addExp(fighter.id, results.rewards.exp, bouncer);
            fighter.level = userLevel.level;
            fighterLevelUp = levelUp;
          };

          const wisdom = exp ? '\n-# **+5 experience**' : '';

          await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

          await interaction.editReply({
            content: `Jan... ken... pon!\n\n(You) ${selectedWeapon[fighterWeapon]['weapon_icon']} vs. ${selectedWeapon[opponentWeapon]['weapon_icon']} (${opponent.proper_name})\n*Defeat. ${selectedWeapon[fighterWeapon]['losing_message']}*\n\n-# **-${energyConsumed} energy**${wisdom}`,
            components: []
          });
        } if (fighterLevelUp) {
          await wait(1_000);
          return await interaction.followUp({
            content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${fighter.level - 1} to **Level ${fighter.level}!**`
          });
        }
        return logger.log(`[LOG] ${commandName}: Fight ended. Results calculated.`);
      } catch (e) {
        ErrorServices.handleError(commandName, e);
        if (!bouncer.transaction.finished) {
          await ErrorServices.handleAdvancedDataRollback(commandName, guests, bouncer);
        }
        return await interaction.editReply({
          content: `There seems to have been a weapon malfunction. Please try again later.`,
          components: []
        });
      }
    } catch (e) {
      console.error(e);
      ErrorServices.handleError(commandName, e);
      if (e instanceof InsufficientResourcesError) {
        return await interaction.reply({
          content: `"${opponentInteractionString}" does not exist. Are you remembering ghosts?`,
          components: []
        });
      } if (e.reason === 'time') {
        logger.error(`[ERROR] ${commandName} The fighter was distracted.`);
        return await interaction.editReply({
          content: `Distracted? Give it some more thought.`,
          components: []
        });
      }
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
