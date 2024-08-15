const path = require('node:path');
const { UserContextMenuCommandInteraction } = require('discord.js');
const { MathServices } = require(path.join(__dirname, 'math-services.js'));
const { Op, Users, UserItems } = require(path.join(__dirname, '..', 'data', 'db-objects.js'));
//const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'));
const { client } = require(path.join(__dirname, '..', 'client.js'));
const usersCache = client.usersCache;

const UserServices = {
  async getUsers(...userIds) {

    const usersNotInCache = userIds
      .filter(userId => usersCache.get(userId) === undefined);

    if (usersNotInCache) {
      const db = await Users.findAll({
        where: {
          user_id: {
            [Op.in]: usersNotInCache
          }
        }
      });

      const usersInDatabase = db
        .map(user => user.dataValues.user_id);
      db.forEach(userId => {
        usersCache.set(userId.user_id, userId.dataValues)
      });

      const usersNotRecorded = userIds
        .filter(userId => !usersInDatabase.includes(userId) && usersNotInCache.includes(userId));

      if (usersNotRecorded.length > 0) {
        const formattedUsers = usersNotRecorded.map(userId => ({
          user_id: userId
        }));
        const newUsers = await Users.bulkCreate(formattedUsers);
        newUsers.forEach(userId => usersCache.set(userId.user_id, userId.dataValues));
      }
    }

    const allUsers = userIds.map(userId => usersCache.get(userId));
    console.log('Get User - All Users:', allUsers);
    return allUsers;
  },

  async getUserItems(userId) {
    return await UserItems.findAll({
      where: { user_id: userId },
      include: ['item'],
    });
  },

  async addItems(userId, item, amount) {
    const userItem = await UserItems.findOne({
      where: {
        [Op.and]: [
          {
            user_id: userId
          },
          {
            [Op.or]: {
              item_id: item,
              name: item,
              value: item
            }
          }
        ]
      },
    });

    if (userItem) {
      userItem.amount += amount;
      await userItem.save();
      return {
        item_name: userItem.name,
        item_amount: userItem.amount
      }
    }

     const newUserItems = await UserItems.create({
       user_id: userId,
       name: item.name,
       item_id: item.id,
       amount: amount,
       value: item.value,
       description: item.description,
       content: item.content,
       cost: item.cost,
       energy_replen: item.energy_replen,
       uses: item.uses,
       category: item.category,
       type: item.type
     });
      return {
        item_name: newUserItems.name,
        item_amount: newUserItems.amount
      }
  },

  async removeItems(userId, item, amount) {
    console.log(userId);
    console.log(item);
    const userItem = await UserItems.findOne({
      where: {
        [Op.and]: [
          {
            user_id: userId
          },
          {
            [Op.or]: {
              item_id: item,
              name: item,
              value: item
            }
          }
        ]
      },
    });

    if (userItem) {
      userItem.amount -= amount;
      await userItem.save();
      return {
        item_name: userItem.name, 
        item_amount: userItem.amount
      }
    }

    return false
  },

  async checkUserEnergy(userId) {
    let user = usersCache.get(userId);

    if (user) {
      return user;
    }

    user = await Users.findOne({
      where: {
        user_id: userId
      }
    });

    if (user) {
      usersCache.set(userId, user);
      return user;
    }

    const newUser = await Users.create({ 
      user_id: userId 
    });
    usersCache.set(userId, newUser);
    return newUser;
  },

  async getEnergy(userId) {
    const user = await this.checkUserEnergy(userId);
    return {
      user: userId,
      energy: user.energy,
      max: user.max_energy,
      min: user.min_energy
    };
  },

  async addEnergy(userId, amount) {
    const user = await this.checkUserEnergy(userId);

    if (user.energy >= 100) {
      console.log(`User ID: ${userId} is already at max (${user.energy}) energy.`)
      return {
        user: userId,
        energy: user.energy
      }
    }

    const result = await MathServices.addUpTo100(user.energy, amount);
    console.log('Add Energy:', result);

    user.energy = Number(result);

    if (result >= 100) {
      user.max_energy = true;
      user.min_energy = false;
    }
    else if (result < 100 && result > 0) {
      user.max_energy = false;
      user.min_energy = false;
    }
    else if (result ===  0) {
      user.max_energy = false;
      user.min_energy = true;
    }

    await user.save();
    usersCache.set(userId, user);
    return {
      user: userId,
      energy: user.energy,
    };
  },

  async removeEnergy(userId, amount) {
    const user = await this.checkUserEnergy(userId);

    const result = await MathServices.removeDownTo0(user.energy, amount);

    user.energy = Number(result);

    if (result >= 100) {
      user.max_energy = true;
      user.min_energy = false;
    }
    else if (result < 100 && result > 0) {
      user.max_energy = false;
      user.min_energy = false;
    }
    else if (result ===  0) {
      user.max_energy = false;
      user.min_energy = true;
    }

    await user.save();
    usersCache.set(userId, user);
    return {
      user: userId,
      energy: user.energy,
    };
  },

  async checkUserCurrency(userId) {
    let user = usersCache.get(userId);
      console.log('checkUserCurrency User:', user);
    //// is there a user? Yes, then this : No, then this
    //return user ? user.balance : 0;
    if (user) {
      console.log('checkUserCurrency In Cache:', usersCache);
      return user;
    }

    else {
      user = await Users.findOne({
        where: { user_id: userId }
      });
    }

    if (user) {
      usersCache.set(userId, user.dataValues);
      return user;
    }

    else {
      const newUser = await Users.create({ 
        user_id: userId, 
        balance: 0 
      });
      usersCache.set(userId, newUser.dataValues);
      console.log('checkUserCurrency Set Cache:', usersCache);
      return newUser;
    }
  },

  async getBalance(userId) {
    const user = await this.checkUserCurrency(userId);
      console.log('getBalance:', usersCache);
    return {
      user: userId,
      balance: user.balance
    };
  },

  async addBalance(userId, amount) {
    const user = await this.checkUserCurrency(userId);
    user.balance += Number(amount);
    await user.save();
    usersCache.set(userId, user);
    return {
      user_id: userId,
      balance: user.balance
    }
  },

  async subtractBalance(userId, amount) {
    const user = await this.checkUserCurrency(userId);
    user.balance -= Number(amount);
    await user.save();
    usersCache.set(userId, user);
    return {
      user_id: userId,
      balance: user.balance
    }
    //if (amount <= user.balance) {
    //  user.balance -= Number(amount);
    //  await user.save();
    //  usersCache.set(userId, user);
    //  return {
    //    user_id: userId,
    //    balance: user.balance
    //  }
    //}
    //
    //else {
    //  console.log(`${userId} is poor.`);
    //  return false;
    //}
  },

  async transferCredits(userId1, userId2, amount) {
    this.subtractBalance(userId1, amount);
    this.addBalance(userId2, amount);
  },
}

module.exports = {
  UserServices
}
