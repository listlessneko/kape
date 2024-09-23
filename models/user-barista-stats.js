const { CustomInteger } = require('./custom-data-types.js');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserBaristaStats', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    total_orders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    correct_orders: CustomInteger(),
    acceptable_orders: CustomInteger(),
    incorrect_orders: CustomInteger(),
  }, {
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (hasChanged(instance)) {
          calculateTotals(instance);
        }
      },
      afterFind: (instances) => {
        if (Array.isArray(instances)) {
          instances.forEach(instance => {
            if (hasChanged(instance)) {
              calculateTotals(instance);
            }
          });
        }
        else if (instances) {
          if (hasChanged(instances)) {
            calculateTotals(instances);
          }
        }
      },
    }
  });
}

function hasChanged(instances) {
  const relevantFields = [
    'total_orders',
    'correct_orders',
    'acceptable_orders',
    'incorrect_orders',
  ];

  return relevantFields.some(field => instances.changed(field));
}

function calculateTotals(instances) {
  const correctOrders = instances.correct_orders || 0;
  const acceptableOrders = instances.acceptable_orders || 0;
  const incorrectOrders = instances.incorrect_orders || 0;

  instances.total_orders = correctOrders + acceptableOrders + incorrectOrders;
}
