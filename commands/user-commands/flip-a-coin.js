const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { UserServices } = require('../../services/user-services.js');
const { UserLevelsServices } = require('../../services/user-levels-services.js');
const { ScoresServices } = require('../../services/scores-services.js');

module.exports = {
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

    console.log('Flip A Coin Cmd: Fate Stay Night');

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000
      });


      if (confirmation.values[0] !== 'i-will-decide') {
        const fate = Math.random() < 0.49 ? 'heads' : Math.random() < 0.961 ? 'tails' : 'UR+';
        const properFate = fate.charAt(0).toUpperCase() + fate.slice(1);
        console.log('Flip A Coin Cmd: Fate Proper:', properFate);

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

        if (confirmation.values[0] === fate) {
          console.log('Flip A Coin Cmd: Selected Value:', confirmation.values[0]);
          const originalValue = Math.random() < 0.05 ? 1 : Math.random() < 0.25 ? .5 : .25;
          const value = originalValue < 1 ? originalValue * 100 : originalValue;
          console.log('Flip A Coin Cmd: Value:', originalValue);
          const coin = originalValue === 1 ? 'one_credit' : originalValue === .5 ? 'fifty_parts' : 'twenty_five_parts';
          await UserServices.addBalance(originalValue, confirmation.user.id);
          const units = originalValue < 1 ? 'parts' : 'credit';
          console.log('Flip A Coin Cmd: Units:', units);

          const result = {
            user_id: confirmation.user.id,
            side: confirmation.values[0],
            lucky: true,
            ultra_rare_plus: false,
            coin,
            value: originalValue
          }

          await ScoresServices.fateScoreTracking(result);

          await interaction.editReply({
            content: `**${properFate}!** It is your lucky day.\n\nYou receive **${value} ${units}**.`,
            components: []
          });
          return console.log(`${confirmation.user.id} was lucky.`)
        }
        else if (fate === 'UR+') {
          console.log('Flip A Coin Cmd: Fate:', fate);
          const value = 1;
          const exp = 500;
          await UserServices.addBalance(originalValue, confirmation.user.id);

          const result = {
            user_id: confirmation.user.id,
            side: confirmation.values[0],
            lucky: null,
            ultra_rare_plus: true,
            coin,
            value
          }

          await ScoresServices.fateScoreTracking(result);
          await UserLevelsServices.addExp(exp, confirmation.user.id);

          await interaction.editReply({
            content: `*The coin lands on its side and spins for what feels like forever before stopping still on its thin, outer ridges.*\n\n Huh... That rarely happens... Hold onto the coin. Maybe it is lucky one.\n\nGained **${value} credit**`,
            components: []
          });
          
          await wait(3_000);

          await interaction.followUp({
            content: `*After picking the coin off the barista's palm, you suddenly feel wiser as though you've gained insight into how this world works.*\n\nGained **${exp} experience**`,
            components: []
          })
          return console.log(`${confirmation.user.id} was ultra lucky.`)
        }
        else {
          console.log('Flip A Coin Cmd: Selected Value:', confirmation.values[0]);
          console.log('Flip A Coin Cmd: Fate:', fate);

          const result = {
            user_id: confirmation.user.id,
            side: confirmation.values[0],
            lucky: false,
            ultra_rare_plus: false,
            coin: null,
            value: null
          }

          await ScoresServices.fateScoreTracking(result);

          await interaction.editReply({
            content: `**${properFate}**. Better luck next time.`,
            components: []
          });
          return console.log(`${confirmation.user.id} was unlucky.`)
        }
      }
      else if (confirmation.values[0] === 'i-will-decide') {
        console.log('Flip A Coin Cmd: Selected Value:', confirmation.values[0]);
        return await interaction.editReply({
          content: `Not feeling lucky today? Maybe next time.\n\n*You decide to take fate into your own hands.*`,
          components: []
        });
      }
    }
    catch (e) {
      console.error('Flip A Coin Cmd: Error:', e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }

  }
}
