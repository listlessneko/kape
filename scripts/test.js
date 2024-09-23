const { UserCustomerStatsServices } = require('../services/all-services.js');

const userId1 = '123';
const customerId1 = '1';

const order = {
  key1: {
    id: userId1,
    name: 'user_id'
  },
  key2: {
    id: customerId1,
    name: 'customer_id'
  },
  outcome: 'correct'
}

const results = UserCustomerStatsServices.trackingUserToCustomerOrders(order);

console.log(results)
