const path = require('node:path');
const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { MathServices } = require('../../services/math-services');
const { UserServices } = require(('../../services/user-services.js'));
const { ScoresServices } = require('../../services/scores-services.js');
const { UserLevelsServices } = require('../../services/user-levels-services');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rock-paper-scissors')
    .setDescription('Play rock paper scissors with the barista.'),

  async execute(interaction) {
    const userEnergy = await UserServices.getUsers(interaction.user.id);

    if (userEnergy.energy < 5) {
      await interaction.reply({
        content: `Uh... You look tired. Get some rest and we can play again later.`,
        components: []
      });
      return console.log('Rock Paper Scissors Cmd: User is too tired.');
    }

    const baristaWeapons = ['rock', 'paper', 'scissors'];

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

    const response = await interaction.reply({
      content: `Saishouwa guu...`,
      components: [row]
    });

    try {
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000
      });

      collector.on('collect', async i => {
        const selectedValue = i.values[0];
        console.log(`Item:`, selectedValue);
        const baristaWeapon = baristaWeapons[Math.floor(Math.random() * baristaWeapons.length)];
        console.log(`Barista Weapon:`, baristaWeapon);

        if (i.user.id !== interaction.user.id) {
          await i.editReply({
            content: `Please wait your turn.`,
            ephemeral: true
          });
        }

        if (selectedValue === 'retreat') {
          await interaction.editReply({
            content: `Scared? Come back after you have trained more.`,
            components: []
          });
          return collector.stop('Rock Paper Scissors Cmd: User has retreated.');
        }

        if (selectedValue !== 'retreat') {
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

          if (selectedValue === baristaWeapon) {
            const energy_consumed = 5;
            const rewards = {
              credits: 0,
              exp: 10
            };

            await UserServices.removeEnergy(energy_consumed, interaction.user.id);

            const result = {
              user_id: interaction.user.id,
              victory: false,
              defeat: false,
              draw: true,
              weapon: selectedValue,
              energy_consumed,
              rewards
            };

            await ScoresServices.rpsVsKapé(result);
            await UserLevelsServices.addExp(result.rewards.exp, result.user_id);

            await interaction.editReply({
              content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[baristaWeapon]['weapon_icon']} (Kapé)\n*That was stale, mate.*\n\nLost **${energy_consumed} energy**\nGained **${rewards.exp} experience**`,
              components: []
            });
            return collector.stop('Rock Paper Scissors Cmd: A draw.');
          }

          const userWon = selectedValue === outcomes[baristaWeapon]['loses_to'];
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
              user_id: interaction.user.id,
              victory: true,
              defeat: false,
              draw: false,
              weapon: selectedValue,
              energy_consumed,
              rewards
            };

            await ScoresServices.rpsVsKapé(result);
            await UserLevelsServices.addExp(result.rewards.exp, result.user_id);

            await interaction.editReply({
              content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[baristaWeapon]['weapon_icon']} (Kapé)\n*Huh, you won.*\n\nLost **${energy_consumed} energy**\nGained **${rewards.exp} experience**\nReceived **${rewards.credits} credits**`,
              components: []
            });
            return collector.stop('Rock Paper Scissors Cmd: Fight ended. User victory.');
          }

          else {
            const energy_consumed = 5;
            const rewards = {
              credits: 0,
              exp: 0
            };

            await UserServices.removeEnergy(energy_consumed, interaction.user.id);

            const result = {
              user_id: interaction.user.id,
              victory: false,
              defeat: true,
              draw: false,
              weapon: selectedValue,
              energy_consumed,
              rewards
            };

            await ScoresServices.rpsVsKapé(result);

            await interaction.editReply({
              content: `Jan... ken... pon!\n\n(You) ${outcomes[selectedValue]['weapon_icon']} vs. ${outcomes[baristaWeapon]['weapon_icon']} (Kapé)\n*Defeat. ${outcomes[selectedValue]['losing_message']}*\n\nLost **${energy_consumed} energy**`,
              components: []
            });
            return collector.stop('Rock Paper Scissors Cmd: Fight ended. User defeated.')
          }
      }
    });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          console.log('Rock Paper Scissors Cmd: time limit reached.');
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
      console.error('Rock Paper Scissors Cmd: An unexpected error occurred:', e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
