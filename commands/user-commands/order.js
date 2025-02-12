import { logger } from '../../logger.js';
import { client } from '../../client.js';
import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { UserServices, UserItemsServices, JsonSearchServices, MathServices, ErrorServices, InventoryServices, CacheServices } from '../../services/all-services.js';
import { UserItems } from '../../models/user-items.js';
import { BalanceServices } from '../../services/balance-services.js';

const commandName = 'UserCommand.Order';
export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('Order an item.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('kapé-item')
        .setDescription('Order an item from Kapé Kafe.')
  )
    .addSubcommand(subcommand =>
      subcommand
        .setName('supplies')
        .setDescription('Order supplies for your kafe.')
  ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let subcommandName;

    try {
      const user = {};
      user.id = interaction.user.id;

      if (subcommand === 'kapé-item') {
        subcommandName = `${commandName}.KapéItem`;
        logger.log(`[LOG] User selected ${subcommandName}.`);

        const Menus = client.cache.menus;
        const kapéMainMenu = Menus.get('kapé-main-menu');
        const response = await interaction.reply({
          content: kapéMainMenu.content,
          components: [kapéMainMenu.row]
        });

        const collector = await response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        let selectedItem;

        collector.on('collect', async i => {
          try {
            const isSelf = i.user.id = user.id;

            const userSelection = i.values[0];
            logger.log(`[LOG] ${subcommandName} userSelection:`, userSelection);
            const cancelCommand = userSelection === 'nevermind';
            const currentMenu = Menus.get(userSelection);
            const item = JsonSearchServices.findKapéItemByProperty(userSelection);
            const isQuantity = !cancelCommand && !currentMenu && !item.success && typeof Number(userSelection) === 'number' ? true : false;

            if (!isSelf) {
              logger.log(`[LOG] ${subcommandName}: Not original interaction user.`);
              await i.update({
                content: 'Please wait your turn.',
                compontents: [],
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
              const itemMenu = 'kapé' + selectedItem.type + '-menu';
              const quantityMenu = Menus.get('quantity-menu');
              const menuOpts = {
                menu: itemMenu,
                action: 'Order',
                quantity: 5,
                itemName: selectedItem.name
              };
              await i.update({
                components: [quantityMenu.row(menuOpts)]
              });
            } if (isQuantity) {
              logger.log(`[LOG] ${subcommandName}: User selected a quantity.`);
              const selectedQuantity = Number(userSelection);
              const totalCost = selectedItem.cost * selectedQuantity;
              const displayTotalCost = MathServices.displayCurrency(totalCost);

              const targetBalanceModel = 'UserBalance';
              const targetItemsModel = 'UserItems';

              let guests = {
                [targetBalanceModel]: user.id,
                [targetItemsModel]: user.id,
              };
              let bouncer = {};

              try {
                bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                const currentUserBalance = await UserServices.getBalance(user.id, bouncer);
                logger.log(`[LOG] ${subcommandName} Current User Balance:`, currentUserBalance.balance);
                const displayCurrentUserBalance = MathServices.displayCurrency(currentUserBalance.balance);

                const affordable = totalCost <= currentUserBalance.balance;

                const isWater = selectedItem.name === 'Water';
                const waterAllowed = currentUserBalance.water_allowance >= selectedQuantity;
                let displayUpdatedWaterAllowance;

                if (affordable) {
                  if (isWater) {
                    if (waterAllowed) {
                      const { water_allowance: updatedUserWaterAllowance } = await UserServices.subtractWaterAllowance(user.id, selectedQuantity, bouncer);
                      displayUpdatedWaterAllowance = updatedUserWaterAllowance;
                    } else {
                      await interaction.editReply({
                        content: `Let us slow down with the water. You do not want to drown yourself.\n\nCurrent Water Allowance: ${currentUserBalance.water_allowance}`,
                        components: []
                      });
                      await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                      return collector.stop('User is asking for too much water.');
                    }
                  }

                  const { userBalance: newUserBalance } = await UserServices.subtractBalance(user.id, totalCost, bouncer);
                  logger.log(`[LOG] ${subcommandName} New User Balance:`, newUserBalance.balance);

                  const sourceItemsModel = {
                    name: 'KafeItems',
                    alias: 'kafeItem'
                  };

                  const userItemsAccount = {
                    id: user.id,
                    fieldName: 'user_id',
                    targetModel: targetItemsModel,
                    sourceModel: sourceItemsModel,
                  };

                  await InventoryServices.addItemsToAccount(userItemsAccount, selectedItem, selectedQuantity, bouncer);

                  const liquids = selectedQuantity > 1 ? `Here are your **${selectedQuantity} orders** of **${selectedItem.name.toLowerCase()}**.*You stash the drinks in your bag.*` : `Here is your single order of **${selectedItem.name.toLowerCase()}**\n\n*You stash the drink in your bag*.`;
                  const solids = selectedQuantity > 1 ? `Here are your **${selectedQuantity} orders** of **${selectedItem.name.toLowerCase()}**.*You stash the food in your bag.*` : `Here is your single order of **${selectedItem.name.toLowerCase()}**\n\n*You stash the food in your bag*.`;
                  const content = selectedItem.category === 'drinks' ? liquids : solids;
                  const orderedWater = displayUpdatedWaterAllowance ? `\n-# **-${selectedQuantity} water allowance**` : '';

                  await interaction.editReply({
                    content: `${content} \n\n-# **+${selectedQuantity} ${selectedItem.name}**\n-# **-${displayTotalCost.amount} ${displayTotalCost.units}**${orderedWater}`,
                    components: []
                  });
                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                  return collector.stop('User completed order.');
                } else if (!affordable) {
                  const liquids = selectedQuantity > 1 ? 'these drinks' : 'this drink';
                  const solids = selectedQuantity > 1 ? 'these foods' : 'this food';
                  logger.log(`[LOG] ${subcommandName} selectedItem:`, selectedItem);
                  const substance = selectedItem.category === 'drinks' ? liquids : solids;
                  await interaction.editReply({
                    content:`Hm... It seems you cannot afford ${substance}. Maybe come back next time. \n\nTotal Cost: ${displayTotalCost.amount} ${displayTotalCost.units}\nCurrent Balance: ${displayCurrentUserBalance.amount} ${displayCurrentUserBalance.units}`,
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
                await interaction.editReply({
                  content: `*A cat screeches and glass breaks behind the kitchen doors. After some time, you realize that might've been your order.*`,
                  components: [],
                });
                return collector.stop('There was an error with the order.');
              }
            }
          } catch (e) {
            ErrorServices.handleError(subcommandName, e);
            return await interaction.editReply({
              content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
              components: [],
            });
          }
        });
        collector.on('end', (collected, reason) => {
          try {
            if (reason === 'time') {
              logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
              return interaction.editReply({ 
                content: `Hm... Take your time then.`,
                components: []
              });
            } else {
              logger.log(`${subcommandName}:`, reason);
            }
          } catch (e) {
            ErrorServices.handleError(subcommandName, e);
            return interaction.editReply({
              content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
              components: [],
            });
          }
        });
      } if (subcommand === 'supplies') {
        subcommandName = `${commandName}.Supplies`;
        logger.log(`[LOG] User selected ${subcommandName}.`);

        return await interaction.reply({
          content: 'Sorry. This store is currently under construction. Please come again later.'
        });

        const Menus = client.cache.menus;
        const suppliesMainMenu = Menus.get('supplies-main-menu');
        const response = await interaction.reply({
          content: suppliesMainMenu.content,
          components: [suppliesMainMenu.row]
        });

        const collector = await response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        let selectedItem;

        collector.on('collect', async i => {
          const isSelf = i.user.id = user.id;

          const userSelection = i.values[0];
          logger.log(`[LOG] ${subcommandName} userSelection:`, userSelection);
          const cancelCommand = userSelection === 'nevermind';
          const currentMenu = Menus.get(userSelection);
          const item = await JsonSearchServices.findSupplyItem(userSelection);
          const isQuantity = !cancelCommand && !currentMenu && !item.success && typeof Number(userSelection) === 'number' ? true : false;

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
            const itemMenu = selectedItem.type + '-menu';
            const quantityMenu = Menus.get('quantity-menu');
            const menuOpts = {
              menu: itemMenu,
              action: 'Order',
              quantity: 20,
              itemName: selectedItem.name
            }
            await i.update({
              components: [quantityMenu.row(menuOpts)]
            });
          } if (isQuantity) {
            logger.log(`[LOG] ${subcommandName}: User selected a quantity.`);
            const selectedQuantity = Number(userSelection);
            const totalCost = selectedItem.cost * selectedQuantity;
            const displayTotalCost = MathServices.displayCurrency(totalCost);

            const targetBalanceModel = 'UserKafeBalance';
            const targetItemsModel = 'UserKafeSupplies';

            let guests = {
              [targetBalanceModel]: user.id,
              [targetItemsModel]: user.id,
            };
            let bouncer = {};

            try {
              bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

              const kafeBalanceAccount = {
                id: user.id,
                targetModel: targetBalanceModel,
              }
              const currentKafeBalance = await CacheServices.getOrSetCacheEntry(kafeBalanceAccount, bouncer);
              logger.log(`[LOG] ${subcommandName} Current Kafe Balance:`, currentKafeBalance.balance);
              const displayCurrentUserKafeBalance = MathServices.displayCurrency(currentKafeBalance.balance);

              const affordable = totalCost <= currentKafeBalance.balance;

              if (affordable) {
                const { account: newKafeBalance } = await BalanceServices.deduct(kafeBalanceAccount, totalCost, bouncer);
                logger.log(`[LOG] ${subcommandName} New Kafe Balance:`, newKafeBalance.balance);

                const sourceItemsModel = {
                  name: 'Supplies',
                  alias: 'Supply'
                };

                const kafeItemsAccount = {
                  id: user.id,
                  fieldName: 'user_id',
                  targetModel: targetItemsModel,
                  sourceModel: sourceItemsModel
                };

                await InventoryServices.addItemsToAccount(kafeItemsAccount, selectedItem, selectedQuantity, bouncer);

                const salt = `Here are your **${selectedQuantity}** orders of **${selectedItem.name}**. Good luck.`;
                const pepper = `Here is your single order of **${selectedItem.name}**. Good luck.`;
                const content = selectedQuantity > 1 ? salt : pepper;

                await interaction.editReply({
                  content: `${content}\n\n-# **+${selectedQuantity} ${selectedItem.name}**\n-# **-${displayTotalCost.amount} ${displayTotalCost.units}**`,
                  components: []
                });
                await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);
                return collector.stop('User completed supply order.');
              } else if (!affordable) {
                const salt = selectedQuantity > 1 ? 'these supplies' : 'this item';
                await interaction.editReply({
                  content: `Hm... It seems you can't afford ${salt}. Maybe come back next time.\n\nTotal Cost: ${displayTotalCost.amount} ${displayTotalCost.units}\nCurrent Kafe Balance: ${displayCurrentUserKafeBalance.amount} ${displayCurrentUserKafeBalance.units}`,
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
              await interaction.editReply({
                content: `*A cat bolts from behind one stack of crates to another followed by a sharp crack and a loud bang. After some time, you begin to think that might've been your order.*`,
                components: []
              });
              return collector.stop('There was an error with the supply order.');
            }
          }
        });
        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
            return interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          } else {
            logger.log(`${subcommandName}:`, reason);
          }
        });
      }
    } catch (e) {
      ErrorServices.handleError(subcommandName, e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
        components: [],
      });
    }
  },
}
