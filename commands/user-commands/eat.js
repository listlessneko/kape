import { logger } from '../../logger.js';
import { client } from '../../client.js';
import { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { UserServices, UserItemsServices, MathServices, ErrorServices, JsonSearchServices, CacheServices, InventoryServices } from '../../services/all-services.js';

const commandName = 'UserCommand.Food';
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('eat')
    .setDescription('Consume a food.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from Kapé and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a food from your inventory.')
    ),

  async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();

    try {
      const user = {};
      user.id = interaction.user.id;
      let subcommandName;

      if (subcommand === 'order') {
        subcommandName = `${commandName}.Order`;

        try {
          const Menus = client.cache.menus;
          const subMenu = Menus.get('kapé-food-sub-menu');
          const response = await interaction.reply({
            content: subMenu.content,
            components: [subMenu.row]
          });

          const collector = await response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000
          });

          let selectedItem;

          collector.on('collect', async i => {
            const isSelf = i.user.id === user.id;

            const userSelection = i.values[0];
            logger.log(`[LOG] ${subcommandName} userSelection:`, userSelection);
            const currentMenu = Menus.get(userSelection);
            const cancelCommand = userSelection === 'nevermind';
            const item = JsonSearchServices.findKapéItemByProperty(userSelection);
            const isQuantity = (!currentMenu && !item.success && !cancelCommand && typeof Number(userSelection) === 'number') ? true : false;

            if (!isSelf) {
              logger.log(`[LOG] ${subcommandName}: Not original interaction user.`);
              await i.update({
                content: 'Please wait your turn.',
                components: [],
                ephemeral: true
              });
            } if (cancelCommand) {
              logger.log(`[LOG] ${subcommandName}: User is changing their mind.`);
              await i.update({
                content: 'Oh, maybe next time.',
                components: []
              });
              return collector.stop('User changed their mind.');
            } if (currentMenu) {
              logger.log(`[LOG] ${subcommandName}: User selected a menu.`);
              await i.update({
                content: currentMenu.content,
                components: [currentMenu.row]
              });
            } if (item.success) {
              logger.log(`[LOG] ${subcommandName}: User selected an item.`);
              selectedItem = item.found;
              const itemMenu = 'kapé-' + selectedItem.type + '-sub-menu';
              const quantityMenu = Menus.get('quantity-menu');
              const menuOpts = {
                menu: itemMenu,
                action: 'Order',
                quantity: 5,
                itemName: selectedItem.name
              }
              await i.update({
                components: [quantityMenu.row(menuOpts)]
              });
            } if (isQuantity) {
              logger.log(`[LOG] ${subcommandName}: User selected a quantity.`);
              const selectedQuantity = userSelection;
              const totalCost = selectedItem.cost * selectedQuantity;
              const displayTotalCost = MathServices.displayCurrency(totalCost);

              let guests = {
                'UserBalance': user.id,
                'UserEnergy': user.id
              }
              let bouncer = {};

              try {
                bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                user.current = {};
                user.new = {};

                const currentUserBalance = await UserServices.getBalance(user.id, bouncer);
                logger.log(`[LOG] ${subcommandName} User Balance:`, currentUserBalance);
                user.current.balance = currentUserBalance.balance;
                const displayCurrentUserBalance = MathServices.displayCurrency(currentUserBalance.balance);

                const affordable = totalCost <= user.current.balance;

                if (affordable) {
                  const { userBalance: newUserBalance } = await UserServices.subtractBalance(user.id, totalCost, bouncer);
                  user.new.balance = newUserBalance.balance;

                  let totalEnergyReplen = 0;

                  const fatefulEncounter = selectedItem.energy_replen.min !== selectedItem.energy_replen.max;

                  if (fatefulEncounter) {
                    logger.log(`[LOG] ${subcommandName}: Fateful food encounter.`);
                    totalEnergyReplen = MathServices.fatefulConsumption(selectedItem, selectedQuantity);
                  } else {
                    logger.log(`[LOG] ${subcommandName}: Just a normal food order.`);
                    totalEnergyReplen = selectedItem.energy_replen.max * selectedQuantity;
                  }

                  const { userEnergy: newUserEnergy } = await UserServices.addEnergy(user.id, totalEnergyReplen, bouncer);
                  user.new.energy = newUserEnergy.energy;

                  const unfortunate = totalEnergyReplen < 0;
                  const satisfied = totalEnergyReplen > 0;
                  const bland = totalEnergyReplen === 0;

                  const salt = selectedQuantity > 1 ? 'are' : 'is';
                  const pepper = selectedQuantity > 1 ? 'orders' : 'order';
                  const spice = selectedQuantity > 1 ? 'each of them one after the other' : 'the entire thing in one bite';

                  if (unfortunate) {
                    logger.log(`[LOG] ${subcommandName}: User is going to be sick.`);
                    await interaction.editReply({
                      content: `Here ${salt} your **${selectedQuantity} ${pepper} of ${selectedItem.name.toLowerCase()}**. Please enjoy.\n*You inhale ${spice}. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **-${displayTotalCost.amount} ${displayTotalCost.amount}**\n-# **${MathServices.formatNumber(totalEnergyReplen)} energy**`,
                      components: []
                    });
                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                    return collector.stop('User received food sickness.');
                  } if (satisfied) {
                    logger.log(`[LOG] ${subcommandName}: User regains energy.`);
                    await interaction.editReply({
                      content: `Here ${salt} your **${selectedQuantity} ${pepper} of ${selectedItem.name.toLowerCase()}**. Please enjoy.\n*You inhale ${spice}.*\n\n-# **-${displayTotalCost.amount} ${displayTotalCost.units}**\n-# **${MathServices.formatNumber(totalEnergyReplen)} energy**`,
                      components: []
                    });
                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                    return collector.stop('User regained energy.');
                  } if (bland) {
                    logger.log(`[LOG] ${subcommandName}: User feels nothing.`);
                    await interaction.editReply({
                      content: `Here ${salt} your **${selectedQuantity} ${pepper} of ${selectedItem.name.toLowerCase()}**. Please enjoy.\n*You inhale ${spice}. In the end, you feel empty.*\n\n-# **-${displayTotalCost.amount} ${displayTotalCost.amount}**\n`,
                      components: []
                    });
                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                    return collector.stop('User felt nothing.');
                  }
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User order ended abruptly.');
                } else if (!affordable) {
                  const salt = selectedQuantity > 1 ? 'these foods' : 'this food';
                  await interaction.editReply({
                    content: `Hm... It seems you cannot afford ${salt}. Maybe come back next time.\n\nTotal Cost: ${displayTotalCost.amount} ${displayTotalCost.units}\nCurrent Balance: ${displayCurrentUserBalance.amount} ${displayCurrentUserBalance.units}`,
                    components: []
                  });
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User is too poor.');
                }
              } catch (e) {
                ErrorServices.handleError(subcommandName, e);
                if (bouncer.transaction && !bouncer.transaction.finished) {
                  await ErrorServices.handleAdvancedDataRollback(subcommandName, guests, bouncer);
                }
                return await interaction.editReply({
                  content: `*A cat screeches and glass breaks behind the kitchen doors. After some time, you realize that might've been your order.`,
                  components: [],
                });
              }
            }
          });
          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
              logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
              return interaction.editReply({
                content: `Hm... Take your time.`,
                components: []
              });
            } else {
              return logger.log(`[LOG] ${subcommandName}:`, reason);
            }
          });
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
          return await interaction.editReply({
            content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
            components: [],
          });
        }
      } if (subcommand === 'inventory') {
        subcommandName = `${commandName}.Inventory`;

        try {
          user.fieldName = 'user_id';
          user.targetModel = 'UserItems';
          user.sourceModel = {};
          user.sourceModel.name = 'KafeItems';
          user.sourceModel.alias = 'kafeItem';

          const userItems = await CacheServices.findEntryWithItems(user);
          userItems.items.forEach(item => {
            logger.log(`[TEST] ${subcommandName} item:`, item);
          })
          const foodItems = userItems.items.filter(item => item.kafeItem.category === 'food');
          const dry = foodItems.length === 0;

          if (dry) {
            logger.log(`[LOG] ${subcommandName}: User is empty.`);
            return await interaction.reply({
              content: `*You ruffle through your bag and realize you don't have any food...*`
            });
          }

          const Menus = client.cache.menus;
          const inventoryMenu = Menus.get('inventory-menu');
          const response = await interaction.reply({
            content: inventoryMenu.content,
            components: [inventoryMenu.row(foodItems)]
          });

          const collector = await response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000
          });

          let selectedItem;

          collector.on('collect', async i => {
            const isSelf = i.user.id === user.id;

            const userSelection = i.values[0];
            const cancelCommand = userSelection === 'nevermind';
            const inventoryMenu = Menus.get(userSelection); // should always be 'inventory-menu'
            const userItem = foodItems.find(item => item.kafeItem.value === userSelection);
            const isQuantity = (!inventoryMenu && !userItem && !cancelCommand && typeof Number(userSelection) === 'number') ? true : false;

            if (!isSelf) {
              logger.log(`[LOG] Not interaction user:`, i.user.id);
              await i.update({
                conent: 'Please wait your turn.',
                components: [],
                ephemeral: true
              });
            } if (cancelCommand) {
              logger.log(`[LOG] User selected:`, userSelection);
              await i.update({
                content: 'Oh, maybe next time.',
                components: []
              });
              return collector.stop('User changed their mind.');
            } if (inventoryMenu) {
              logger.log(`[LOG] User selected menu:`, userSelection);
              await i.update({
                content: inventoryMenu.content,
                components: [inventoryMenu.row(foodItems)]
              });
            } if (userItem) {
              logger.log(`[LOG] User selected item:`, userSelection);
              selectedItem = userItem;
              const inventoryMenu = 'inventory-menu';
              const quantity = selectedItem.quantity;
              const quantityMenu = Menus.get('quantity-menu');
              const menuOpts = {
                menu: inventoryMenu,
                action: 'Order',
                quantity,
                itemName: selectedItem.name
              }
              await i.update({
                components: [quantityMenu.row(menuOpts)]
              });
            } if (isQuantity) {
              logger.log(`[LOG] User selected quantity:`, userSelection);
              const selectedQuantity = Number(userSelection);

              let guests = {
                'UserItems': user.id,
                'UserEnergy': user.id
              }
              let bouncer = {};

              try {
                bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                user.updated = {};

                const updatedUserItem = await InventoryServices.removeItemsFromAccount(user, selectedItem.kafeItem.dataValues, selectedQuantity, bouncer);
                user.updated.userItem = updatedUserItem;

                let totalEnergyReplen = 0;

                const selectedKafeItem = {
                  energy_replen: {
                    min: selectedItem.kafeItem.energy_replen.min,
                    max: selectedItem.kafeItem.energy_replen.max
                  }
                };
                const fatefulEncounter = selectedKafeItem.energy_replen.min !== selectedKafeItem.energy_replen.max;

                if (fatefulEncounter) {
                  logger.log(`[LOG] ${subcommandName}: Fateful food encounter.`);
                  totalEnergyReplen = MathServices.fatefulConsumption(selectedKafeItem, selectedQuantity);
                } else {
                  logger.log(`[LOG] ${subcommandName}: Just a normal food order.`);
                  totalEnergyReplen = selectedKafeItem.energy_replen.max * selectedQuantity;
                }

                const { userEnergy: updatedUserEnergy } = await UserServices.addEnergy(user.id, totalEnergyReplen, bouncer);
                user.updated.energy = updatedUserEnergy.energy;

                const unfortunate = totalEnergyReplen < 0;
                const satisfied = totalEnergyReplen > 0;
                const bland = totalEnergyReplen === 0;

                const spice = selectedQuantity > 1 ? 'each of them one bite after another' : 'the entire thing in one bite';

                if (unfortunate) {
                  logger.log(`[LOG] ${subcommandName}: User is going to be sick.`);
                  await interaction.editReply({
                    content: `*You inhale ${spice}. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **-${selectedQuantity} ${selectedItem.name}**\n-# **${MathServices.formatNumber(totalEnergyReplen)} energy**`,
                    components: []
                  });
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User received food sickness.');
                } if (satisfied) {
                  logger.log(`[LOG] ${subcommandName}: User is regaining energy.`);
                  await interaction.editReply({
                    content: `*You inhale ${spice}.*\n\n-# **-${selectedQuantity} ${selectedItem.name}**\n-# **${MathServices.formatNumber(totalEnergyReplen)} energy**`,
                    components: []
                  });
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User regained energy.');
                } if (bland) {
                  logger.log(`[LOG] ${subcommandName}: User feels nothing.`);
                  await interaction.editReply({
                    content: `*You inhale ${spice}. In the end, you feel empty.*\n\n-# **-${selectedQuantity} ${selectedItem.name}**`,
                    components: []
                  });
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User felt nothing.');
                }
                await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                return collector.stop('User suddenly stopped looking in their bag.');
              } catch (e) {
                ErrorServices.handleError(subcommandName, e);
                if (bouncer.transaction && !bouncer.transaction.finished) {
                  await ErrorServices.handleAdvancedDataRollback(subcommandName, guests, bouncer);
                }
                return await interaction.editReply({
                  content: `*A cat screeches and glass breaks behind the kitchen doors. After some time, you realize that might've been your order.`,
                  components: [],
                });
              }
            }
          });
          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
              logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
              return interaction.editReply({
                content: `Hm... Take your time.`,
                components: []
              });
            } else {
              return logger.log(`[LOG] ${subcommandName}:`, reason);
            }
          });
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
          return await interaction.editReply({
            content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
            components: [],
          });
        }
      }
    } catch (e) {
      ErrorServices.handleError(commandName, e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  }
}
