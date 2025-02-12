import { logger } from '../../logger.js';
import { 
  SlashCommandBuilder,
  ComponentType
} from 'discord.js';
import { 
  BaristaServices,
  UserServices,
  MathServices,
  FormatServices,
  RelationshipLevelServices,
  CacheServices,
  JsonSearchServices,
  ErrorServices,
  StatsServices,
} from '../../services/all-services.js';

import { setTimeout as wait } from 'node:timers/promises';
import npccustomersOrders from '../../data/npccustomer-orders.json' assert { type: 'json' };
import { CustomerServices } from '../../services/customer-services.js';

const commandName = 'UserCommand.Barista';
export default {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('barista')
    .setDescription('Help the cafe.')
    .addSubcommand(subcommand => 
      subcommand
        .setName('training')
        .setDescription('Go through a tutorial on making drinks.')
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('work')
        .setDescription('Serve drinks to customers.')
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('study')
        .setDescription('Study your brews.')
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let subcommandName;

      const barista = {
        id: interaction.user.id,
      }

      if (subcommand === 'training') {
        subcommandName = `${commandName}.Training`;
        logger.log(`[LOG] ${subcommandName}: ${barista.id}'s wanted to train.`);

        return await interaction.reply({
          content: `*"Do or do not. There is no try."*\n– Some great space wizard`
        });
      } if (subcommand === 'work') {
        subcommandName = `${commandName}.Work`;

        const baristaStatus = await UserServices.getEnergy(barista.id);
        if (baristaStatus.energy < 10) {
          logger.log(`[LOG] ${subcommandName}: ${barista.id}'s energy is too low. Currently has ${baristaStatus.energy}.`)
          return await interaction.reply({
            content: `You look tired. Please go rest and replenish your energy.\n\nCurrent energy is **${baristaStatus.energy}**.`
          });
        }

        logger.log(`[LOG] ${subcommandName}: ${barista.id}'s is working.`);

        //let trueNpc = true;
        let regular = true;
        //Math.random() < 0.7 ? trueNpc = true : regular = true;

        let customer = {};
        let composite = {};
        let theFatefulOrder;

        if (trueNpc) {
          const fate = Math.floor(Math.random() * JsonSearchServices.baristaKapéDrinkItemsLength());
          logger.log(`[LOG] ${subcommandName} fate:`, fate);
          theFatefulOrder = JsonSearchServices.findBaristaKapéDrinkByIndex(fate);
          //let fateOrder = JsonSearchServices.findBaristaKapéDrinkItem("BREWED-COFFEES-C005A");
          theFatefulOrder = theFatefulOrder.found;
          logger.log(`[LOG] ${subcommandName} fateOrder:`, theFatefulOrder);
          if (theFatefulOrder.modifications) {
            const fateTwo = Math.random();
            logger.log(`[LOG] ${subcommandName} fateTwo:`, fateTwo);
            if (fateTwo > .50) {
              delete theFatefulOrder.modifications;
            } else {
              const fateThree = Math.floor(Math.random() * theFatefulOrder.modifications.length);
              logger.log(`[LOG] ${subcommandName} fateThree:`, fateThree);
              theFatefulOrder = theFatefulOrder.modifications[fateThree];
            }
            logger.log(`[LOG] ${subcommandName} fateOrder:`, theFatefulOrder);
          }
        } if (regular) {
          customer = npccustomersOrders.customers[Math.floor(Math.random() * npccustomersOrders.customers.length)];
          logger.log(`[LOG] ${subcommandName} customer:`, customer.name);

          customer.fateOrder = customer.orders[Math.floor(Math.random() * customer.orders.length)];
          theFatefulOrder = JsonSearchServices.findBaristaKapéDrinkItem(customer.fateOrder.drink.id);

          composite = {
            theKey: FormatServices.generateCompositeKey(barista.id, customer.id),
            targetModel: 'UserNpcRelationship',
            key1: {
              id: barista.id,
              id_name: 'user_id'
            },
            key2: {
              id: customer.id,
              id_name: 'npc_id'
            }
          }

          barista.current_customer_relationship = await CacheServices.getOrSetCompositeCacheEntry(composite);
        }

        const requiredSupplies = theFatefulOrder.supplies_required;
        logger.log(`[LOG] ${commandName} Required Supplies:`, theFatefulOrder.supplies_required);

        const client = interaction.client;
        const Menus = client.cache.menus;
        const suppliesMenu = Menus.get('barista-supplies-main-menu');

        // need to create new 'incorrectAgain' lines for our main characters
        const customerDialogue = trueNpc ? CustomerServices.fateCustomerDialogue(theFatefulOrder) : customer.fateOrder[`${barista.current_customer_relationship.level}`];

        const mainContent = `-# __**Instructions**__\n-# Select the correct prepared drinks or set of ingredients. When you select an item, it will appear in the list below. Our customers can be very picky. If you even miss a gram, milimeter or minute, they will notice. Lastly, the order of operations matters. Be sure to closely follow the recipes.\n\n-# In the **Main Menu**:\n-# - If you are ready to complete the order, select **Confirm**.\n-# - If you want to restart making the order, select **Clear**.\n-# - If you want to be rude, select **Cancel**.\n\n-# **Additional Help**:\n-# For a list of brewing instructions, use the **barista study** command.\n-# If you want to go through training again, use the **barista training** command.\n\n${customerDialogue.order}\n\n***${theFatefulOrder.name}** - ${theFatefulOrder.description}*\n\nSelected items:`;

        let displayChosenSupplies;

        const response = await interaction.reply({
          content: `${mainContent}\n*None selected*\n\n*${suppliesMenu.content}*`,
          components: [suppliesMenu.row]
        });

        let prevMenu;
        let chosenSupplies = [];
        let currentItem = {};
        let firstIncorrectOrder;

        function theCollector() {
          const collector = response.createMessageComponentCollector({
            ComponentType: ComponentType.StringSelect,
            time: 300_000
          });

          collector.on('collect', async i => {
            const isSelf = i.user.id = interaction.user.id;

            let baristaSelection = i.values[0];
            logger.log(`[LOG] ${subcommandName} baristaSelection:`, baristaSelection);
            const confirmCommand = baristaSelection === 'confirm';
            logger.log(`[LOG] ${subcommandName} confirmCommand:`, confirmCommand);
            const clearSelection = baristaSelection === 'clear';
            logger.log(`[LOG] ${subcommandName} clearSelection:`, clearSelection);
            const cancelCommand = baristaSelection === 'cancel';
            logger.log(`[LOG] ${subcommandName} cancelCommand:`, cancelCommand);

            const currentBaristaMenu = Menus.get(baristaSelection);
            logger.log(`[LOG] ${subcommandName} currentMenu:`, currentBaristaMenu);

            const modifyMenu = Menus.get('barista-modify-menu');
            logger.log(`[LOG] ${subcommandName} modifyMenu:`, modifyMenu);

            const { found: isSupplyItem } = JsonSearchServices.findBaristaSupplyItem(baristaSelection);
            logger.log(`[LOG] ${subcommandName} isSupplyItem:`, isSupplyItem);

            if (isSupplyItem) {
              currentItem = JSON.parse(JSON.stringify(isSupplyItem));
              logger.log(`[LOG] ${subcommandName} currentItem:`, currentItem);
              currentItem.displayItemName = currentItem.name;
              logger.log(`[LOG] ${subcommandName} currentItem.displayItemName:`, currentItem.displayItemName);
              currentItem.isModifiable = isSupplyItem.modifications ? true : false;
            }

            const currentModificationDone = JsonSearchServices.isModified(currentItem?.name, currentItem?.currentModification?.name, baristaSelection);

            const theContent = !firstIncorrectOrder ? mainContent : `${customerDialogue.incorrect}\n\n**-# Incorrect. Restart the order...**\nSelected items:`;

            if (!isSelf) {
              logger.log(`[LOG] ${subcommandName}: Someone else is trying to interfere.`);
              await i.update({
                content: 'Just stand back.',
                components: [],
                ephemeral: true
              });
            } if (cancelCommand) {
              logger.log(`[LOG] ${subcommandName}: Barista is canceling the order.`);
              displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
              // add some kind of punishment in the future
              // perhaps a rating system or exp lost
              // also, add unique lines for this action from customers
              await i.update({
                content: `${theContent}\n${displayChosenSupplies}`,
                components: []
              });
              await i.followUp({
                content: '*You canceled the order.\n\nHow rude of you. The customer stormed out.*',
                components: []
              });
              return collector.stop('Barista canceled the order. How rude.');
            } else if (clearSelection) {
              logger.log(`[LOG] ${subcommandName}: Barista is remaking the order.`);
              chosenSupplies = [];
              currentItem = undefined;
              displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
              await i.update({
                content: `${theContent}\n${displayChosenSupplies}\n\n*${suppliesMenu.content}*`,
                components: [suppliesMenu.row]
              });
            } else if (currentBaristaMenu) {
              logger.log(`[LOG] ${subcommandName}: Barista is going through their mind palace.`);
              if (currentItem?.isModifiable) currentItem = {};
              prevMenu = currentBaristaMenu.customId;
              logger.log(`[LOG] ${subcommandName} prevMenu:`, prevMenu);
              displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
              await i.update({
                content: `${theContent}\n${displayChosenSupplies}\n\n*${currentBaristaMenu.content}*`,
                components: [currentBaristaMenu.row]
              });
            } else if (currentItem?.isModifiable) {
              logger.log(`[LOG] ${subcommandName}: Order contains modifiable ingredient.`);
              logger.log(`[LOG] ${subcommandName} baristaSelection:`, baristaSelection);
              logger.log(`[LOG] ${subcommandName} currentItem.modificationStatus:`, currentItem.modificationStatus);
              if (!currentItem.modificationStatus) {
                logger.log(`[LOG] ${subcommandName}: Current Item has not been modified.`);
                logger.log(`[LOG] ${subcommandName} baristaSelection:`, baristaSelection);
                for (const modification of currentItem.modifications) {
                  modification.status = false;
                }
                currentItem.modificationStatus = BaristaServices.checkModificationStatus(currentItem.modifications);
                logger.log(`[LOG] ${subcommandName} currentItem.modificationStatus:`, currentItem.modificationStatus);

                currentItem.currentModification = BaristaServices.findCurrentModification(currentItem.modifications);
                logger.log(`[LOG] ${subcommandName} currentItem.currentModification:`, currentItem.currentModification);
                const modifyOpts = {
                  prevMenu,
                  currentItem,
                  modification: currentItem.currentModification.name
                }
                const { content: modifyMenuContent, row: modifyMenuRow } = modifyMenu.createMenu(modifyOpts);
                displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
                await i.update({
                  content: `${theContent}\n${displayChosenSupplies}\n\n*${modifyMenuContent}*`,
                  components: [modifyMenuRow],
                });
              } else if (currentModificationDone.success) {
                logger.log(`[LOG] ${subcommandName}: Barista is finessing.`);
                logger.log(`[LOG] ${subcommandName} baristaSelection:`, baristaSelection);

                currentItem.currentModification = BaristaServices.findCurrentModification(currentItem.modifications);
                logger.log(`[LOG] ${subcommandName} currentItem.currentModification:`, currentItem.currentModification);

                currentItem.displayItemName = `${currentItem.displayItemName} (${currentModificationDone.found.display_name})`;

                currentItem.modifications.map(modification => {
                  if (modification.name === currentItem.currentModification.name) {
                    logger.log(`[LOG] ${subcommandName} modification.name:`, modification.name);
                    logger.log(`[LOG] ${subcommandName} currentItem.currentModification.name:`, currentItem.currentModification.name);
                    modification.status = true;
                  }
                });
                currentItem.modificationStatus = BaristaServices.checkModificationStatus(currentItem.modifications);
                logger.log(`[LOG] ${subcommandName} currentItem.modificationStatus:`, currentItem.modificationStatus);
                if (currentItem.modificationStatus.modifying) {
                  logger.log(`[LOG] ${subcommandName}: Barista is still finessing.`);
                  currentItem.currentModification = BaristaServices.findCurrentModification(currentItem.modifications);
                  logger.log(`[LOG] ${subcommandName} currentItem.currentModification:`, currentItem.currentModification);
                  const modifyOpts = {
                    prevMenu,
                    currentItem,
                    modification: currentItem.currentModification.name
                  }
                  const { content: modifyMenuContent, row: modifyMenuRow } = modifyMenu.createMenu(modifyOpts);
                  displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
                  await i.update({
                    content: `${theContent}\n${displayChosenSupplies}\n\n*${modifyMenuContent}*`,
                    components: [modifyMenuRow],
                  });
                } else if (currentItem.modificationStatus.modified) {
                  logger.log(`[LOG] ${subcommandName}: Barista finished finessing.`);
                  logger.log(`[LOG] ${subcommandName} currentItem:`, currentItem);
                  chosenSupplies.push(currentItem);
                  displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
                  await i.update({
                    content: `${theContent}\n${displayChosenSupplies}\n\n*${suppliesMenu.content}*`,
                    components: [suppliesMenu.row]
                  });
                  currentItem = {};
                } else {
                  const modifyOpts = {
                    prevMenu,
                    currentItem,
                    modification: currentItem.currentModification.name
                  }
                  const { content: modifyMenuContent, row: modifyMenuRow } = modifyMenu.createMenu(modifyOpts);
                  displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
                  await i.update({
                    content: `${theContent}\n${displayChosenSupplies}\n\n*${modifyMenuContent}*`,
                    components: [modifyMenuRow],
                  });
                }
              }
            } else if (isSupplyItem && !currentItem.isModifiable) {
              logger.log(`[LOG] ${subcommandName}: Barista is brewin'.`);
              currentItem.displayItemName = currentItem.name;
              chosenSupplies.push(currentItem);
              displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);
              await i.update({
                content: `${theContent}\n${displayChosenSupplies}\n\n*${suppliesMenu.content}*`,
                components: [suppliesMenu.row]
              });
            } else if (confirmCommand) {
              logger.log(`[LOG] ${subcommandName}: Barista is finishing their brew.`);
              const { accurate, precise, incorrect } = BaristaServices.advancedCreateOrder(requiredSupplies, chosenSupplies);

              let guests = {
                'UserEnergy': barista.id,
                'BaristaStats': barista.id
              };

              if (regular) {
                guests['UserNpccustomerOrders'] = composite;
              }

              let bouncer = {};

              const energyConsumed = 10;
              let baristaLevelUp = false;
              let relationshipLevelUp = false;
              let letTheRecordState;

              const results = {
                outcome: '',
                rewards: {}
              };

              if (precise || accurate) {
                if (precise) {
                  guests['UserBalance'] = barista.id;
                }
                guests['UserLevel'] = barista.id;
                guests['UserNpcRelationship'] = composite;
              }

              try {
                bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                await UserServices.removeEnergy(barista.id, energyConsumed, bouncer);

                if (precise) {
                  logger.log(`[LOG] ${subcommandName}: Barista successfully completed an order.`);
                  const multiplier = regular ? 2 : 1;
                  results.outcome = 'correct';
                  results.rewards.exp = 50 * multiplier;
                  results.rewards.cash = MathServices.roundTo2Decimals((theFatefulOrder.cost * .25 * multiplier));

                  if (regular) {
                    letTheRecordState = await StatsServices.calculateUserToNpccustomerOrders(composite, results, bouncer);
                    const { vsRelationship, levelUp } = await RelationshipLevelServices.checkRelationshipLevel(composite, bouncer);
                    barista.prev_customer_relationship = barista.customer_relationship;
                    barista.current_customer_relationship = { vsRelationship };
                    relationshipLevelUp = { levelUp };
                  } else {
                    letTheRecordState = await StatsServices.calculateBaristaWanderersOrders(barista.id, results, bouncer);
                  }
                  const milestone = letTheRecordState.allTimeRecord.correct_orders % 10 === 0;
                  const baristaLevel = await UserServices.addExp(barista.id, results.rewards.exp, bouncer)
                  baristaLevelUp = baristaLevel.levelUp;
                  barista.level = baristaLevel.userLevel.level;

                  await UserServices.addBalance(barista.id, results.rewards.cash, bouncer);

                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);

                  const displayCash = MathServices.displayCurrency(results.rewards.cash);

                  await i.update({
                    content: `${theContent}\n${displayChosenSupplies}`,
                    components: []
                  });
                  await i.followUp({
                    content: `${customerDialogue.correct}\n\n-# **Correct**\n-# **-${energyConsumed} energy**\n-# **+${results.rewards.exp} experience**\n-# **+${displayCash.amount} ${displayCash.units}**`,
                    components: []
                  });
                  if (!milestone && !baristaLevelUp) return collector.stop('End of order.');
                  if (milestone) {
                    logger.log(`[LOG] ${subcommandName} Barista Total Orders:`, letTheRecordState.allTimeRecord.total_orders);
                    await wait(1_000);
                    const bonus = {
                      exp: 500,
                      cash: 20
                    }

                    bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                    const baristaLevel = await UserServices.addExp(barista.id, results.rewards.exp, bouncer)
                    baristaLevelUp = baristaLevel.levelUp;
                    barista.level = baristaLevel.userLevel.level;

                    await UserServices.addBalance(barista.id, bonus.cash, bouncer);

                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);

                    const displayBonusCash = MathServices.displayCurrency(bonus.cash);

                    await interaction.followUp({
                      content: `You seem to be getting used to things. Good job.\n\n-# **Milestone**\n-# **+${bonus.exp} experience**\n-# **+${displayBonusCash.amount} ${displayBonusCash.units}**`
                    });
                    if (!baristaLevelUp) return collector.stop('End of order.');
                  }
                } else if (accurate) {
                  logger.log(`[LOG] ${subcommandName}: Barista made an... acceptable order.`);

                  results.outcome = 'acceptable';
                  results.rewards.exp = 10;
                  results.rewards.cash = 0;

                  if (regular) {
                    letTheRecordState = await StatsServices.calculateUserToNpccustomerOrders(composite, results, bouncer);
                    const { vsRelationship, levelUp } = await RelationshipLevelServices.checkRelationshipLevel(composite, bouncer);
                    barista.prev_customer_relationship = barista.customer_relationship;
                    barista.current_customer_relationship = { vsRelationship };
                    relationshipLevelUp = { levelUp };
                  } else {
                    letTheRecordState = await StatsServices.calculateBaristaWanderersOrders(barista.id, results, bouncer);
                  }
                  const baristaLevel = await UserServices.addExp(barista.id, results.rewards.exp, bouncer)
                  baristaLevelUp = baristaLevel.levelUp;
                  barista.level = baristaLevel.userLevel.level;

                  await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);

                  await i.update({
                    content: `${theContent}\n${displayChosenSupplies}`,
                    components: []
                  });
                  await i.followUp({
                    content: `${customerDialogue.acceptable}\n\n-# **Acceptable...**\n-# **${results.rewards.exp} experience**`,
                    components: []
                  });
                  if (!baristaLevelUp && !relationshipLevelUp) return collector.stop('End of order.');
                } if (relationshipLevelUp) {
                  logger.log(`[LOG] Barista Relationship Level Up:`, relationshipLevelUp);
                  await wait(1_000);
                  const bonus = {
                    exp: 750,
                    cash: 25
                  }

                  bouncer = await ErrorServices.startAdvancedSquealOperations(subcommandName, guests);

                  const baristaLevel = await UserServices.addExp(barista.id, results.rewards.exp, bouncer)
                  baristaLevelUp = baristaLevel.levelUp;
                  barista.level = baristaLevel.userLevel.level;

                  await UserServices.addBalance(barista.id, bonus.cash, bouncer);

                  const displayBonusCash = MathServices.displayCurrency(bonus.cash);

                  await interaction.followUp({
                    content: `Relationship with ${customer[`${barista.current_relationship.relationship_level}`].name} leveled up from Level ${barista.prev_customer_relationship.level} to ** Level ${barista.current_customer_relationship.level}**\n\n-# **+${bonus.exp} experience**\n-# **+${displayBonusCash.amount} ${displayBonusCash.units}**`
                  });
                  if (!baristaLevelUp) return collector.stop('End of order.');
                } if (baristaLevelUp) {
                  logger.log(`[LOG] ${subcommandName} Barista Level Up:`, barista.level);
                  await wait(1_000);
                  await interaction.followUp({
                    content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${barista.level - 1} to **Level ${barista.level}!**`
                  });
                  return collector.stop('End of order.');
                } else if (incorrect) {
                  firstIncorrectOrder = true;
                  results.outcome = 'incorrect';
                  results.rewards.exp = 0;
                  results.rewards.cash = 0;

                  if (!firstIncorrectOrder) {
                    logger.log(`[LOG] ${subcommandName}: Barista completed an incorrect order.`);
                    chosenSupplies = [];
                    currentItem = undefined;
                    displayChosenSupplies = BaristaServices.displaySelectedSupplies(chosenSupplies);

                    if (regular) {
                      await StatsServices.calculateUserToNpccustomerOrders(composite, results, bouncer);
                      await RelationshipLevelServices.checkRelationshipLevel(composite, bouncer);
                    } else {
                      await StatsServices.calculateBaristaWanderersOrders(barista.id, results, bouncer);
                    }

                    const again = regular ? '' : `. Restart the order...**\nSelected items:\n${displayChosenSupplies}`;
                    const thisComponents = regular ? [suppliesMenu.row] : [];

                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);

                    await i.update({
                      content: `${mainContent}\n${displayChosenSupplies}`,
                      components: []
                    });
                    await i.followUp({
                      content: `${customerDialogue.incorrect}\n\n**-# Incorrect${again}`,
                      components: thisComponents
                    });
                    if (regular) {
                      collector.stop('End of order.');
                    } else {
                      collector.stop('Restarting order...');
                      theCollector();
                    }
                  } else {
                    await StatsServices.calculateBaristaWanderersOrders(barista.id, results, bouncer);

                    logger.log(`[LOG] ${subcommandName}: Barista completed an incorrect order... again.`);

                    await ErrorServices.endAdvancedSquealOperations(subcommandName, bouncer);

                    await i.update({
                      content: `${theContent}\n${displayChosenSupplies}`,
                      components: []
                    });
                    await i.followUp({
                      content: `${customerDialogue.incorrectAgain}\n\n-# **Incorrect... again.**`,
                      components: []
                    });
                    return collector.stop('End of order.');
                  }
                }
              } catch (e) {
                ErrorServices.handleError(subcommandName, e);
                if (bouncer.transaction && !bouncer.transaction.finished) {
                  await ErrorServices.handleAdvancedDataRollback(subcommandName, guests, bouncer);
                }
                await interaction.followUp({
                  content: `*A cat screeches and glass breaks behind the kitchen doors. The customer's widened eyes glances to the kitchen doors and then curiously back at you.*\n\n**Customer**: Maybe I'll come back next time...`,
                  components: [],
                });
              }
            }
          });
          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
              logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
              return interaction.reply({
                content: '*You took too long and the customer walked away.*',
                components: []
              });
            } else {
              logger.log(`[LOG] ${subcommandName}:`, reason);
            }
          });
        }
        theCollector();
      } if (subcommand === 'study') {
        subcommandName = `${commandName}.Study`;
        logger.log(`[LOG] ${subcommandName}: ${barista.id}'s is studying.`);

        const basicInstructions = '-# __**Basic Instructions**__\n-# - **Sizes**: All drinks have a set volume; there are no height or number modifications here.\n-# - **Modifications**: However, customers may ask for preferences such as the type of beans or milk.\n\n-# Knowing this, you should know how to make all, or most, drinks.';

        const Menus = interaction.client.cache.menus;
        const baristaBrainMenu = Menus.get('barista-kapé-main-menu');
        const response = await interaction.reply({
          content: `${basicInstructions}\n\n${baristaBrainMenu.content}`,
          components: [baristaBrainMenu.row]
        });

        let prevMenu;

        function theCollector() {
          const collector = response.createMessageComponentCollector({
            ComponentType: ComponentType.StringSelect,
            time: 120_000
          });

          collector.on('collect', async i => {
            const isSelf = i.user.id = interaction.user.id;

            const baristaSelection = i.values[0];
            logger.log(`[LOG] ${subcommandName} baristaSelection:`, baristaSelection);
            const doneStudying = baristaSelection === 'close';
            const currentMenu = Menus.get(baristaSelection);
            const isKapéItem = JsonSearchServices.findBaristaKapéDrinkItem(baristaSelection);
            const kapéItem = isKapéItem.success ? isKapéItem.found : undefined;

            if (!isSelf) {
              logger.log(`[LOG] ${subcommandName}: Someone else is trying to interfere.`);
              await i.update({
                content: 'Do not bother someone studying.',
                components: [],
                ephemeral: true
              });
            } if (doneStudying) {
              logger.log(`[LOG] ${subcommandName}: Barista is taking a break from studying.`);
              await i.update({
                content: 'Now get to work!',
                components: []
              });
              return collector.stop('Barista is ready to work.');
            } if (currentMenu) {
              logger.log(`[LOG] ${subcommandName}: Barista is flipping through the pages.`);
              prevMenu = currentMenu;
              await i.update({
                content: `${basicInstructions}\n\n${currentMenu.content}`,
                components: [currentMenu.row]
              });
              collector.stop('Resetting timer...');
              theCollector();
            } else if (kapéItem) {
              let suppliesRequired = '';
              for (const supply of kapéItem.supplies_required) {
                console.log(`[TEST] supply:`, supply);
                suppliesRequired += `- *${supply.name}*\n`;
              }
              const content = `${basicInstructions}\n\n__***${kapéItem.name}***__\n${suppliesRequired}\nWhat other recipe would you like to see?`;
              await i.update({
                content: content,
                components: [prevMenu.row]
              });
              collector.stop('Resetting timer...');
              theCollector();
            }
          });
          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
              logger.log(`[LOG] ${subcommandName}: Time limit reached.`);
              return interaction.editReply({
                content: 'Perhaps you\'re tired. Take a break.',
                components: []
              });
            } else {
              logger.log(`[LOG] ${subcommandName}:`, reason);
            }
          });
        }
        theCollector();
      }
    } catch (e) {
      ErrorServices.handleError(commandName, e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors. The customer's widened eyes glances to the kitchen doors and then curiously back at you.*\n\n**Customer**: Maybe I'll come back next time...`,
        components: [],
      });
    }
  }
}
