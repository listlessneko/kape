const { Op, Customers } = require('../data/db-objects.js');
const { SearchServices } = require('./search-services.js');

const CustomerServices = {
  async findCustomer(customer) {
    try {
      const instance = await Customers.findOne({
        where: {
          [Op.or]: [
            { customer_id: customer },
            { name: customer },
            { descriptive_name: customer }
          ]
        }
      });
      if (instance) {
        return instance;
      }
      else {
        return console.log('Customer Services: Customer not found.');
      }
    }
    catch (e) {
      console.error('Main - CustomerServices.findCustomer error:', e);
    }
  }
}

module.exports = {
  CustomerServices
}
