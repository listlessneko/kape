import { logger } from '../../logger.js';
import {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';
import { UserServices } from '../../services/user-services.js';
import { StatsServices } from '../../services/stats-services.js';
import { MathServices } from '../../services/math-services.js';
import { ErrorServices } from '../../services/error-services.js';

const commandName = 'UserCommand.FlipACoin';
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('flip-a-coin')
    .setDescription('Let fate decide.'),

  async execute(interaction) {
    const decide = new StringSelectMenuBuilder()
      .setCustomId('decide')
      .setPlaceholder('Choose wisely.')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Heads')
          .setValue('heads')
          .setDescription('Move forward?'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Tails')
          .setValue('tails')
          .setDescription('Or stay back?'),
        new StringSelectMenuOptionBuilder()
          .setLabel('I will decide.')
          .setValue('i-will-decide')
          .setDescription('Put the coin away.')
      );

    const row = new ActionRowBuilder().addComponents(decide);

    const response = await interaction.reply({
      content: `Let fate decide.`, 
      components: [row]
    });

    console.log(`[LOG] ${commandName}: Fate Stay Night`);

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000
      });

      const traveler = {
        id: confirmation.user.id
      };
      const travelerChoice = confirmation.values[0];
      const travelerWillDecide = travelerChoice === 'i-will-decide';
      const letFateDecide = travelerChoice !== 'i-will-decide';

      logger.log(`[LOG] ${commandName} Traveler's choice:`, travelerChoice);

      if (travelerWillDecide) {
        return await interaction.editReply({
          content: `Not feeling lucky today? Maybe next time.\n\n*You decide to take fate into your own hands.*`,
          components: []
        });
      } if (letFateDecide) {

        let guests = {};
        let bouncer = {};

        try {
          const fate = Math.random() < 0.49 ? 'heads' : Math.random() < 0.961 ? 'tails' : 'UR+';
          console.log(`[LOG] ${commandName} Fate:`, fate);

          const properFate = fate.charAt(0).toUpperCase() + fate.slice(1);

          const travelerWithFate = travelerChoice === fate;
          const blessedByFate = fate === 'UR+';
          const favoredByFate = travelerWithFate || blessedByFate;
          const unlucky = !favoredByFate;

          await interaction.editReply({
            content: `*Flip...*`,
            components: []
          });

          await wait(1_000);

          await interaction.editReply({
            content: `*Whoosh...*`,
            components: []
          });

          await wait(1_000);

          await interaction.editReply({
            content: `*Spin...*`,
            components: []
          });

          await wait(1_000);

          logger.log(`[LOG] ${commandName} travelerWithFate:`, travelerWithFate);
          logger.log(`[LOG] ${commandName} blessedByFate:`, blessedByFate);
          logger.log(`[LOG] ${commandName} favoredByFate:`, favoredByFate);

          if (favoredByFate) {
            logger.log(`[LOG] ${commandName} ${traveler.id} was favored by fate.`);

            const coins = {
              twenty_five_parts: {
                name: 'twenty_five_parts',
                value: .25,
              },
              fifty_parts: {
                name: 'fify_parts',
                value: .50,
              },
              one_credit: {
                name: 'one_credit',
                value: 1,
              },
            };

            if (travelerWithFate) {
              logger.log(`[LOG] ${commandName} ${traveler.id} was lucky.`);

              const coin = Math.random() < 0.75 ? coins.twenty_five_parts : Math.random() < .98 ? coins.fifty_parts : coins.one_credit;
              const fortune = MathServices.displayCurrency(coin.value);

              guests = {
                UserBalance: traveler.id,
                JankenStats: traveler.id,
              };
              bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

              await UserServices.addBalance(traveler.id, coin.value, bouncer);

              const fateByFate = {
                side: travelerChoice,
                lucky: true,
                ultra_rare_plus: false,
                coin: coin.name,
              }

              await StatsServices.calculateFateStats(traveler, fateByFate, bouncer);

              await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

              return await interaction.editReply({
                content: `**${properFate}!** It is your lucky day.\n\n-# **+${fortune.amount} ${fortune.units}**.`,
                components: []
              });
            } if (blessedByFate) {
              logger.log(`[LOG] ${commandName}: ${traveler.id} was ultra lucky.`);
              const coin = {
                name: 'one_credit',
                value: 1,
              }
              const fortune = MathServices.displayCurrency(coin.value);
              const exp = 500;

              guests = {
                UserBalance: traveler.id,
                JankenStats: traveler.id,
                UserLevel: traveler.id
              };
              bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

              await UserServices.addBalance(traveler.id, coin.value, bouncer);

              const fateByFate = {
                side: travelerChoice,
                lucky: null,
                ultra_rare_plus: true,
                coin: coin.name,
              }

              await StatsServices.calculateFateStats(traveler, fateByFate, bouncer);
              const { userLevel, levelUp } = await UserServices.addExp(traveler.id, exp, bouncer);

              await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

              await interaction.editReply({
                content: `*The coin lands on its side and spins for what feels like forever before stopping still on its thin, outer ridges.*\n\n Huh... That rarely happens... Hold onto the coin. Maybe it is lucky one.\n\n-# **+${fortune.amount} ${fortune.units}**\n-# **+${exp} experience**`,
                components: []
              });

              if (levelUp) {
                await wait(3_000);
                return await interaction.followUp({
                  content: `*After picking the coin off the barista's palm, you suddenly feel wiser as though you've gained insight into how this world works.*\n\nLeveled up from Level ${userLevel.level - 1} to **Level ${userLevel.level}**!`,
                  components: []
                });
              } else {
                return;
              }
            }
          } if (unlucky) {
            logger.log(`[LOG] ${commandName} ${traveler.id} was unlucky.`);

            guests = {
              UserBalance: traveler.id,
              JankenStats: traveler.id,
            };
            bouncer = await ErrorServices.startAdvancedSquealOperations(commandName, guests);

            const fateByFate = {
              side: travelerChoice,
              lucky: false,
              ultra_rare_plus: false,
              coin: null,
            }

            await StatsServices.calculateFateStats(traveler, fateByFate, bouncer);

            await ErrorServices.endAdvancedSquealOperations(commandName, bouncer);

            return await interaction.editReply({
              content: `**${properFate}**. Better luck next time.`,
              components: []
            });
          }
          return logger.log(`[LOG] ${commandName}: Error?`);
        } catch (e) {
          ErrorServices.handleError(commandName, e);
          if (!bouncer.transaction.finished) {
            await ErrorServices.handleAdvancedDataRollback(commandName, guests, bouncer);
          }
          return await interaction.editReply({
            content: `Looks like fate is indecisive right now. Try again later.`,
            component: []
          });
        }
      }
    } catch (e) {
      if (e.message === 'reason: time') {
        logger.error(`[ERROR] ${commandName} The traveler was indecisive.`);
        return await interaction.editReply({
          content: `Indecisive?`
        });
      }
      ErrorServices.handleError(commandName, e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
