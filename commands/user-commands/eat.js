const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { UserServices, UserItemsServices, KafeServices, MathServices } = require('../../services/all-services.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('eat')
    .setDescription('Consume a food.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from cafe and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a food from your inventory.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'order') {
      const subMenu = client.menus.get('food-sub-menu');
      const response = await interaction.reply({
        content: subMenu.content,
        components: [subMenu.row]
      });

      try {
        const collector = await response.createMessageComponentCollector({
          ComponentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];
          const menu = client.menus.get(selectedValue)
          const itemCheck = await KafeServices.findItem(selectedValue);

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
                  content: `Oh, maybe next time.`,
                  components: []
                });
                return collector.stop('Eat Cmd: User canceled order.');
              }

              const user = await UserServices.getUsers(interaction.user.id);

              try {
                if (itemCheck) {
                  const quantityMenu = client.menus.get('quantity-menu');
                  const item = await KafeServices.findItem(selectedValue);
                  const prev_menu = item.type + '-sub-menu';
                  console.log('Eat Cmd - Prev Menu:', prev_menu);
                  await i.update({
                    components: [quantityMenu.row(prev_menu, 'Order', 5, item.value)]
                  });
                }
                else if (!itemCheck) {
                  try {
                    const item = await KafeServices.findItem(selectedValue.slice(2));
                    const quantity = Number(selectedValue.slice(0, 1));
                    const totalCost = item.cost * quantity;
                    if (totalCost <= user.balance) {
                      await UserServices.subtractBalance(totalCost, user.user_id);

                      let totalEnergy = 0;

                      if (item.energy_replen.min !== item.energy_replen.max) {
                        console.log('Eat Cmd - Energy Diff');
                        let i = 0;
                        while (i < quantity) {
                          const interval = 5;
                          const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
                          totalEnergy += energyDiff.fate;
                          i++;
                          console.log('Eat Cmd - Fate:', totalEnergy);
                        }
                      }
                      else {
                        totalEnergy = item.energy_replen.max * quantity;
                      }
                      if (totalEnergy <= 0) {
                        await UserServices.addEnergy(totalEnergy, user.user_id);
                        const content = quantity > 1 ? `Here are your **${quantity} ${item.name.toLowerCase()}** orders. Please enjoy them.\n\n*You inhale each of them one after the other. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n\n*You eat the entire thing in one bite. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                        await interaction.editReply({
                          content: content,
                          components: []
                        });
                        return collector.stop('Food unfortunatey consumed from cafe.');
                      }
                      else {
                        await UserServices.addEnergy(totalEnergy, user.user_id);
                        const content = quantity > 1 ? `Here are your **${quantity} ${item.name.toLowerCase()}** orders. Please enjoy them.\n*You inhale each of them one after the other.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You eat the entire thing in one bite.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                        await interaction.editReply({
                          content: content,
                          components: []
                        });
                        return collector.stop('Food consumed from cafe.');
                      }
                    }
                    else if (totalCost > user.balance) {
                      const content = quantity > 1 ? `Hm... You lack the sufficient credits to purchase these items. Maybe come back next time.` : `Hm... You lack the sufficient credits to purchase this item. Maybe come back next time.`;
                      await interaction.editReply({
                        content: content,
                        components: []
                      });
                      return collector.stop('User canceled order.');
                    }
                  }
                  catch (e) {
                    console.error('Eat Cmd: An unexpected error occurred in evaluating item cost and user balance:', e);
                  }
                }
              }
              catch (e) {
                console.error('Eat Cmd: Not an item. Error:', e);
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
            console.log('Eat Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          }
          return console.log('Eat Cmd:', reason);
        });
      }
      catch (e) {
        console.error('Eat Cmd: An unexpected error occurred:', e);
        return await i.update({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }

    else if (subcommand === 'inventory') {
      const inventoryMenu = client.menus.get('inventory-menu');
      const userItems = await UserItemsServices.getUserItems(interaction.user.id);
      //console.log('Eat Cmd - User Items:', userItems);
      const foodItems = userItems.items.filter(item => item.kafeItem.category === 'food');
      //console.log('Eat Cmd - Eat Items:', drinkItems);
      if (foodItems.length === 0) {
        return await interaction.reply({
          content: `*You ruffle through your bag and realize you don't have any food...*`
        });
      }

      const response = await interaction.reply({
        content: `*Hm...*`,
        components: [inventoryMenu.row(foodItems)]
      });

      try {
        const collector = response.createMessageComponentCollector({
          ComponentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];
          const inventoryMenu = client.menus.get(selectedValue);
          const itemCheck = await UserItemsServices.findItem(selectedValue);
          console.log('Eat Inventory Cmd - Item Check:', itemCheck);

          if (i.user.id === interaction.user.id) {
            if (selectedValue === 'nevermind') {
              await i.update({
                content: `*You close your bag.*`,
                components: []
              });
              return collector.stop('User closed bag.')
            }

            if (inventoryMenu) {
              console.log('Eat Inventory Cmd - Selected Value Go Back:', selectedValue);
              await i.update({
                components: [inventoryMenu.row(foodItems)]
              });
            }

            if (itemCheck) {
              console.log('Eat Inventory Cmd - Selected Value Item:', selectedValue);
              const quantityMenu = client.menus.get('quantity-menu');
              const prev_menu = 'inventory-menu';
              const quantity = itemCheck.quantity;
              console.log('Eat Inventory Cmd - Quantity:', quantity);
              await i.update({
                components: [quantityMenu.row(prev_menu, 'Eat', quantity, itemCheck.value)]
              });
            }

            else if (!inventoryMenu && !itemCheck) {
              console.log('Eat Inventory Cmd - Selected Value Quantity:', selectedValue);
              const user = interaction.user.id;
              console.log('Eat Inventory Cmd - Selected Value:', selectedValue);
              console.log('Eat Inventory Cmd - Selected Value Slice:', selectedValue.slice(2));
              const item = await KafeServices.findItem(selectedValue.slice(2));
              console.log('Eat Inventory Cmd - Item:', item);
              const quantity = Number(selectedValue.slice(0, 1));
              await UserItemsServices.removeItems(item, quantity, user);

              let totalEnergy = 0;

              if (item.energy_replen.min !== item.energy_replen.max) {
                console.log('Eat Cmd - Energy Diff');
                let i = 0;
                while (i < quantity) {
                  const interval = 5;
                  const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
                  totalEnergy = energyDiff.fate;
                  console.log('Eat Cmd - Fate:', totalEnergy);
                }
              }
              else {
                totalEnergy = item.energy_replen.max * quantity;
              }
              if (totalEnergy <= 0) {
                await UserServices.addEnergy(totalEnergy, user);
                const content = quantity > 1 ? `*You inhale each of them one after the other. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `*You eat the entire thing in one bite. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                await i.update({
                  content: content,
                  components: []
                });
                return collector.stop('Food consumed from inventory.');
              }
              else {
                await UserServices.addEnergy(totalEnergy, user);
                const content = quantity > 1 ? `*You inhale each of them one after the other.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**` : `*You eat the entire thing in one bite.*\n\n-# **${MathServices.formatNumber(totalEnergy)} energy**`;
                await i.update({
                  content: content,
                  components: []
                });
                return collector.stop('Food consumed from inventory.');
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
            console.log('Eat Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Distracted? Give it some more thought.`,
              components: []
            });
          }
          else {
            return console.log('Eat Inventory Cmd:', reason);
          }
        });
      }
      catch (e) {
        console.error('Eat Cmd: An unexpected error occurred:', e);
        return await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
  }
}
