import { logger } from '../../logger.js';
import { setTimeout } from 'node:timers/promises';
import { SlashCommandBuilder, Collection } from 'discord.js';
import { client } from '../../client.js';
import * as Models from '../../models/models-barrel.js';
import {
  CacheServices,
  UserServices,
  UserItemsServices,
  InventoryServices,
  StatsServices,
  MathServices,
  FormatServices,
  ErrorServices,
  ValidationServices,
  MutexServices
} from '../../services/all-services.js';
import { CronServices, cronJobs } from '../../cron/cron.js';
import { BalanceServices } from '../../services/balance-services.js';

export default {
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the barista.'),

  async execute(interaction) {
    const commandName = 'Ping Cmd';
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const exampleUsers = ['456', '789'];
    exampleUsers.push(interaction.user.id);
    const userId1 = interaction.user.id;
    const userId2 = '763074931021316136';

    const key1 = {
      id: userId1,
      name: 'user_id'
    }

    const key2 = {
      id: 1,
      name: 'customer_id'
    }

    try {
      //await ErrorServices.validateDatabase('Users', userId1);
      //const item1 = await SearchServices.findItem('Supplies', 1);
      //const item2 = await SearchServices.findItem('Supplies', 2);
      //const item3 = await SearchServices.findItem('Supplies', 3);
      //const item4 = await SearchServices.findItem('Supplies', 4);
      //const item8 = await SearchServices.findItem('Supplies', 8);
      //logger.log(`${commandName} Supply Item 1:`, item1);
      //
      ////await InventoryServices.transferItemsToUser('Supplies', 16, 5, userId1);
      ////const user1Supplies = await UserKafeSupplies.findAll();
      ////logger.log(user1Supplies);
      //
      //const createdUserItem = await UserKafeSupplies.create({
      //  user_id: userId1,
      //  item_id: item1.item_id,
      //  quantity: 1,
      //  amount: item1.amount,
      //  max_amount: item1.max_amount,
      //  type: item1.type
      //});
      //
      //logger.log(`${commandName} Created User Item:`, createdUserItem);
      //
      //const newUserItem = await UserKafeSupplies.findOne({
      //  where: {
      //    user_id: userId1,
      //    item_id: item1.item_id
      //  },
      //  include: [{
      //    model: Supplies,
      //    as: 'Supplies'
      //  }],
      //});
      //
      //logger.log(`${commandName} New User Item:`, newUserItem);
      //logger.log(`${commandName} New User Item Supplies:`, newUserItem.Supplies);


      //await InventoryServices.addItemsToUser('UserKafeSupplies', item1, 2, userId1);
      //await InventoryServices.addItemsToUser('UserKafeSupplies', item2, 2, userId1);
      //await InventoryServices.addItemsToUser('UserKafeSupplies', item3, 2, userId1);
      //await InventoryServices.addItemsToUser('UserKafeSupplies', item4, 2, userId1);
      //await InventoryServices.addItemsToUser('UserKafeSupplies', item8, 2, userId1);

      //const kafeItemsCreatedArr = [];
      //for (let i = 0; i < 15; i++) {
      //  const kafeItem1 = await InventoryServices.createKafeOrder(userId1, 12);
      //  kafeItemsCreatedArr.push(kafeItem1.item.name);
      //}
      //const kafeItem1 = await InventoryServices.createKafeOrder(userId1, 12);
      //kafeItemsCreatedArr.push(kafeItem1.item.name);
      //const kafeItem2 = await InventoryServices.createKafeOrder(userId1, 11);
      //kafeItemsCreatedArr.push(kafeItem2.item.name);
      //await InventoryServices.createKafeOrder(userId1, 15);

      function countKafeItems(arr) {
        const count = {};
        for (let a of arr) {
          count[a] = (count[a] || 0) + 1;
        //console.log('Name:', a);
        //console.log('Value:', count[a]);
        }
        //console.log('Count:', count);
        return count;
      }

      //const allKafeItemsCreated = countKafeItems(kafeItemsCreatedArr);
      //const allKafeItemsCreatedArr = [];
      //for (let [name, count] of Object.entries(allKafeItemsCreated)) {
      //  console.log('Name:', name);
      //  console.log('Count:', count);
      //  allKafeItemsCreatedArr.push(`${name}: ${count}`);
      //}

      //const userItems = await SearchServices.findUserWithItems('UserKafeSupplies', userId1);
      //console.log(`${commandName} User Items:`, userItems);
      //console.log(`${commandName} User Items Items:`, userItems.items);

      //const userItemsArr = [];
      //userItems.items.forEach(item => {
      //  //console.log(`${commandName} Item Data Values:`, item.dataValues);
      //  userItemsArr.push(`Item Name: ${FormatServices.nameFormatter(item.name, ' ')}\nItem Quantity: ${item.quantity}\nItem Amount: ${item.amount}\n`);
      //});
      //
      //return await interaction.reply({
      //  content: `Results:\n\n${allKafeItemsCreatedArr.join('\n')}\n\n${userItemsArr.join('\n')}`
      //});

      //const user = await UserServices.getBalance(userId1);
      //console.log(`${commandName} User 1:`, user);
      //await UserServices.transferFunds(50, userId1, userId2);
      //const users = await UserServices.transferFunds(105, userId1, userId2);
      //console.log(`${commandName} Users:`, users);
      //const user1 = users.user1.user;
      //const user2 = users.user2.user;
      //console.log(`${commandName} User 1:`, user1.balance);
      //console.log(`${commandName} User 2:`, user2.balance);

      //const user = await UserServices.subtractBalance(50, userId1);
      //console.log(`${commandName} user:`, user)

      //const transfer = await InventoryServices.transferItemsToUser('Supplies', 1, 5, 'UserKafeSupplies', userId1);
      //console.log(`[THIS ONE] ${commandName} TRANSFER COMPLETE:`, transfer);
      //console.log(`[THIS ONE] ${commandName} TRANSFER COMPLETE:`);
      //const SuppliesCache = client.cache['SuppliesCache'];
      //console.log(`${commandName} SuppliesCache:`, SuppliesCache);
      //console.log(`${commandName} SuppliesCache Item ID 1:`, SuppliesCache.get(1));
      ////console.log(`${commandName} transfer:`, transfer.reason);
      //const item = await SearchServices.findItem('Supplies', 1);
      //console.log(`${commandName} item.quantity:`, item.quantity);

      //const customer = await Models.Customers.findOne({
      //  where: {
      //    customer_id: 2
      //  }
      //});
      //console.log(customer);

      //await UserServices.advancedTransferFunds({
      //  sender: { table: 'UserBalance', user_id: userId1 },
      //  recipient: { table: 'UserKafeBalance', user_id: userId1 }
      //}, 1);

      //let mutex = {};
      //let testMutex0 = mutex['testMutex0'] = [];
      //let testMutex1 = mutex['testMutex1'] = [];
      //
      //testMutex0.push('test1');
      //testMutex0.push('test2');
      //testMutex1.push('test1');
      //testMutex1.push('test2');
      //
      //console.log(`${commandName} mutex:`, mutex);
      //
      //for (let [mutexes, maps] of Object.entries(mutex)) {
      //  console.log(`${commandName} mutexes:`, mutexes);
      //  maps.forEach(map => {
      //    console.log(`${commandName} map:`, map);
      //  });
      //}

      //const account1 = {
      //  model: 'UserBalance',
      //  id: userId1
      //};
      //
      //const account2 = {
      //  model: 'UserKafeBalance',
      //  id: userId1
      //};
      //
      //const transactingAccounts = {
      //  sender: account1,
      //  recipient: account2
      //}
      //
      ////const user2 = await UserServices.getEnergy(userId2);
      //const transaction = await BalanceServices.transfer(transactingAccounts, 50);
      //
      //console.log(`[TEST] ${commandName} transaction.success:`, transaction.success);
      //if (transaction.success) {
      //  console.log(`[TEST] ${commandName} userAccount1:`, transaction.sender.account.balance);
      //  console.log(`[TEST] ${commandName} userKafeAccount1:`, transaction.recipient.account.balance);
      //}
      //
      //const userAccount1 = await BalanceServices.get(account1);
      //const userKafeAccount1 = await BalanceServices.get(account2);
      //console.log(`[TEST] ${commandName} userAccount1:`, userAccount1.balance);
      //console.log(`[TEST] ${commandName} userKafeAccount1:`, userKafeAccount1.balance);

      async function doSomething() {
        const mutexName = 'SuppliesMutexes';
        const testMutex = MutexServices.getOrSetMutex(1, mutexName);
        const testRelease = await testMutex.acquire();
        setTimeout(() => {
          testRelease();
        }, 2000);
        await InventoryServices.refreshSupplies();

        await new Promise((resolve) => setTimeout(resolve, 3000))

        console.log(`[TEST] this is the last message.`)

        return { success: true };
      }

      const test = doSomething();
      await test;
      console.log(`[TEST] test:`, test.success);

      //const mutexName = 'SuppliesMutexes';
      //const testMutex = MutexServices.getOrSetMutex(1, mutexName);
      //const testRelease = await testMutex.acquire();
      //await testRelease();
      //await InventoryServices.refreshSupplies();

      return await interaction.reply({
        content: `Bleh`
      });

    } catch (e) {
      logger.error('Ping Error:', e);
    }

    //await interaction.reply({
    //  content: `Hello. Welcome to Kapé Kafe. We are currently running *tests*. Don't worry about it.\n*A cat deathly screeches in the kitchen.*`
    //});
  }
}
