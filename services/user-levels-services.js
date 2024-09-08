const { UserLevels } = require('../data/db-objects.js');
const { client } = require('../client.js');
const userLevelsCache = client.userLevelsCache;
const { SearchServices } = require('../services/search-services.js');

const UserLevelsServices = {
  async getUserLevels(...userIds) {
    return await SearchServices.fetch(userLevelsCache, UserLevels, ...userIds);
  },

  async checkLevel(userId) {
    function calculateExpReq(level, prev_exp_req) {
      if (!level) {
        console.log('Check Level - Level:', level);
        return 50;
      }
      else {
        console.log('Check Level - Level:', level);
        return level * 50 + prev_exp_req;
      }
    }

    const user = await this.getUserLevels(userId);

    const expRequired = await calculateExpReq(user.level, user.prev_exp_req);
    console.log('Check Level - Experience Required:', expRequired);

    if (user.current_level_exp >= expRequired) {
      console.log('Check Level - Level Up');
      user.level += 1;
      user.prev_exp_req = expRequired;
      user.current_level_exp = user.current_level_exp - expRequired;
      user.current_exp_req = await calculateExpReq(user.level, user.prev_exp_req);
      await user.save();
      userLevelsCache.set(userId, user);
      return {
        user_id: user.user_id,
        level: user.level,
        total_exp: user.total_exp,
        prev_exp_req: user.prev_exp_req,
        current_level_exp: user.current_level_exp,
        current_exp_req: user.current_exp_req
      }
    }

    else {
      console.log('Check Level - No Level Up');
      if (!user.current_exp_req) {
        user.current_exp_req = expRequired;
        await user.save();
        userLevelsCache.set(userId, user);
      }
      return {
        user_id: user.user_id,
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

    if (!user) {
      user = await this.getUserLevels(userId);
    }

    const prev_level_exp = user.current_level_exp;
    user.current_level_exp += Number(amount);
    await user.save();
    userLevelsCache.set(userId, user);
    return {
      user_id: userId,
      level: user.level,
      prev_level_exp,
      current_level_exp: user.current_level_exp,
      current_exp_req: user.current_exp_req
    }
  },

  async subtractExp(amount, userId) {
    let user = userLevelsCache.get(userId);

    if (!user) {
      user = await this.getUserLevels(userId);
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
