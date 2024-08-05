const path = require('node:path');
const { Users, UserItems } = require(path.join(__dirname, '..', 'data', 'db-object.js'));
//const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'));
const { client } = require(path.join(__dirname, '..', 'client.js'));
const currency = client.currency;

const UserServices = {
  async addItems(userId, item) {
    const userItem = await UserItems.findOne({
      where: { user_id: userId, item_id: item.id },
    });

    if (userItem) {
      userItem.amount += 1;
      return userItem.save();
    }

    return UserItems.create({ user_id: userId, item_id: item.id, amount: 1});
  },

  async getUserItems(userId) {
    return UserItems.findAll({
      where: { user_id: userId },
      include: ['item'],
    });
  },

  async checkUserCurrency(userId) {
    let user = currency.get(userId);
    //// is there a user? Yes, then this : No, then this
    //return user ? user.balance : 0;
    if (user) {
      return user;
    }

    else {
      user = await Users.findOne({
        where: { user_id: userId }
      });
    }

    if (user) {
      return user;
    }

    else {
      const newUser = await Users.create({ user_id: userId, balance: 0 });
      currency.set(userId, newUser);
      return newUser;
    }
  },

  async getBalance(userId) {
    const user = await this.checkUserCurrency(userId);
    return user.balance;
  },

  async addBalance(userId, amount) {
    const user = await this.checkUserCurrency(userId);
    user.balance += Number(amount);
    return user.save();
  },

  async subtractBalance(userId, amount) {
    const user = await this.checkUserCurrency(userId);
    if (amount <= user.balance) {
      user.balance -= Number(amount);
      return user.save();
    }

    else {
      console.log(`${userId} is poor.`)
    }
  },

  async transferBalance(userId1, userId2, amount) {
    const user1 = await this.checkUserCurrency(userId1);
    if (amount > user1.balance) {
      return false;
    }

    else {
      this.subtractBalance(userId1, amount);
      this.addBalance(userId2, amount);
      return true;
    }
  },
}

module.exports = {
  UserServices
}
