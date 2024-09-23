const { CustomString, CustomText, CustomInteger } = require('./custom-data-types');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Customers', {
    customer_id: {
      type: CustomInteger(),
      primaryKey: true
    },
    name: CustomString(),
    descriptive_name: CustomString()
  }, {
    timestamps: false
  });
}
