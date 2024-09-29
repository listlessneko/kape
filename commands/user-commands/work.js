const { 
  SlashCommandBuilder,
  ComponentType
} = require('discord.js');

const { client } = require('../../client.js');

const { 
  UserServices,
  UserLevelsServices,
  MathServices,
  FormatServices,
  KafeServices,
  TextAnimationsServices,
  UserCustomerStatsServices,
  RelationshipLevelServices
} = require('../../services/all-services.js');

const wait = require('node:timers/promises').setTimeout;
const customers = require('../../data/customers.json');

module.exports = {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Help the cafe.')
    .addSubcommand(subcommand => 
      subcommand
        .setName('barista')
        .setDescription('Serve drinks to customers.')
    ),

  async execute(interaction) {
    const userStatus = await UserServices.getUsers(interaction.user.id);

    try {
      if (userStatus.energy < 10) {
        await interaction.reply({
          content: `You look tired. Please go rest and replenish your energy.\n\nCurrent energy is **${userStatus.energy}**.`
        });
        return console.log(`Work Cmd: ${interaction.user.id}'s energy is too low. Currently has ${userStatus.energy}.`)
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'barista') {
        const customer = customers.customers[Math.floor(Math.random() * customers.customers.length)];
        //const customer = customers.customers[0];
        console.log('Work Barista Cmd - Customer:', customer.name);
        const customerOrder = customer.orders[Math.floor(Math.random() * customer.orders.length)];
        const drink = customerOrder.drink;
        console.log('Work Barista Cmd - Customer Drink:', drink);
        console.log('Work Barista Cmd - Customer Acceptable Items:', customerOrder.acceptable_items);

        const keys = {
          key1: {
            id: interaction.user.id,
            name: 'user_id'
          },
          key2: {
            id: customer.customer_id,
            name: 'customer_id'
          }
        }

        console.log('Work Barista Cmd - Keys:', keys);

        const userCustomerRelationship = await RelationshipLevelServices.getRelationshipLevel(keys.key1, keys.key2);
        const relationshipStatus = userCustomerRelationship.relationship_level ?? 'stranger';
        console.log('Work Barista Cmd - Relationship Status:', relationshipStatus);
        const customerDialogue = customerOrder[relationshipStatus];
        //console.log('Work Barista Cmd - Customer Dialogue Options:', customerDialogue);

        const baristaBrain = customerOrder.category === 'drinks' ? client.menus.get('barista-drinks-menu') : client.menus.get('barista-food-menu');

        const response = await interaction.reply({
          content: customerDialogue.order,
          components: [baristaBrain.row]
        });

        try {
          const collector = await response.createMessageComponentCollector({
            componenttype: ComponentType.StringSelect,
            time: 120_000
          });

          collector.on('collect', async i => {
            const menu = client.menus.get(i.values[0])
            const selectedValue = i.values[0];

            if (i.user.id === interaction.user.id) {
              if (menu) {
                await i.update({
                  components: [menu.row]
                });
              }

              else if (!menu) {
                const energyConsumed = 10;
                const userEnergy = await UserServices.removeEnergy(energyConsumed, interaction.user.id);
                //console.log('Work Barista Cmd - User Energy:', userEnergy);

                let cafeNoises = 'Cafe noises';
                await TextAnimationsServices.loadingEllipses(interaction, cafeNoises);

                if (selectedValue === drink) {
                console.log('Work Barista Cmd - Selected Drink:', selectedValue);
                  const exp = 100;
                  const itemOrdered = await KafeServices.findItem(selectedValue);
                  const commission = MathServices.roundTo2Decimals(itemOrdered.cost * .25);
                  const rewards = {
                    exp,
                    commission
                  }

                  const userExp = await UserLevelsServices.addExp(rewards.exp, interaction.user.id);
                  //console.log('Work Barista Cmd - User:', userExp);
                  await UserServices.addBalance(rewards.commission, interaction.user.id);

                  //console.log('Work Barista Cmd - Customer Name:', customer.name);

                  const results = {
                    ...keys,
                    outcome: 'correct'
                  }

                  //let i = 0;
                  //while (i < 10) {
                  //  await UserCustomerStatsServices.trackingUserToCustomerOrders(results);
                  //  i++;
                  //}
                  await UserCustomerStatsServices.trackingUserToCustomerOrders(results);
                  const userBarista = await UserCustomerStatsServices.getUsersBaristaStats(interaction.user.id);

                  const money = MathServices.displayCurrency(rewards.commission);

                  await interaction.editReply({
                    content: `${customerDialogue.correct}\n\n-# **-${energyConsumed} energy**\n-# **+${rewards.exp} experience**\n-# **+${money.funds} ${money.units}**`,
                    components: []
                  });
                  console.log('Work Barista Cmd: Order successful.');

                  const userCustomer = await RelationshipLevelServices.checkRelationshipLevel(results.key1, results.key2);
                  console.log('Work Barista Cmd - Relationship Level:', userCustomer.relationship_level);

                  if (userCustomer.levelUp) {
                  console.log('Work Barista Cmd - User Customer Level Up:', userCustomer.levelUp);
                    await wait(1_000);
                    const bonus = {
                      exp: 750,
                      funds: 25
                    }
                    await UserLevelsServices.addExp(bonus.exp, interaction.user.id);
                    await UserServices.addBalance(bonus.funds, interaction.user.id);
                    const bonusFunds = MathServices.displayCurrency(bonus.funds);
                    await interaction.followUp({
                      content: `Relationship with ${customer[relationshipStatus].name} leveled up from Level ${userCustomer.prev_level} to ** Level ${userCustomer.level}**\n\n-# **+${bonus.exp} experience**\n-# **+${bonusFunds.funds} ${bonusFunds.units}**`
                    });
                  }

                  if (userBarista.total_orders % 10 === 0) {
                  console.log('Work Barista Cmd - User Barista Total Orders:', userBarista.total_orders);
                    await wait(1_000);
                    const bonus = {
                      exp: 500,
                      funds: 20
                    };
                    await UserLevelsServices.addExp(bonus.exp, interaction.user.id);
                    await UserServices.addBalance(bonus.funds, interaction.user.id);
                    const bonusFunds = MathServices.displayCurrency(bonus.funds);
                    await interaction.followUp({
                      content: `You seem to be getting used to things. Good job.\n\n-# **+${bonus.exp} experience**\n-# **+${bonusFunds.funds} ${bonusFunds.units}**`
                    })
                  }

                  if (userExp.level_up) {
                  console.log('Work Barista Cmd - User Level Up:', userExp.level_up);
                    await wait(1_000);
                    await interaction.followUp({
                      content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${userExp.prev_level} to **Level ${userExp.level}**`
                    });
                    console.log('Work Barista Cmd: Level up.')
                  }
                }
                else if (customerOrder.acceptable_items.includes(selectedValue)) {
                  console.log('Work Barista Cmd - Selected Drink:', selectedValue);
                  const exp = 25;
                  const commission = 0;
                  const rewards = {
                    exp,
                    commission
                  }

                  const user = await UserLevelsServices.addExp(rewards.exp, interaction.user.id);

                  const results = {
                    ...keys,
                    outcome: 'acceptable'
                  }

                  await UserCustomerStatsServices.trackingUserToCustomerOrders(results);


                  await interaction.editReply({
                    content: `${customerDialogue.acceptable}\n\n-# **-${energyConsumed} energy**\n-# **+${rewards.exp} experience**`,
                    components: []
                  });
                  console.log('Work Barista Cmd: Order acceptable.');

                  if (user.level_up) {
                    await wait(1_000);
                    await interaction.followUp({
                      content: `*You suddenly feel wiser as though you understand a little bit more how this world turns.*\n\nLeveled up from Level ${user.prev_level} to **Level ${user.level}**`
                    });
                    console.log('Work Barista Cmd: Level up.')
                  }
                }
                else {
                  console.log('Work Barista Cmd - Selected Drink:', selectedValue);

                  const results = {
                    ...keys,
                    outcome: 'incorrect'
                  }

                  await UserCustomerStatsServices.trackingUserToCustomerOrders(results);

                  await interaction.editReply({
                    content: `${customerDialogue.incorrect}\n\n-# **-${energyConsumed} energy**`,
                    components: []
                  });
                  console.log('Work Barista Cmd: Order failed.');
                }
                return collector.stop('Work Barista Cmd: Work completed.');
              }
            }
          });
          collector.on('end', (collected, reason) => {
            if (reason === 'time') {
              console.log('Work Barista Cmd: Time limit reached.')
              return interaction.editReply({
                content: `*Your eyes hover over the customer's head as you stare into the Void.\n\nConfused, **${customer[relationshipStatus].name}** shakily turns around, regretting they chose this cafe.*`
              });
            }
          });
        }
        catch (e) {
          console.error('Work Barista Cmd: An unexpected error occurred:', e);
          return await interaction.editReply({
            content: `*A cat screeches and glass breaks behind the kitchen doors. **${FormatServices.capitalizeFirstLetter(customer[relationshipStatus].name)}**'s widened eyes glances to the kitchen doors and then curiously back at you.*\n\n**Customer**: Maybe I'll come back next time...`,
            components: [],
          });
        }
      }
    }
    catch (e) {
      console.error('Work Cmd Error:', e);
      return await interaction.editReply({
        content: `*A cat screeches and glass breaks behind the kitchen doors. The customer's widened eyes glances to the kitchen doors and then curiously back at you.*\n\n**Customer**: Maybe I'll come back next time...`,
        components: [],
      });
    }
  }
}
