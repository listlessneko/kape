const { client } = require('../../client.js');
const { SlashCommandBuilder, ComponentType } = require('discord.js');
const { UserServices, UserItemsServices, KafeServices } = require('../../services/all-services.js');

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
        const selectedValue = i.values[0];
        const menu = client.menus.get(selectedValue);
        const itemCheck = await KafeServices.findItem(selectedValue);
        console.log(itemCheck);
        console.log(selectedValue);

        if (i.user.id === interaction.user.id) {
          if (selectedValue === 'nevermind') {
            await i.update({
              content: `Oh, maybe next time.`,
              components: []
            });
            return collector.stop('User canceled order.');
          }
          if (menu) {
            await i.update({
              content: menu.content,
              components: [menu.row]
            });
          }
          if (itemCheck) {
            const quantityMenu = client.menus.get('quantity-menu');
            console.log('Order Cmd - Item Check:', itemCheck);
            const prev_menu = itemCheck.type;
            console.log('Order Cmd - Prev Menu:', prev_menu);
            await i.update({
              components: [quantityMenu.row(prev_menu, 'Order', 5, itemCheck.value)]
            });
          }
          else if (!menu && !itemCheck) {
            const item = await KafeServices.findItem(selectedValue.slice(2));
            const quantity = Number(selectedValue.slice(0, 1));
            const totalCost = item.cost * quantity;
            const user = await UserServices.getUsers(interaction.user.id);

            if (totalCost <= user.balance) {
              await UserServices.subtractBalance(totalCost, user.user_id);
              await UserItemsServices.addItems(item, quantity, user.user_id);
              const content = quantity > 1 ? `Here are your **${quantity} ${item.name.toLowerCase()}** orders.` : `Here is your **${item.name.toLowerCase()}**.`;
              await i.update({
                content: content,
                components: [],
              });
              return collector.stop('Order completed.');
            }

            else if (totalCost > user.balance) {
              const content = quantity > 1 ? `Hm... You lack the sufficient credits to purchase these items. Maybe come back next time.` : `Hm... You lack the sufficient credits to purchase this item. Maybe come back next time.`;
              await i.update({
                content: content,
                components: [],
              });
              return collector.stop('Insufficient funds.');
            }
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
          console.log('Order Cmd:', reason);
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
