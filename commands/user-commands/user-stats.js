import { logger } from '../../logger.js';
import { SlashCommandBuilder } from 'discord.js';
import { 
  UserServices, 
  StatsServices,
  MathServices,
  FormatServices,
  ErrorServices,
  CacheServices,
  JsonSearchServices
} from '../../services/all-services.js';

export default {
  cooldowns: 5,
  data: new SlashCommandBuilder()
    .setName('user-stats')
    .setDescription('Display user stats.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('level')
        .setDescription('Display user level.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('energy')
        .setDescription('Display user energy.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('balance')
        .setDescription('Display user balance.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('barista')
        .setDescription('Display user barista stats.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
        .addStringOption(option =>
          option
            .setName('customer')
            .setDescription('Input customer name.')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('janken')
        .setDescription('Display user rock paper scissors stats.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
        .addStringOption(option =>
          option
            .setName('npc')
            .setDescription('Input npc name.')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('fate')
        .setDescription('Display user fate stats.')
        .addUserOption(option =>
          option
          .setName('user')
          .setDescription('Input username')
        )
    ),

  async execute(interaction) {
    const commandName = `UserStatsCommand`;
    let user;
    user = interaction.options.getUser('user') ?? interaction.user;
    const subcommand = interaction.options.getSubcommand();
    let subcommandName;

    try {
      if (subcommand === 'level') {
        try {
          subcommandName = `${commandName}.Level`;
          const userInstance = await UserServices.getLevel(user.id);
          const userLevelDataValues = userInstance.dataValues;

          const userLevelInfo = [];

          const excludedFields = ['id', 'level_up', 'prev_exp_req', 'updatedAt', 'createdAt'];

          for (let [field, value] of Object.entries(userLevelDataValues)) {
            if (!excludedFields.includes(field)) {
              userLevelInfo.push(`${FormatServices.nameFormatter(field, '_')}: ${value}`);
            }
          };

          if (user === interaction.user) {
            await interaction.reply({
              content: `**Your current Level and Exp stats:**\n${userLevelInfo.join('\n')}`
            });
            return console.log(`${user.id} (Interaction User) level stats displayed.`);
          }

          await interaction.reply({
            content: `**${user.username}'s current Level and Exp stats:**\n${userLevelInfo.join('\n')}`,
          });
          return console.log(`${user.id} level stats displayed.`);
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
        }
      }
      if (subcommand === 'energy') {
        subcommandName = `${commandName}.Energy`;
        try {
          const current = await UserServices.getEnergy(user.id);

          const isSelf = user === interaction.user;
          const maxEnergy = current.energy >= current.max_energy;
          const minEnergy = current.energy <= current.min_energy;
          const somewhereInTheMiddle = !maxEnergy && !minEnergy;

          if (maxEnergy) {
            logger.log(`[LOG] ${subcommandName}: User ${user.id} is at max ${current.energy} energy.`);
            if (isSelf) {
              return interaction.reply({
                content: `You have max **${current.energy} energy**. Why don't you go do something?`
              });
            }
            return interaction.reply({
              content: `**${user.username}** has **${current.energy} energy**. Be careful with that one.`
            });
          } if (somewhereInTheMiddle) {
            logger.log(`[LOG] ${subcommandName}: User ${user.id}'s energy level is somewhere in the middle. They have ${current.energy} energy.`);
            if (isSelf) {
              return interaction.reply({
                content: `You have **${current.energy} energy**. Working hard?`
              });
            }
            return interaction.reply({
              content: `**${user.username}** has **${current.energy} energy**. They are surviving.`
            });
          } if (minEnergy) {
            logger.log(`[LOG] ${subcommandName}: User ${user.id} is at or below min ${current.energy} energy.`);
            if (isSelf) {
              return interaction.reply({
                content: `You have **${current.energy} energy**. A..are you still alive?`
              });
            }
            return interaction.reply({
              content: `**${user.username}** has **${current.energy} energy**. Are they still alive?`
            });
          }
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
        }
      }
      if (subcommand === 'balance') {
        subcommandName = `${commandName}.Balance`;
        try {
          logger.debug(`${subcommandName} User:`, user.id);
          const userInfo = await UserServices.getBalance(user.id);
          logger.debug(`${subcommandName} Balance:`, userInfo.balance);
          const userFunds = MathServices.displayCurrency(userInfo.balance);

          if (user === interaction.user) {
            if (userInfo.balance < 10) {
              const pityChances = [5, 1, .50, .25];
              const thresholds = [.001, .25, .50, 1];
              const chance = Math.random();
              logger.debug(`${subcommandName} Chance:`, (chance * 100));
              const selection = thresholds.findIndex(threshold => chance < threshold);
              logger.debug(`${subcommandName} Selection:`, selection);
              let pity = pityChances[selection];
              logger.debug(`${subcommandName} Pity:`, pity);
              const salt = pity === 1 ? 'is' : 'are';
              const pepper = pity === 1 ? 'It' : 'They';
              const result = await UserServices.addBalance(user.id, pity);


              const pityFunds = MathServices.displayCurrency(pity);
              logger.debug(`${subcommandName} Pity:`, pityFunds.amount, pityFunds.units);

              const prevBalance = MathServices.displayCurrency(result.prev_balance);
              logger.debug(`${subcommandName} Prev Balance:`, prevBalance.amount, prevBalance.units);

              const newBalance = MathServices.displayCurrency(result.userBalance.balance);
              logger.debug(`${subcommandName} New Balance:`, newBalance.amount, newBalance.units);

              return interaction.reply({
                content: `Current Balance: **${prevBalance.amount} ${prevBalance.units}**\nWater Allowance: **${userInfo.water_allowance}**\n\nYou good? *The bot beeps in pity.* Here ${salt} **${pityFunds.amount} ${pityFunds.units}**. ${pepper} ${salt} the most I can spare right now.\n\nYour New Balance: **${newBalance.amount} ${newBalance.units}**`
              });
            }
            return interaction.reply({
              content: `You have **${userFunds.amount} ${userFunds.units}** and **${userInfo.water_allowance} water allowance**.`
            });
          }
          return interaction.reply({
            content: `**${user.username}** has **${userFunds.amount} ${userFunds.units}**.`
          });
        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
        }
      }

      if (subcommand === 'barista') {
        const subcommandName = `${commandName}.Barista`;

        if (!interaction.options.getString('customer')) {
          const baristaInstance = await StatsServices.getBaristaStats(user.id);
          logger.debug(`[DEBUG] ${subcommandName} Instance:`, baristaInstance);
          const baristaDataValues = baristaInstance.dataValues;
          logger.debug(`[DEBUG] ${subcommandName} Data Values:`, baristaDataValues);

          const userBaristaStatsInfo = [];

          const excludedFields = ['id', 'updatedAt', 'createdAt'];

          for (let [field, value] of Object.entries(baristaDataValues)) {
            if (!excludedFields.includes(field)) {
              userBaristaStatsInfo.push(`${FormatServices.nameFormatter(field, '_')}: ${value}`);
            }
          };

          if (user === interaction.user) {
            logger.debug(`[DEBUG] Displaying ${user.id} (Interaction User) barista stats.`);
            return await interaction.reply({
              content: `**Your current stats at this establishment:**\n${userBaristaStatsInfo.join('\n')}`
            });
          }

          logger.debug(`[DEBUG] Displaying ${user.id} barista stats.`);
          return await interaction.reply({
            content: `**${user.username}'s current stats at this establishment:**\n${userBaristaStatsInfo.join('\n')}`,
          });
        }

        const customerInteractionString = interaction.options.getString('customer').toLowerCase();
        const { success: customerFound, found: customer } = await JsonSearchServices.findNpc(customerInteractionString);
        //logger.debug(`[DEBUG] ${subcommandName} Customer:`, customer);

        if (!customerFound) {
          logger.debug(`[DEBUG] ${user.id} inputted invalid customer: '${customerInteractionString}'.`);
          return await interaction.reply({
            content: `"${customerInteractionString}" does not exist. Are you seeing ghosts?`
          });
        }

        const composite = {
          theKey: FormatServices.generateCompositeKey(user.id, customer.id),
          key1: {
            id: user.id,
            name: 'user_id'
          },
          key2: {
            id: customer.id,
            name: 'npc_id'
          },
        }

        const relationshipComposite = {
          ...composite,
          targetModel: 'UserNpcRelationship'
        }
        const relationshipInstance = await CacheServices.getOrSetCompositeCacheEntry(relationshipComposite);

        if (relationshipInstance.relationship_level === 'stranger') {
          logger.debug(`[DEBUG] ${user.id} is not close enough with: '${customer.name}'.`);
          return await interaction.reply({
            content: `It appears you and **${customer.descriptive_name}** are not close enough.`
          });
        }

        const relationshipDataValues = Object.entries(relationshipInstance.dataValues);

        const statsComposite = {
          ...composite,
          targetModel: 'UserNpccustomerOrders'
        }
        const statsInstance = await CacheServices.getOrSetCompositeCacheEntry(statsComposite);
        const statsDataValues = Object.entries(statsInstance.dataValues);

        const userCustomerStatsInfo = [];

        const excludedFields = ['id', 'user_id', 'customer_id', 'updatedAt', 'createdAt'];

        statsDataValues.forEach(([field, value]) => {
          if (!excludedFields.includes(field)) {
            userCustomerStatsInfo.push(`${FormatServices.nameFormatter(field, '_')}: ${value}`);
          }
        });

        if (user === interaction.user) {
          logger.debug(`[DEBUG] Displaying ${user.id} (Interaction User) customer relationship stats.`);
          return await interaction.reply({
            content: `**Your current relationship with ${customer.name}:**\nRelationship Level: ${relationshipDataValues.relationship_level}\n${userCustomerStatsInfo.join('\n')}`
          });
        }

        logger.debug(`[DEBUG] Displaying ${user.id} customer relationship stats.`);
        return await interaction.reply({
          content: `**${user.username}'s current relationship with ${customer.name}:**\nRelationship Level: ${relationshipDataValues.relationship_level}\n${userCustomerStatsInfo.join('\n')}`,
        });
      }

      if (subcommand === 'janken') {
        const subcommandName = `${commandName}.jankenSubCmd`;
        let npc;
        let instance;

        const npcInteractionString = interaction.options.getString('npc');

        if (npcInteractionString) {
          const npcExists = await JsonSearchServices.findNpc(npcInteractionString.toLowerCase());
          if (!npcExists.success) {
            logger.debug(`[DEBUG] ${subcommandName}: '${npcInteractionString}' does not exist.`);
            return await interaction.reply({
              content: `"${npcInteractionString}" does not exists. Are you remembering ghosts?`
            });
          } else {
            npc = npcExists.found;
          }

          const keys = {
            theKey: FormatServices.generateCompositeKey(user.id, npc.id),
            key1: {
              id: user.id,
              name: 'user_id'
            },
            key2: {
              id: npc.id,
              name: 'npc_id'
            }
          }

          if (npc.success && npc.name !== 'kapé') {
            const relationshipComposite = {
              targetModel: 'UserNpcRelationship',
              ...keys,
            }

            const userCustomer = await CacheServices.getOrSetCompositeCacheEntry(relationshipComposite);

            if (userCustomer.relationship_level === 'stranger') {
              logger.log(`[DEBUG] ${subcommandName} : ${user.id} is not close enough with '${npc.name}'.`);
              return await interaction.reply({
                content: `It appears you and the **${npc.descriptive_name}** are not close enough.`
              });
            }
          } else if (npc.name === 'kapé') {
            const jankenComposite = {
              targetModel: 'UserNpcJankenStats',
              ...keys,
            }
            instance = await CacheServices.getOrSetCompositeCacheEntry(jankenComposite);
          }
        } else {
          const userJanken = {
            id: user.id,
            targetModel: 'JankenStats'
          }
          instance = await CacheServices.getOrSetCacheEntry(userJanken);

        }

        const dataValues = Object.entries(instance.dataValues);
        const stats = [];

        const excludedFields = ['id', 'user_id', 'npc_id', 'composite_key', 'updatedAt', 'createdAt'];

        dataValues.forEach(([key, value]) => {
          if (!excludedFields.includes(key)) {
            stats.push(`${FormatServices.nameFormatter(key, '_')}: ${value}`);
          }
        });

        //console.log('User Stats Janken Cmd - Stats:', stats);
        //console.log('User Stats Janken Cmd - NPC:', npc);

        const displayedName = npc ? FormatServices.nameFormatter(npc.name, ' ') : 'The World';

        logger.debug(`[DEBUG] ${subcommandName}: Displaying '${user.id}' stats with '${displayedName}'`);
        return await interaction.reply({
          content: `__**Rock Paper Scissors Against ${displayedName}**__\n${stats.join('\n')}`
        });
      }

      if (subcommand === 'fate') {
        subcommandName = `${commandName}.Fate`;

        try {

        } catch (e) {
          ErrorServices.handleError(subcommandName, e);
          return await interaction.reply({
            content: `Fate is having trouble pulling up your records. Do you exist?`
          });
        }

        const userEntity = {
          targetModel: 'FateStats',
          id: user.id
        };
        const cachedUser = await CacheServices.getOrSetCacheEntry(userEntity);
        const dataValues = Object.entries(cachedUser.dataValues);

        const stats = [];

        const excludedFields = ['id', 'createdAt', 'updatedAt'];

        dataValues.forEach(([key, value]) => {
          if (!excludedFields.includes(key)) {
            stats.push(`${FormatServices.nameFormatter(key, '_')}: ${value}`);
          }
        });

        logger.debug(`[DEBUG] ${subcommandName} Stats:`, stats);

        return await interaction.reply({
          content: `__**Points Against Fate**__\n${stats.join('\n')}`,
        });
      }
    }
    catch (e) {
      ErrorServices.handleError(commandName, e);
      return await interaction.reply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*`,
        components: [],
      });
    }
  }
}
