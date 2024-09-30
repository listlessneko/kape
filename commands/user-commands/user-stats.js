const { SlashCommandBuilder } = require('discord.js');
const { 
  UserServices, 
  UserLevelsServices,
  UserItemsServices,
  CustomerServices,
  UserCustomerStatsServices,
  ScoresServices,
  MathServices,
  FormatServices,
  NpcServices
} = require('../../services/all-services');
const { UserBaristaStats, UserCustomerStats } = require('../../data/db-objects');

module.exports = {
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
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'level') {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const userInstance = await UserLevelsServices.checkLevel(user.id);
        console.log('Levels Stats Cmd - User Instance:', userInstance);
        const userLevelDataValues = Object.entries(userInstance);
        console.log('Levels Stats Cmd - User Data Values:', userLevelDataValues);

        const userLevelInfo = [];

        const excludedFields = ['user_id', 'level_up', 'prev_exp_req'];

        userLevelDataValues.forEach(([field, value]) => {
          if (!excludedFields.includes(field)) {
            userLevelInfo.push(`${FormatServices.nameFormatter(field)}: ${value}`);
          }
        });

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
      }

      if (subcommand === 'energy') {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const currentEnergy = await UserServices.getUsers(user.id);

        if (user === interaction.user) {
          if (currentEnergy.max_energy) {
            return interaction.reply({
              content: `You have max **${currentEnergy.energy} energy**. Why don't you go do something?`
            });
          }
          if (currentEnergy.energy < 100 && currentEnergy.energy > 0) {
            return interaction.reply({
              content: `You have **${currentEnergy.energy} energy**. Working hard?`
            });
          }
          else if (currentEnergy.energy <= 0) {
            return interaction.reply({
              content: `You have **${currentEnergy.energy} energy**. A..are you still alive?`
            });
          }
        }
        else {
          if (currentEnergy.max_energy) {
            return interaction.reply({
              content: `**${user.username}** has **${currentEnergy.energy} energy**. Be careful with that one.`
            });
          }
          if (currentEnergy.energy < 100 && currentEnergy.energy > 0) {
            return interaction.reply({
              content: `**${user.username}** has **${currentEnergy.energy} energy**. They are surviving.`
            });
          }
          else if (currentEnergy.energy <= 0) {
            return interaction.reply({
              content: `**${user.username}** has **${currentEnergy.energy} energy**. Perhaps they are dead now.`
            });
          }
        }
      }

      if (subcommand === 'balance') {
        const user = interaction.options.getUser('user') ?? interaction.user;
        console.log('Balance Cmd - User:', user.id);
        const userInfo = await UserServices.getUsers(user.id);
        console.log('Balance Cmd - Balance:', userInfo.balance);
        const units = FormatServices.determineUnits(userInfo.balance);
        console.log('Balance Cmd - Balance (Units):', units);
        const balance = MathServices.wholeNumber(userInfo.balance);
        console.log('Balance Cmd - Balance (Whole Number):', balance);

        if (user === interaction.user) {
          if (userInfo.balance < 10) {
            const pityChances = [5, 1, .50, .25];
            const thresholds = [.001, .25, .50, 1];
            const chance = Math.random();
            console.log('Balance Cmd - Chance:', (chance * 100));
            const selection = thresholds.findIndex(threshold => chance < threshold);
            console.log('Balance Cmd - Selection:', selection);
            let pity = pityChances[selection];
            console.log('Balance Cmd - Pity:', pity);
            const result = await UserServices.addBalance(pity, user.id);

            const pityUnits = FormatServices.determineUnits(pity);
            console.log('Balance Cmd - Pity (Units):', pityUnits);
            pity = await MathServices.wholeNumber(pity);
            console.log('Balance Cmd - Pity (Whole Number):', pity);

            const prev_balanceUnits = FormatServices.determineUnits(result.prev_balance);
            console.log('Balance Cmd - Prev Balance (Units):', prev_balanceUnits);
            const prev_balance = await MathServices.wholeNumber(result.prev_balance);
            console.log('Balance Cmd - Prev Balance (Whole Number):', prev_balance);
            const new_balanceUnits = FormatServices.determineUnits(result.new_balance);
            console.log('Balance Cmd - New Balance (Units):', new_balanceUnits);
            const new_balance = await MathServices.wholeNumber(result.new_balance);
            console.log('Balance Cmd - New Balance (Whole NUmber):', new_balance);

            return interaction.reply({
              content: `You have **${prev_balance} ${prev_balanceUnits}**.\nYou good? *The bot beeps in pity.* Here is **${pity} ${pityUnits}**. It is the most I can spare right now.\nYour New Balance: **${new_balance} ${new_balanceUnits}**`
            });
          }
          return interaction.reply({
            content: `You have **${balance} ${units}**.`
          });
        }
        return interaction.reply({
          content: `**${user.username}** has **${balance} ${units}**.`
        });
      }

      if (subcommand === 'barista') {
        const user = interaction.options.getUser('user') ?? interaction.user;

        if (!interaction.options.getString('customer')) {
          const instance = await UserCustomerStatsServices.getUsersBaristaStats(user.id);
          console.log('Barista Stats Cmd - Instance:', instance);
          const dataValues = Object.entries(instance.get());
          console.log('Barista Stats Cmd - Data Values:', dataValues);

          const userBaristaStatsInfo = [];

          const excludedFields = ['user_id'];

          dataValues.forEach(([field, value]) => {
            if (!excludedFields.includes(field)) {
              userBaristaStatsInfo.push(`${FormatServices.nameFormatter(field)}: ${value}`);
            }
          });

          if (user === interaction.user) {
            await interaction.reply({
              content: `**Your current stats at this establishment:**\n${userBaristaStatsInfo.join('\n')}`
            });
            return console.log(`${user.id} (Interaction User) barista stats displayed.`);
          }

          await interaction.reply({
            content: `**${user.username}'s current stats at this establishment:**\n${userBaristaStatsInfo.join('\n')}`,
          });
          return console.log(`${user.id} barista stats displayed.`);
        }

        const customerInteractionString = interaction.options.getString('customer').toLowerCase();
        const customer = await CustomerServices.findCustomer(customerInteractionString);
        //console.log('User Stats - Customer:', customer);

        if (!customer) {
          await interaction.reply({
            content: `"${customerInteractionString}" does not exist. Are you seeing ghosts?`
          });
          return console.log(`${user.id} inputted invalid customer: '${customerInteractionString}'.`)
        }

        const key1 = {
          id: user.id,
          name: 'user_id'
        };

        const key2 = {
          id: customer.customer_id,
          name: 'customer_id'
        };
        
        //console.log('User Stats - Key 2:', key2);

        const instance = await UserCustomerStatsServices.getUsersCustomerStats(key1, key2);

        if (instance.relationship_level === 'stranger') {
          await interaction.reply({
            content: `It appears you and **${customer.descriptive_name}** are not close enough.`
          });
          return console.log(`${user.id} is not close enough with: '${customer.name}'.`)
        }

        const dataValues = Object.entries(instance.get());

        const userCustomerStatsInfo = [];

        const excludedFields = ['composite_key', 'user_id', 'customer_id'];

        dataValues.forEach(([field, value]) => {
          if (!excludedFields.includes(field)) {
            userCustomerStatsInfo.push(`${FormatServices.nameFormatter(field)}: ${value}`);
          }
        });

        if (user === interaction.user) {
          await interaction.reply({
            content: `**Your current relationship with ${customer.name}:**\n${userCustomerStatsInfo.join('\n')}`
          });
          return console.log(`${user.id} (Interaction User) customer relationship stats displayed.`);
        }

        await interaction.reply({
          content: `**${user.username}'s current relationship with ${customer.name}:**\n${userCustomerStatsInfo.join('\n')}`,
        });
        return console.log(`${user.id} customer relationship stats displayed.`);
      }

      if (subcommand === 'janken') {
        const user = interaction.options.getUser('user') ?? interaction.user;
        let npc;
        let instance;

        const npcInteractionString = interaction.options.getString('npc');

        if (npcInteractionString) {
          npc = await NpcServices.findNpc(npcInteractionString.toLowerCase());
          if (!npc) {
            await interaction.reply({
              content: `"${npcInteractionString}" does not exists. Are you remembering ghosts?`
            });
            console.log(`User Stats Janken Cmd: ${npcInteractionString} does not exist.`)
          }

          const keys = {
            key1: {
              id: user.id,
              name: 'user_id'
            },
            key2: {
              id: npc.npc_id,
              name: 'npc_id'
            }
          }

          if (npc.name !== 'kapé') {
            const customer = await CustomerServices.findCustomer(npcInteractionString);
            const customerKeys = {
              id: customer.customer_id,
              name: 'customer_id'
            }

            const userCustomer = await UserCustomerStatsServices.getUsersCustomerStats(keys.key1, customerKeys)

            if (userCustomer.relationship_level === 'stranger') {
              await interaction.reply({
                content: `It appears you and **${customer.descriptive_name}** are not close enough.`
              });
              console.log(`User Stats Janken Cmd: ${user.id} is not close enough with '${customer.name}'.`)
            }
          }
          instance = await ScoresServices.getUserNpcJankenStats(keys.key1, keys.key2);
        }
        else {
          instance = await ScoresServices.getJankenStats(user.id);

        }

        const dataValues = Object.entries(instance.dataValues);
        const stats = [];

        const excludedKeys = ['id', 'user_id', 'npc_id', 'composite_key'];

        dataValues.forEach(([key, value]) => {
          if (!excludedKeys.includes(key)) {
            stats.push(`${FormatServices.nameFormatter(key)}: ${value}`);
          }
        });

        //console.log('User Stats Janken Cmd - Stats:', stats);
        //console.log('User Stats Janken Cmd - NPC:', npc);

        const displayedName = npc ? FormatServices.nameFormatter(npc.name) : 'The World';

        return await interaction.reply({
          content: `__**Rock Paper Scissors Against ${displayedName}**__\n${stats.join('\n')}`
        });
      }

      if (subcommand === 'fate') {
        const user = interaction.options.getUser('user') ?? interaction.user.id;
        const instance = await ScoresServices.getFateScores(user);
        const dataValues = Object.entries(instance.dataValues);

        const points = [];

        const excludedKeys = ['id', 'user_id', 'createdAt', 'updatedAt'];

        dataValues.forEach(([key, value]) => {
          if (!excludedKeys.includes(key)) {
            points.push(`${FormatServices.nameFormatter(key)}: ${value}`);
          }
        });

        console.log('User Stats Fate - Points:', points);

        return await interaction.reply({
          content: `__**Points Against Fate**__\n${points.join('\n')}`,
        });
      }
    }
    catch (e) {
      console.error('User Stats Cmd Error:', e);
      return await interaction.reply({
        content: `*A cat screeches and glass breaks behind the kitchen doors.*`,
        components: [],
      });
    }
  }
}
