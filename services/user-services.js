const { Op, Users } = require('../data/db-objects.js');
const { MathServices } = require('./math-services.js');
const { SearchServices } = require('./search-services.js');
const levels = require('../data/levels.json');
const { client } = require('../client.js');
const usersCache = client.usersCache;

const UserServices = {
  async getUsers(...userIds) {
    return await SearchServices.fetch(usersCache, Users, ...userIds);
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

      let result = await MathServices.addUpTo100(user.energy, amount);
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
      const user = await this.getUsers(...userIds)
      return await calculateEnergy(amount, user);
    }

    const users = await this.getUsers(...userIds)
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
      const user = await this.getUsers(...userIds)
      return await calculateEnergy(amount, user);
    }

    const users = await this.getUsers(...userIds)
    const usersEnergy = {};

    for ( const user of users ) {
      usersEnergy[user.user_id] = await calculateEnergy(amount, user);
    }
  },

  async addBalance( amount, ...userIds ) {
    if (!MathServices.isValidNumber(amount)) {
      return;
    }

    if ( userIds.length === 1 ) {
      const user = await this.getUsers(...userIds);
      const prev_balance = user.balance;
      user.balance += Number(amount);
      user.balance = MathServices.roundTo2Decimals(user.balance);
      await user.save();
      usersCache.set(user.user_id, user);
      const userBalance = {
        user_id: user.user_id,
        prev_balance,
        new_balance: user.balance
      };
      return userBalance;
    }

    const users = await this.getUsers(...userIds);
    const userBalances = {};

    for ( const user of users ) {
      const prev_balance = user.balance;
      user.balance += Number(amount);
      user.balance = MathServices.roundTo2Decimals(user.balance);
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
    if (!MathServices.isValidNumber(amount)) {
      return;
    }

    if ( userIds.length === 1 ) {
      const user = usersCache.get(userIds[0]);
      const prev_balance = user.balance;

      user.balance -= Number(amount);
      user.balance = MathServices.roundTo2Decimals(user.balance);

      await user.save();
      usersCache.set(user.user_id, user);
      const userBalance = {
        user_id: user.user_id,
        prev_balance,
        new_balance: user.balance
      };
      return userBalance;
    }

    const users = await this.getUsers(...userIds);
    const userBalances = {};

    for ( const user of users ) {
      const prev_balance = user.balance;

      user.balance -= Number(amount);
      user.balance = MathServices.roundTo2Decimals(user.balance);

      await user.save();
      usersCache.set(userIds, user);
      userBalances[ user.user_id ] = {};
      userBalances[ user.user_id ][ 'prev_balance' ] = prev_balance;
      userBalances[ user.user_id ][ 'new_balance' ] = new_balance;
    }

    return userBalances;
  },

  async transferCredits(amount, userId1, userId2) {
    let user = await this.getUsers(userId1);

    if (amount > user.balance) {
      const prev_balance = user.balance;
      const result = await MathServices.removeDownToNegative100(user.balance, amount);
      user.balance = Number(result);
      await user.save();
      const user1 = {
        user_id: user.user_id,
        prev_balance,
        new_balance: user.balance
      }

      const user2 = await this.addBalance(amount, userId2);

      return {
        user1,
        user2
      }
    }
    
    else {
      const user1 = await this.subtractBalance(amount, userId1);
      const user2 = await this.addBalance(amount, userId2);
      return {
        user1,
        user2
      }
    }
  }
}

module.exports = {
  UserServices
}
