const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
//const { Users, KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('Buy an item from the cafe.'),

  async execute(interaction) {
    const mainMenu = client.menus.get('main-menu');
    const response = await interaction.reply({
      content: mainMenu.content,
      components: [mainMenu.row]
    });

    try {
      const collector = await response.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect, 
        time: 60_000 
      });

      collector.on('collect', async i => {
        const menu = client.menus.get(i.values[0]);
        const selectedValue = i.values[0];
        console.log(i.values[0]);

        if (i.user.id === interaction.user.id) {
          if (!menu) {
            if (selectedValue === 'nevermind') {
              console.log('test');
              await i.update({
                content: `Oh, maybe next time.`,
                components: []
              });
              collector.stop('Order Cmd: User canceled order.');
              return;
            }

            const item = await KafeServices.findItem(selectedValue);

            const user = await UserServices.getUsers(interaction.user.id);

            if (item) {
              if (item.cost <= user.balance) {
                await UserServices.subtractBalance(item.cost, user.user_id);
                await UserItemsServices.addItems(item, 1, user.user_id);
                await i.update({
                  content: `Here is your **${item.name.toLowerCase()}**.`,
                  components: [],
                });
                collector.stop('Order Cmd: Order completed.')
                return;
              }

              else if (item.cost > user.balance) {
                await i.update({
                  content: `Hm... You lack enough credits. Maybe come back next time.`,
                  components: [],
                });
                collector.stop('Order Cmd: Insufficient funds.')
                return;
              }
            }
          }

          else if (menu) {
            await i.update({
              content: menu.content,
              components: [menu.row]
            });
          }
        }

        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: `Please wait your turn.`,
            ephemeral: true
          });
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          console.log('Time limit reached.')
          interaction.editReply({ 
            content: `Hm... Take your time then.`, 
            components: [] 
          });
        }
        else {
          console.log(reason);
        }
      });
    }
    catch (e) {
      console.error('An unexpected error occurred:', e);
      await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  },
}
