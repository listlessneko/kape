const { UserLevels } = require('../data/db-objects.js');
const { SearchServices } = require('./search-services.js');
const { client } = require('../client.js');
const userLevelsCache = client.cache['userLevelsCache'];

const UserLevelsServices = {
  async getUserLevels(...userIds) {
    return await SearchServices.fetch(userLevelsCache, UserLevels, ...userIds);
  },

  async calculateExpReq(level, prev_exp_req) {
    if (!level) {
      console.log('Check Level - Level:', level);
      return 50;
    }
    else {
      console.log('Check Level - Level:', level);
      return level * 50 + prev_exp_req;
    }
  },

  async levelUp(user, expRequired) {
    const prev_level = user.level;
    user.level += 1;
    user.prev_exp_req = expRequired;
    user.current_level_exp = user.current_level_exp - expRequired;
    user.current_exp_req = await this.calculateExpReq(user.level, user.prev_exp_req);
    await user.save();
    userLevelsCache.set(user.user_id, user);
    return {
      user_id: user.user_id,
      level_up: true,
      prev_level,
      level: user.level,
      total_exp: user.total_exp,
      prev_exp_req: user.prev_exp_req,
      current_level_exp: user.current_level_exp,
      current_exp_req: user.current_exp_req
    }
  },

  async checkLevel(userId) {

    const user = await this.getUserLevels(userId);
    console.log('Check Level - User:', user);

    const expRequired = await this.calculateExpReq(user.level, user.prev_exp_req);
    console.log('Check Level - Experience Required:', expRequired);

    if (!user.current_exp_req) {
      user.current_exp_req = expRequired;
      await user.save();
      userLevelsCache.set(userId, user);
    }

    if (user.current_level_exp >= expRequired) {
      console.log('Check Level - Level Up');
      return await leveUp(user, expRequired);
    }

    else {
      console.log('Check Level - No Level Up');
      return {
        user_id: user.user_id,
        level_up: false,
        level: user.level,
        total_exp: user.total_exp,
        prev_exp_req: user.prev_exp_req,
        current_level_exp: user.current_level_exp,
        current_exp_req: user.current_exp_req
      }
    }
  },

  async addExp(amount, userId) {
    let user = userLevelsCache.get(userId);
    let level_up = false;

    if (!user) {
      user = await this.getUserLevels(userId);
    }

    // console.log('Add Exp - User:', user);

    const prev_level_exp = user.current_level_exp;
    user.current_level_exp += Number(amount);
    await user.save();
    userLevelsCache.set(userId, user);
    if (user.current_level_exp >= user.current_exp_req) {
      return await this.levelUp(user, user.current_exp_req);
    }
    return {
      user_id: userId,
      level_up,
      level: user.level,
      prev_level_exp,
      current_level_exp: user.current_level_exp,
      current_exp_req: user.current_exp_req
    }
  },

  async subtractExp(amount, userId) {
    let user = userLevelsCache.get(userId);

    if (!user) {
      user = await this.checkLevel(userId);
    }

    const prev_level_exp = user.current_level_exp;
    user.current_level_exp -= Number(amount);
    await user.save();
    userLevelsCache.set(userId, user);
    return {
      user_id: userId,
      level: user.level,
      prev_level_exp,
      current_level_exp: user.current_level_exp,
      current_exp_req: user.current_exp_req
    }
  }
}

module.exports = {
  UserLevelsServices
}
