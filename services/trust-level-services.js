const { client } = require('../client.js');
const userCustomerStatsCache = client.userCustomerStatsCache;
const { UserCustomerStats } = require('../data/db-objects.js');
const { FormatServices } = require('./format-services.js');
const { SearchServices } = require('./search-services.js');

const TrustLevelServices = {
  async getRelationshipLevel(key1, key2) {
    return await SearchServices.fetchJunction(userCustomerStatsCache, UserCustomerStats, key1, key2);
  },

  async checkOrdersReq(instance) {
    const level = instance.level;
    //console.log('Check Orders Req - Level:', level);
    const correct_orders_req = 10;
    //console.log('Check Orders Req - Correct Order Req:', correct_orders_req);
    const correct_orders = instance.correct_orders;
    //console.log('Check Orders Req - Correct Orders:', correct_orders);

    if (!level && correct_orders >= correct_orders_req) {
    //console.log('Check Orders Req - Orders Met:', true);
      return true
    }
    //console.log('Check Orders Req - Orders Met:', false);
    return false
  },

  async calculateExpReq(instance) {
    const level = instance.level;
    const prev_exp_req = instance.prev_exp_req;
    const current_level_exp = instance.current_level_exp;
    let new_exp_req;
    
    if (!level) {
      new_exp_req = 50;
    }

    else if (current_level_exp >= prev_exp_req) {
      new_exp_req = level * 50 + prev_exp_req;
    }

    return new_exp_req;
  },

  //async levelUp(instance) {
  //  const prev_level = instance.level;
  //  instance.level += 1;
  //  instance.prev_exp_req = instance.current_exp_req;
  //  instance.current_level_exp = instance.current_level_exp - expRequired;
  //  instance.current_exp_req = await this.calculateExpReq(instance);
  //  await instance.save()
  //  userCustomerStatsCache.set(instance.composite_key, instance);
  //  return {
  //    composite_key: instance.composite_key,
  //    aquainted: true,
  //    level_up: true,
  //    prev_level,
  //    level: instance.level,
  //    total_exp: instance.total_exp,
  //    current_level_exp: instance.current_level_exp,
  //    current_exp_req: instance.current_exp_req
  //  }
  //},

  async checkTrustLevel(key1, key2) {
    const compositeKey = FormatServices.generateCompositeKey(key1.id, key2.id);
    let instance = userCustomerStatsCache.get(compositeKey);

    if (!instance) {
      instance = await this.getRelationshipLevel(key1, key2);
    }

    let ordersMet = false;
    let expRequired = 0;
    let prev_level = 0;
    let trustLevel;
    let levelUp = false;

    if (!instance.level) {
      ordersMet = await this.checkOrdersReq(instance);
      // console.log('Trust Level - Orders Met:', ordersMet);
      if (ordersMet) {
        //console.log('Trust Level - Orders Met True:', ordersMet);
        instance.trust_level = 'acquaintance';
        trustLevel = instance.trust_level;
        instance.level += 1;
        levelUp = true;
        instance.current_exp_req = await this.calculateExpReq(instance);
        await instance.save();
        userCustomerStatsCache.set(compositeKey, instance);
      }
    }

    if (instance.level && instance.current_level_exp >= instance.current_exp_req) {
      prev_level = instance.level;
      instance.level += 1;
      levelUp = true;
      instance.prev_exp_req = instance.current_exp_req;
      instance.current_exp_req = await this.calculateExpReq(instance);
      await instance.save();
      userCustomerStatsCache.set(compositeKey, instance);
    }

    return {
      ...instance.get({ plain: true }),
      prev_level,
      expRequired,
      trustLevel,
      levelUp
    }

  }
}

module.exports = {
  TrustLevelServices
}
