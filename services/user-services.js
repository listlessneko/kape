const path = require('node:path');
const { UserContextMenuCommandInteraction } = require('discord.js');
const { MathServices } = require(path.join(__dirname, 'math-services.js'));
const { Op, Users, UserItems } = require(path.join(__dirname, '..', 'data', 'db-objects.js'));
//const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'));
const { client } = require(path.join(__dirname, '..', 'client.js'));
const usersCache = client.usersCache;

const UserServices = {
  async getUsers(options = {}, ...userIds) {
    const { requestModelInstance = false } = options;
    //console.log('Get Users - Request Cache:', requestModelInstance);

    const usersInCache = [];
    const usersNotInCache = [];

    userIds.forEach(userId => {
      if (!usersCache.has(userId)) {
        usersNotInCache.push(userId);
      }
      else {
        usersInCache.push(userId);
      }
    });

    //console.log('Get User - User In Cache:', usersInCache);
    //console.log('Get User - User Not In Cache:', usersNotInCache);

    if (usersNotInCache.length > 0) {
      const dbUsers = await Users.findAll({
        where: {
          user_id: {
            [Op.in]: usersNotInCache
          }
        }
      });

      //console.log('Get User - User In Database:', dbUsers);

      dbUsers.forEach(user => {
        //console.log('dbusers:', user);
        const userId = user.dataValues.user_id;

        if (!usersCache.has(userId)) {
          usersCache.set(userId, user);
        }
      })

      await Promise.all(userIds.map(async (userId) => {
        const userExists = (dbUsers.some(user => user.dataValues.user_id === userId));

        if (!userExists) {
          const newUser = await Users.create({
            user_id: userId
          });
          usersCache.set(userId, newUser);
        }
      }));
    }

    if (requestModelInstance) {
      if (userIds.length === 1) {
        const cachedUser = usersCache.get(userIds[0]);
        return cachedUser;
      }
      const cachedUsers = userIds.map(userId => usersCache.get(userId));
      return cachedUsers;
    }

    if ( userIds.length === 1 ) {
      const cachedUser = usersCache.get(userIds[0]);
      const userInfo = {
        ...cachedUser.dataValues
      }
      return userInfo;
    }

    else {
      const cachedUsers = userIds.map(userId => {
        const cachedUser = usersCache.get(userId);
        return {
          user_id: userId,
          ...cachedUser.dataValues
        };
      });

      const usersInfo = cachedUsers.reduce((acc, user) => {
        acc[user.user_id] = {...user};
        return acc;
      }, {});

      return usersInfo;
    }

  },

  async getAllUsers() {
    const users = await Users.findAll();
    users.forEach(user => {
      usersCache.set(user.dataValues.user_id, user);
    });
    console.log(usersCache);
  },

  async addEnergy(amount, ...userIds) {
    async function calculateEnergy(amount, user) {
      const prev_energy = user.energy;

      if (user.energy >= 100) {
        console.log(`User ID: ${user.user_id} is already at max (${user.energy}) energy.`)
        return {
          user: user.user_id,
          prev_energy,
          new_energy: user.energy,
          max_energy: user.max_energy,
          min_energy: user.min_energy,
        }
      }

      const result = await MathServices.addUpTo100(user.energy, amount);
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
      return {
        user: user.user_id,
        prev_energy,
        new_energy: user.energy,
        max_energy: user.max_energy,
        min_energy: user.min_energy,
      };
    }

    if ( userIds.length === 1 ) {
      const user = await this.getUsers( { requestModelInstance: true }, ...userIds )
      return await calculateEnergy(amount, user);
    }

    const users = await this.getUsers( { requestModelInstance: true }, ...userIds )
    const usersEnergy = {};

    for ( const user of users ) {
      usersEnergy[user.user_id] = await calculateEnergy(amount, user);
    }
  },

  async removeEnergy(amount, ...userIds) {
    async function calculateEnergy(amount, user) {
      const prev_energy = user.energy;

      if (user.energy === 0) {
        console.log(`User ID: ${user.user_id} is already at minimum (${user.energy}) energy.`)
        return {
          user: user.user_id,
          prev_energy,
          new_energy: user.energy,
          max_energy: user.max_energy,
          min_energy: user.min_energy,
        }
      }

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
      return {
        user: user.user_id,
        prev_energy,
        new_energy: user.energy,
        max_energy: user.max_energy,
        min_energy: user.min_energy,
      };
    }

    if ( userIds.length === 1 ) {
      const user = await this.getUsers( { requestModelInstance: true }, ...userIds )
      return await calculateEnergy(amount, user);
    }

    const users = await this.getUsers( { requestModelInstance: true }, ...userIds )
    const usersEnergy = {};

    for ( const user of users ) {
      usersEnergy[user.user_id] = await calculateEnergy(amount, user);
    }
  },

  async addBalance( amount, ...userIds ) {
    if ( userIds.length === 1 ) {
      const user = await this.getUsers( { requestModelInstance: true }, ...userIds );
      const prev_balance = user.balance;
      user.balance += Number(amount);
      await user.save();
      usersCache.set(user.user_id, user);
      const userBalance = {
        user_id: user.user_id,
        prev_balance,
        new_balance: user.balance
      };
      return userBalance;
    }

    const users = await this.getUsers( { requestModelInstance: true }, ...userIds );
    const userBalances = {};

    for ( const user of users ) {
      const prev_balance = user.balance;
      user.balance += Number(amount);
      await user.save();
      usersCache.set(user.user_id, user);
      userBalances[user.user_id] = {};
      userBalances[ user.user_id ][ 'user_id' ] = user.user_id;
      userBalances[ user.user_id ][ 'prev_balance' ] = prev_balance;
      userBalances[ user.user_id ][ 'new_balance' ] = user.balance;
      }

    return userBalances;
  },

  async subtractBalance(amount, ...userIds) {
    if ( userIds.length === 1 ) {
      const user = await this.getUsers( { requestModelInstance: true }, ...userIds );
      const prev_balance = user.balance;
      user.balance -= Number(amount);
      await user.save();
      usersCache.set(user.user_id, user);
      const userBalance = {
        user_id: user.user_id,
        prev_balance,
        new_balance: user.balance
      };
      return userBalance;
    }

    const users = await this.getUsers( { requestModelInstance: true }, ...userIds );
    const userBalances = {};

    for ( const user of users ) {
      const prev_balance = user.balance;
      user.balance -= Number(amount);
      await user.save();
      usersCache.set(userIds, user);
      userBalances[ user.user_id ] = {};
      userBalances[ user.user_id ][ 'prev_balance' ] = prev_balance;
      userBalances[ user.user_id ][ 'new_balance' ] = new_balance;
    }

    return userBalances;
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

  async transferCredits(amount, userId1, userId2) {
    const user1 = await this.subtractBalance(amount, userId1);
    const user2 = await this.addBalance(amount, userId2);
    return {
      user1,
      user2
    }
  },
}

module.exports = {
  UserServices
}
