const { CustomString, CustomText, CustomInteger } = require('./custom-data-types');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserCustomerStats', {
    composite_key: CustomString(),
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Customers',
        key: 'customer_id'
      }
    },
    relationship_level: {
      ...CustomString(),
      defaultValue: 'stranger'
    },
    level: CustomInteger(),
    total_exp: CustomInteger(),
    prev_exp_req: CustomInteger(),
    current_level_exp: CustomInteger(),
    current_exp_req: CustomInteger(),
    total_orders: CustomInteger(),
    correct_orders: CustomInteger(),
    correct_orders_req: {
      ...CustomInteger(),
      defaultValue: 10
    },
    acceptable_orders: CustomInteger(),
    incorrect_orders: CustomInteger(),
  }, {
    timestamps: false,
    hooks: {
      beforeValidate: (instance) => {
        if (instance.user_id !== null && instance.customer_id !== null) {
          instance.composite_key = `${instance.user_id}:${instance.customer_id}`;
        }
        else {
          console.log('Model User Cusotmer Stats User Id:', instance.user_id);
          console.log('Model User Cusotmer Stats User Id:', instance.customer_id);
          throw new Error('Both user_id and customer_id must be provided.')
        }
      },

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
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['composite_key']
      }
    ]
  });
}

function hasChanged(instance) {
  const relevantFields = [
    'current_level_exp',
    'correct_orders',
    'acceptable_orders',
    'incorrect_orders'
  ];

  return relevantFields.some(field => instance.changed(field));
}

function calculateTotals(instance) {
  const correctOrders = instance.correct_orders || 0;
  const acceptableOrders = instance.acceptable_orders || 0;
  const incorrectOrders = instance.incorrect_orders || 0;
  const currentLevelExp = instance.current_level_exp || 0;

  instance.total_orders = correctOrders + acceptableOrders + incorrectOrders;

  if (instance.changed('current_level_exp') && currentLevelExp) {
    const expDifference = currentLevelExp - instance.previous('current_level_exp');
    instance.total_exp += expDifference;
  }
}
