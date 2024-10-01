const path = require('node:path');
const { client } = require('../../client.js');
const { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { UserServices, UserItemsServices, KafeServices, MathServices } = require('../../services/all-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('drink')
    .setDescription('Consume a drink.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from cafe and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a drink from your inventory.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'order') {
      const subMenu = client.menus.get('drinks-sub-menu');
      const response = await interaction.reply({
        content: subMenu.content,
        components: [subMenu.row]
      });

      try {
        const collector = await response.createMessageComponentCollector({
          componenttype: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];
          const menu = client.menus.get(selectedValue)
          const itemCheck = await KafeServices.findItem(selectedValue);
          console.log('Drinks Cmd - Selected Value:', selectedValue);

          if (i.user.id === interaction.user.id) {
            if (menu) {
              await i.update({
                content: menu.content,
                components: [menu.row]
              });
            }

            else if (!menu) {
              if (selectedValue === 'nevermind') {
                await i.update({
                  content: `Oh, Maybe next time.`,
                  components: []
                });
                collector.stop('Drink Cmd: User canceled order.');
                return;
              }

              const user = await UserServices.getUsers(interaction.user.id);

              try {
                if (itemCheck) {
                  const quantityMenu = client.menus.get('quantity-menu');
                  const item = await KafeServices.findItem(selectedValue);
                  const prev_menu = item.type + '-sub-menu';
                  console.log('Drinks Cmd - Prev Menu:', prev_menu);
                  await i.update({
                    components: [quantityMenu.row(prev_menu, 'Order', 5, itemCheck.value)]
                  });
                }
                else if (!itemCheck) {
                  try {
                    const item = await KafeServices.findItem(selectedValue.slice(2));
                    console.log('Drinks Cmd - Item:', item);
                    const quantity = Number(selectedValue.slice(0, 1));
                    console.log('Drinks Cmd - Selected Value Quantity:', selectedValue.slice(0, 1));
                    console.log('Drinks Cmd - Quantity:', quantity);
                    const totalCost = item.cost * quantity;
                    if (totalCost <= user.balance) {
                      console.log('Drinks Cmd - Total Cost:', totalCost);
                      await UserServices.subtractBalance(totalCost, user.user_id);

                      let totalEnergy = 0;

                      if (item.energy_replen.min !== item.energy_replen.max) {
                        console.log('Drinks Cmd - Energy Diff');
                        let i = 0;
                        while (i < quantity) {
                          const interval = 5;
                          const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
                          totalEnergy += energyDiff.fate;
                          i++;
                          console.log('Drinks Cmd - Fate:', totalEnergy);
                        }
                      }
                      else {
                        totalEnergy = item.energy_replen.max * quantity;
                      }
                      if (totalEnergy <= 0) {
                        await UserServices.addEnergy(totalEnergy, user.user_id);
                        console.log('Drinks Cmd - Unfortunate:', totalEnergy);
                        const content = quantity > 1 ? `Here are your **${quantity} ${item.name.toLowerCase()}** orders. Please enjoy them.\n*You drink each of them one gulp after another. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You drink all of it in one gulp. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                        await i.update({
                          content: content,
                          components: []
                        });
                        return collector.stop('Drink consumed from cafe.');
                      }
                      else {
                        console.log('Drinks Cmd - Energy Same:', totalEnergy);
                        await UserServices.addEnergy(totalEnergy, user.user_id);
                        const content = quantity > 1 ? `Here are your **${quantity} ${item.name.toLowerCase()}** orders. Please enjoy them.\n*You drink each of them one gulp after another.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You drink all of it in one gulp.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                        await interaction.editReply({
                          content: content,
                          components: []
                        });
                        return collector.stop('Drink consumed from cafe.');
                      }
                    }
                    else {
                      const content = quantity > 1 ? `Hm... You lack the sufficient credits to purchase these items. Maybe come back next time.` : `Hm... You lack the sufficient credits to purchase this item. Maybe come back next time.`;
                      await interaction.editReply({
                        content: content,
                        components: []
                      });
                      return collector.stop('User is too poor.')
                    }
                  }
                  catch (e) {
                    return console.error('Drink Cmd: An unexpected error occurred in evaluating item cost and user balance:', e);
                  }
                }
              }
              catch (e) {
                return console.error('Drink Cmd: Not an item. error:', e);
              }
            }
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });
        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Drink Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          }
          return console.log('Drink Cmd:', reason);
        });
      }
      catch (e) {
        console.error('Drink Cmd: An unexpected error occurred:', e);
        return await i.update({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }

    else if (subcommand === 'inventory') {
      const inventoryMenu = client.menus.get('inventory-menu');
      const userItems = await UserItemsServices.getUserItems(interaction.user.id);
      //console.log('Drink Cmd - User Items:', userItems);
      const drinkItems = userItems.items.filter(item => item.kafeItem.category === 'drinks');
      //console.log('Drink Cmd - Drink Items:', drinkItems);
      if (drinkItems.length === 0) {
        return await interaction.reply({
          content: `*You ruffle through your bag and realize you don't have any drinks...*`
        });
      }

      const response = await interaction.reply({
        content: `*You ruffle through your bag. Hm...*`,
        components: [inventoryMenu.row(drinkItems)]
      });

      try {
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];
          const inventoryMenu = client.menus.get(selectedValue);
          const itemCheck = await UserItemsServices.findItem(selectedValue);
          console.log('Drink Inventory Cmd - Item Check:', itemCheck);


          if (i.user.id === interaction.user.id) {
            if (selectedValue === 'nevermind') {
              await i.update({
                content: `*You close your bag.*`,
                components: []
              });
              return collector.stop('User closed bag.')
            }

            if (inventoryMenu) {
              console.log('Drink Inventory Cmd - Selected Value Go Back:', selectedValue);
              await i.update({
                components: [inventoryMenu.row(drinkItems)]
              });
            }
            if (itemCheck) {
              console.log('Drink Inventory Cmd - Selected Value Item:', selectedValue);
              const quantityMenu = client.menus.get('quantity-menu');
              const prev_menu = 'inventory-menu';
              const quantity = itemCheck.quantity;
              console.log('Drink Inventory Cmd - Quantity:', quantity);
              await i.update({
                components: [quantityMenu.row(prev_menu, 'Drink', quantity, itemCheck.value)]
              });
            }
            else if (!inventoryMenu && !itemCheck) {
              console.log('Drink Inventory Cmd - Selected Value Quantity:', selectedValue);
              const user = interaction.user.id;
              console.log('Drink Inventory Cmd - Selected Value:', selectedValue);
              console.log('Drink Inventory Cmd - Selected Value Slice:', selectedValue.slice(2));
              const item = await KafeServices.findItem(selectedValue.slice(2));
              console.log('Drink Inventory Cmd - Item:', item);
              const quantity = Number(selectedValue.slice(0, 1));
              await UserItemsServices.removeItems(item, quantity, user);

              let totalEnergy = 0;

              if (item.energy_replen.min !== item.energy_replen.max) {
                console.log('Drink Cmd - Energy Diff');
                let i = 0;
                while (i < quantity) {
                  const interval = 5;
                  const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
                  totalEnergy = energyDiff.fate;
                  console.log('Drinks Cmd - Fate:', totalEnergy);
                }
              }
              else {
                totalEnergy = item.energy_replen.max * quantity;
              }
              if (totalEnergy <= 0) {
                console.log('Drink Cmd - Unfortunate:', totalEnergy);
                await UserServices.addEnergy(totalEnergy, user.user_id);
                const content = quantity > 1 ? `*You drink each of them one gulp after another. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `*You drink all of it in one gulp. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                await i.update({
                  content: content,
                  components: []
                });
                return collector.stop('Drink consumed from inventory.');
              }
              else {
                console.log('Drink Cmd - Energy Same:', totalEnergy);
                await UserServices.addEnergy(totalEnergy, user);
                const content = quantity > 1 ? `*You drink each of them one gulp after another.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `*You drink all of it in one gulp.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                await i.update({
                  content: content,
                  components: []
                });
                return collector.stop('Drink consumed from inventory.');
              }
            }
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Drink Cmd: time limit reached.');
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
        console.error('Drink Cmd: An unexpected error occurred:', e);
        return await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
  }
}
