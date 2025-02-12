import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const FateStats = sequelize.define('FateStats', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  trials_with_fate: {
    ...CustomDataTypes.Integer(),
  },
  lucky: {
    ...CustomDataTypes.Integer(),
  },
  unlucky: {
    ...CustomDataTypes.Integer(),
  },
  ultra_rare_plus: {
    ...CustomDataTypes.Integer(),
  },
  heads: {
    ...CustomDataTypes.Integer(),
  },
  lucky_heads: {
    ...CustomDataTypes.Integer(),
  },
  unlucky_heads: {
    ...CustomDataTypes.Integer(),
  },
  ultra_lucky_heads: {
    ...CustomDataTypes.Integer(),
  },
  tails: {
    ...CustomDataTypes.Integer(),
  },
  lucky_tails: {
    ...CustomDataTypes.Integer(),
  },
  unlucky_tails: {
    ...CustomDataTypes.Integer(),
  },
  ultra_lucky_tails: {
    ...CustomDataTypes.Integer(),
  },
  coins: {
    ...CustomDataTypes.Integer(),
  },
  one_credit: {
    ...CustomDataTypes.Float(),
  },
  fifty_parts: {
    ...CustomDataTypes.Float(),
  },
  twenty_five_parts: {
    ...CustomDataTypes.Float(),
  },
  fortune: {
    ...CustomDataTypes.Float(),
  },
}, {
    hooks: {
      beforeCreate: (instance) => {
        if (hasChanged(instance)) {
          calculateTotals(instance);
        }
      },
      beforeUpdate: (instance) => {
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
    }
  }
);

function hasChanged(instance) {
  const relevantFields = [
    'lucky_heads',
    'lucky_tails',
    'unlucky_heads',
    'unlucky_tails',
    'ultra_lucky_heads',
    'ultra_lucky_tails',
    'one_credit',
    'fifty_parts',
    'twenty_five_parts',
    'ultra_rare_plus',
  ];

  return relevantFields.some(field => instance.changed(field));
}

function calculateTotals(instance) {
  instance.lucky = instance.lucky_heads + instance.lucky_tails;
  instance.unlucky = instance.unlucky_heads + instance.unlucky_tails;
  instance.heads = instance.lucky_heads + instance.unlucky_heads + instance.ultra_lucky_heads;
  instance.tails = instance.lucky_tails + instance.unlucky_tails + instance.ultra_lucky_tails;
  instance.coins = instance.one_credit + instance.fifty_parts + instance.twenty_five_parts;
  instance.fortune = instance.one_credit + ((instance.fifty_parts * 50) / 100) + ((instance.twenty_five_parts * 25) / 100);
  instance.trials_with_fate = instance.lucky + instance.unlucky + instance.ultra_rare_plus;
}
