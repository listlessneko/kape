const path = require('node:path');
const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { 
  MathServices,
  UserServices,
  ScoresServices,
  UserLevelsServices,
  NpcServices,
  CustomerServices,
  UserCustomerStatsServices
} = require('../../services/all-services.js');
const { Customers } = require('../../data/db-objects.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('janken')
    .setDescription('Play rock paper scissors with the kapé or npcs.')
    .addStringOption(option =>
      option
      .setName('npc')
      .setDescription('Input npc name to figh– play with.')
    ),

  async execute(interaction) {
    try {
      const userStatus = await UserServices.getUsers(interaction.user.id);

      if (userStatus.energy < 5) {
        await interaction.reply({
          content: `Uh... You look tired. Get some rest and we can play again later.`,
          components: []
        });
        return console.log('Rock Paper Scissors Cmd: User is too tired.');
      }

      const opponentInteractionString = interaction.options.getString('npc');
      console.log('Janken Opponent Input:', opponentInteractionString);
      const opponent = opponentInteractionString ? opponentInteractionString.toLowerCase() : 'kapé';
      console.log('Janken Opponent:', opponent);
      const npc = await NpcServices.findNpc(opponent);
      console.log('Janken Npc:', npc);


      if (opponent !== 'kapé') {
        console.log('Janken Opponent Input Boolean:', opponent !== 'kapé');
        if (!npc) {
          await interaction.reply({
            content: `"${opponentInteractionString}" does not exist. Are you remembering ghosts?`,
            components: []
          });
          return console.log(`Janken Cmd: ${interaction.user.id} inputted invalid customer: '${opponentInteractionString}'.`)
        }

        const keys = {
          key1: {
            id: interaction.user.id,
            name: 'user_id'
          },
          key2: {
            id: npc.npc_id,
            name: 'npc_id'
          }
        }

        console.log('Janken - Keys:', keys);

        const customer = await CustomerServices.findCustomer(opponent);
        console.log('Janken Customer:', customer);
        const customerKeys = {
          id: customer.customer_id,
          name: 'customer_id'
        }

        console.log('Janken CustomerKeys:', customerKeys);

        const userCustomer = await UserCustomerStatsServices.getUsersCustomerStats(keys.key1, customerKeys)

        if (userCustomer.relationship_level === 'stranger') {
          await interaction.reply({
            content: `It seems you and the **${customer.descriptive_name}** are not close enough to play games.`,
            components: []
          });
          return console.log(`Janken Cmd: ${interaction.user.id} is not close enough to '${customer.name}'.`)
        }
      }

      const keys = {
        key1: {
          id: interaction.user.id,
          name: 'user_id'
        },
        key2: {
          id: npc.npc_id,
          name: 'npc_id'
        }
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


      try {
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {

          if (i.user.id !== interaction.user.id) {
            await i.editReply({
              content: `Please wait your turn.`,
              ephemeral: true
            });
          }

          if (i.user.id === interaction.user.id) {
            const selectedValue = i.values[0];
            console.log(`Item:`, selectedValue);

            if (selectedValue === 'retreat') {
              await interaction.editReply({
                content: `Scared? Come back after you have trained more.`,
                components: []
              });
              return collector.stop('Janken Cmd: User has retreated.');
            }

            const opponentJanken = MathServices.getWeightedSelection(npc.janken.weapons);
            console.log(`Janken Opponent Janken:`, opponentJanken);
            const opponentWeapon = opponentJanken.choice;
            console.log(`Janken Opponent Weapon:`, opponentWeapon);

            await interaction.editReply({
              content: `Jan...`,
              components: []
            });
            await wait(1_000);

            await interaction.editReply({
              content: `Jan... ken...`,
              components: []
            });
            await wait(1_000);

            const outcomes = {
              rock: {
                weapon_icon: ':rock:',
                loses_to: 'paper',
                loses_to_icon: ':scroll:',
                losing_message: 'Busy being wrapped by your thoughts?'
              },
              paper: {
                weapon_icon: ':scroll:',
                loses_to: 'scissors',
                loses_to_icon: ':scissors:',
                losing_message: 'You should just cut your losses.'
              },
              scissors: {
                weapon_icon: ':scissors:',
                loses_to: 'rock',
                loses_to_icon: ':rock:',
                losing_message: 'You got pummeled.'
              }
            };

            if (selectedValue === opponentWeapon) {
              const energy_consumed = 5;
              const rewards = {
                credits: 0,
                exp: 10
              };

              await UserServices.removeEnergy(energy_consumed, interaction.user.id);

              const result = {
                ...keys,
                victory: false,
                defeat: false,
                draw: true,
                weapon: selectedValue,
                energy_consumed,
                rewards
              };

              console.log('Janken - Results:', result);

              await ScoresServices.calculateJankenResults(result);
              const user = await UserLevelsServices.addExp(result.rewards.exp, result.key1.id);

              await interaction.editReply({
                content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[opponentWeapon]['weapon_icon']} (${npc.proper_name})\n*That was stale, mate.*\n\nLost **${energy_consumed} energy**\nGained **${rewards.exp} experience**`,
                components: []
              });

              if (user.level_up) {
                await wait(1_000);
                await interaction.followUp({
                  content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${user.prev_level} to **Level ${user.level}**`
                });
              }
              return collector.stop('Janken Cmd - A draw.');
            }

            const userWon = selectedValue === outcomes[opponentWeapon]['loses_to'];
            console.log('User Won:', userWon);

            if (userWon) {
              const energy_consumed = 5;
              const rewards = {
                credits: 2.5,
                exp: 25
              };

              await UserServices.removeEnergy(energy_consumed, interaction.user.id);
              await UserServices.addBalance(rewards.credits, interaction.user.id);

              const result = {
                ...keys,
                victory: true,
                defeat: false,
                draw: false,
                weapon: selectedValue,
                energy_consumed,
                rewards
              };

              console.log('Janken Cmd - Results:', result);

              await ScoresServices.calculateJankenResults(result);
              const user = await UserLevelsServices.addExp(result.rewards.exp, result.key1.id);

              await interaction.editReply({
                content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[opponentWeapon]['weapon_icon']} (${npc.proper_name})\n*Huh, you won.*\n\nLost **${energy_consumed} energy**\nGained **${rewards.exp} experience**\nReceived **${rewards.credits} credits**`,
                components: []
              });

              if (user.level_up) {
                await wait(1_000);
                await interaction.followUp({
                  content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${user.prev_level} to **Level ${user.level}**`
                });
              }
              return collector.stop('Janken Cmd - Fight ended. User victory.');
            }

            else {
              const energy_consumed = 5;
              const rewards = {
                credits: 0,
                exp: 0
              };

              await UserServices.removeEnergy(energy_consumed, interaction.user.id);

              const result = {
                ...keys,
                victory: false,
                defeat: true,
                draw: false,
                weapon: selectedValue,
                energy_consumed,
                rewards
              };

              console.log('Janken Cmd - Results:', result);

              await ScoresServices.calculateJankenResults(result);

              await interaction.editReply({
                content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[opponentWeapon]['weapon_icon']} (${npc.proper_name})\n*Defeat. ${outcomes[selectedValue]['losing_message']}*\n\nLost **${energy_consumed} energy**`,
                components: []
              });
              return collector.stop('Janken Cmd - Fight ended. User defeated.')
            }
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Janken Cmd - time limit reached.');
            return interaction.editReply({
              content: `Distracted? Give it some more thought.`,
              components: []
            });
          }
          else {
            return console.log(reason);
          }
        });
      }
      catch (e) {
        console.error('Janken Cmd - An unexpected error occurred:', e);
        return await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
    catch (e) {
      console.error('Janken Cmd - An unexpected error occurred:', e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
