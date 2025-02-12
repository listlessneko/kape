import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const BaristaStats = sequelize.define('BaristaStats', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  total_orders: {
    ...CustomDataTypes.Integer(),
  },
  correct_orders: {
    ...CustomDataTypes.Integer(),
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
  earnings: {
    ...CustomDataTypes.Float(),
  },
}, {
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
  }
);

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
