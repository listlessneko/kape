import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserNpccustomerOrders = sequelize.define('UserNpccustomerOrders', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  user_id: {
    ...CustomDataTypes.String(),
  },
  npc_id: {
    ...CustomDataTypes.String(),
  },
  total_orders: {
    ...CustomDataTypes.Integer(),
  },
  correct_orders: {
    ...CustomDataTypes.Integer(),
  },
  correct_orders_req: {
    ...CustomDataTypes.Integer(),
    defaultValue: 10
  },
  acceptable_orders: {
    ...CustomDataTypes.Integer(),
  },
  incorrect_orders: {
    ...CustomDataTypes.Integer(),
  },
  exp: {
    ...CustomDataTypes.Integer(),
  },
  cash: {
    ...CustomDataTypes.Float(),
  },
}, {
    hooks: {
      beforeValidate: (instance) => {
        if (instance.user_id !== null && instance.npc_id !== null) {
          instance.id = `${instance.user_id}:${instance.npc_id}`;
        }
        else {
          console.log('Model User Cusotmer Stats User Id:', instance.user_id);
          console.log('Model User Cusotmer Stats User Id:', instance.npc_id);
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
        fields: ['id']
      }
    ]
  }
);

function hasChanged(instance) {
  const relevantFields = [
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

  instance.total_orders = correctOrders + acceptableOrders + incorrectOrders;
}
