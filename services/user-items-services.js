const { client } = require('../client.js');
const { Op, Users, UserItems } = require('../data/db-objects.js');
const userItemsCache = client.userItemsCache;

const UserItemsServices = {
  async getUserItems(...userIds) {
    //console.log('Get User Items - User Ids:', ...userIds);

    const usersNotInCache = [];
    //console.log('Get User Items - Users Not In Cache:', usersNotInCache);

    userIds.forEach(userId => {
      if (!userItemsCache.has(userId)) {
        usersNotInCache.push(userId);
      }
      //console.log('Get User Items - Cached User Items:', userItemsCache.get(userId));
    });

    if (usersNotInCache.length > 0) {
      const dbUserItems = await UserItems.findAll({
        where: { 
          user_id: {
            [Op.in]: usersNotInCache 
          }
        },
        include: ['kafeItem'],
      });
      //console.log('Get User Items - Database User Items:', dbUserItems);

      dbUserItems.forEach(userItem => {
        const userId = userItem.dataValues.user_id;

        if (!userItemsCache.has(userId)) {
          userItemsCache.set(userId, { items: [] });
        }
        userItemsCache.get(userId).items.push(userItem);
      });

      userIds.forEach(userId => {
        if (!userItemsCache.has(userId)) {
          userItemsCache.set(userId, { items: [] });
          //console.log('Get User Items - Cached User Items:', userItemsCache.get(userId));
        }
      });
    }

    if ( userIds.length > 1 ) {
      const cachedUsersItems = userIds.map(userId => userItemsCache.get(userId));
      return cachedUsersItems;
    }

    if ( userIds.length === 1 ) {
      const cachedItems = userItemsCache.get(userIds[0]);
      //console.log('Get User Items - Cached Items:', cachedItems);
      return cachedItems;
    }
  },

  async findItem(item) {
    const userItem = await UserItems.findOne({
      where: {
        [Op.or]: [
          { id: item },
          { name: item },
          { value: item }
        ]
      },
      include: ['kafeItem']
    });
    return userItem;
  },

  async addItems(item, quantity, userId) {
    const cachedItems = await this.getUserItems(userId);
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
          value: item.value,
          item_id: item.id,
          quantity: quantity,
        });

        console.log('User Items Add Items - UserId:', userId);
        console.log('User Items Add Items - Item Name:', item.name);
        console.log('User Items Add Items - Item Value:', item.value);
        console.log('User Items Add Items - Item Id:', item.id);
        console.log('User Items Add Items - Quantity:', quantity);

        newUserItems = await this.findItem(item.value);
        console.log('User Items Add Items - New User Items:', newUserItems);
        const cachedItems = userItemsCache.get(userId);
        cachedItems.items.push(newUserItems);

        return {
          user: newUserItems.user_id,
          item_name: newUserItems.name,
          item_value: newUserItems.value,
          item_quantity: newUserItems.quantity
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  },

  async removeItems(item, quantity ,userId) {
    const cachedItems = await this.getUserItems(userId);
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
