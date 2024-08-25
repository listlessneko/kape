const path = require('node:path');
const { UserContextMenuCommandInteraction } = require('discord.js');
const { MathServices } = require(path.join(__dirname, 'math-services.js'));
const { Op, Users, UserItems } = require(path.join(__dirname, '..', 'data', 'db-objects.js'));
//const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'));
const { client } = require(path.join(__dirname, '..', 'client.js'));
const userItemsCache = client.userItemsCache;

const UserItemsServices = {
  async getUserItems(options = {}, ...userIds) {
    const { requestModelInstance = false } = options;

    const usersInCache = [];
    const usersNotInCache = [];

    userIds.forEach(userId => {
      if ( userItemsCache.has(userId) ) {
        usersInCache.push(userId);
      }
      else {
        usersNotInCache.push(userId);
      }
    });

    if ( usersNotInCache.length > 0 ) {
      const dbUserItems = await UserItems.findAll({
        where: { 
          user_id: {
            [Op.in]: usersNotInCache 
          }
        },
        include: ['kafeItem'],
      });

      dbUserItems.forEach(userItem => {
        const userId = userItem.dataValues.user_id;

        if ( !userItemsCache.has(userId) ) {
          userItemsCache.set(userId, { items: [] });
        }
        userItemsCache.get(userId).items.push(userItem);
      });

      userIds.forEach(userId => {
        if ( !userItemsCache.has(userId) ) {
          userItemsCache.set(userId, { items: [] });
        }
      });
    }

    if ( requestModelInstance ) {
      if ( userIds.length === 1 ) {
        const userCachedItems = userItemsCache.get(userIds[0]);
        return userCachedItems;
      }

      if ( userIds.length > 1 ) {
        const cachedUsersItems = usersWithItems.map(user => userItemsCache.get(user));
        return cachedUsersItems;
      }
    }

    if ( userIds.length === 1 ) {
      const cachedItems = userItemsCache.get(userIds[0]);
      const userItemsInventory = cachedItems.items.map(item => item.dataValues);
      return userItemsInventory;
    }

    else {
      const cachedUsersItems = userIds.map(userId => {
        const cachedItems = userItemsCache.get(userId);
        const userItemsInventory = cachedItems.items.map(item => item.dataValues);
        return {
          user_id: userId,
          items: userItemsInventory
        }
      });

      const usersItemsInventory = cachedUsersItems.reduce((acc, user) => {
        acc[user.user_id] = {...user};
        return acc;
      }, {});

      return usersItemsInventory;
    }
  },

  async findItem(item) {
    const userItem = await UserItems.findOne({
      where: {
        item_id: item
      },
      include: ['kafeItem']
    });
    return userItem;
  },

  async addItems(item, quantity, userId) {
    const cachedItems = await this.getUserItems({ requestModelInstance: true }, userId);
    const userItem = cachedItems.items.find(cachedItem => cachedItem.dataValues.item_id === item.id);

    try { 
      if (userItem) {
        const prev_quantity = userItem.quantity;
        userItem.quantity += quantity;
        await userItem.save();
        return {
          user: userItem.user_id,
          item_name: userItem.name,
          prev_quantity,
          new_quantity: userItem.quantity
        }
      } 

      else {
        let newUserItems = await UserItems.create({
          user_id: userId,
          name: item.name,
          item_id: item.id,
          quantity: quantity,
        });

        newUserItems = await this.findItem(newUserItems.item_id);
        const cachedItems = userItemsCache.get(userId);
        cachedItems.items.push(newUserItems);

        return {
          user: newUserItems.user_id,
          item_name: newUserItems.name,
          item_quantity: newUserItems.quantity
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  },

  async removeItems(item, quantity ,userId) {
    const cachedItems = await this.getUserItems({ requestModelInstance: true }, userId);
    const userItem = cachedItems.items.find(cachedItem => cachedItem.dataValues.item_id === item.id);

    if (userItem) {
      const prev_quantity = userItem.quantity;
      userItem.quantity -= quantity;

      if (userItem.quantity <= 0) {
        await UserItems.destroy({
          where: {
            user_id: userId,
            item_id: item.id
          }
        });

        const cachedItems = userItemsCache.get(userId);
        cachedItems.items = cachedItems.items.filter(cachedItem => cachedItem.item_id !== item.id);
      }

      await userItem.save();
      return {
        item_name: userItem.name, 
        prev_quantity,
        item_quantity: userItem.quantity
      }
    }

    else {
      console.log(`${userId} does not have ${item.name} in their inventory.`);
      return;
    }
  },
}

module.exports = {
  UserItemsServices
}
