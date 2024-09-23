const { client } = require('../client.js');
const { UserCustomerStats, UserBaristaStats } = require('../data/db-objects.js');
const { FormatServices } = require('./format-services.js');
const { SearchServices } = require('./search-services.js');
const userCustomerStatsCache = client.userCustomerStatsCache;
const userBaristaStatsCache = client.userBaristaStatsCache;

const UserCustomerStatsServices = {
  async getUsersCustomerStats(key1, key2) {
    console.log('Get Users Customer Stats - Key 1:', key1);
    console.log('Get Users Customer Stats - Key 2:', key2);
    return await SearchServices.fetchJunction(userCustomerStatsCache, UserCustomerStats, key1, key2);
  },

  async getUsersBaristaStats(userId) {
    return await SearchServices.fetch(userBaristaStatsCache, UserBaristaStats, userId);
  },

  async trackingUserToCustomerOrders(order) {
    let compositeKey = FormatServices.generateCompositeKey(order.key1.id, order.key2.id);
    console.log('Tracking Orders - Composite Key:', compositeKey);
    let userCustomerStatsInstance = userCustomerStatsCache.get(compositeKey);
    console.log('Tracking Orders - User Customer Stats Instance Cache:', userCustomerStatsInstance);
    let userBaristaStatsInstance = userBaristaStatsCache.get(order.key1.id);
    //console.log('Tracking Orders - User Barista Stats Instance Cache:', userBaristaStatsInstance);

    if (!userCustomerStatsInstance) {
      userCustomerStatsInstance = await this.getUsersCustomerStats(order.key1, order.key2);
      console.log('Tracking Orders - User Customer Stats Instance Database:', userCustomerStatsInstance);
    }

    if (!userBaristaStatsInstance) {
      userBaristaStatsInstance = await this.getUsersBaristaStats(order.key1.id);
      //console.log('Tracking Orders - User Barista Stats Instance Database:', userBaristaStatsInstance);
    }

    const outcome = order.outcome + '_orders';

    console.log('Tracking Orders - User:', outcome);
    const prev_outcome = userCustomerStatsInstance[outcome];
    userCustomerStatsInstance[outcome] += 1;
    console.log('Tracking Orders - User Customer Stats Instance:', userCustomerStatsInstance);
    userBaristaStatsInstance[outcome] += 1;
    //console.log('Tracking Orders - User Barista Stats Instance:', userBaristaStatsInstance);
    await userCustomerStatsInstance.save();
    await userBaristaStatsInstance.save();
    userCustomerStatsCache.set(compositeKey, userCustomerStatsInstance);
    userBaristaStatsCache.set(order.key1.id, userBaristaStatsInstance);

    return {
      compositeKey,
      user_id: order.key1.id,
      customer_id: order.key2.id,
      prev_outcome,
      total_orders: userCustomerStatsInstance.total_orders,
      correct_orders: userCustomerStatsInstance.correct_orders,
      acceptable_orders: userCustomerStatsInstance.acceptable_orders,
      incorrect_orders: userCustomerStatsInstance.incorrect_orders
    }
  },
}

module.exports = {
  UserCustomerStatsServices
}
