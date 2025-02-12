import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserEnergy = sequelize.define('UserEnergy', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  energy: {
    ...CustomDataTypes.Integer(),
    defaultValue: 240,
  },
  max_energy: {
    ...CustomDataTypes.Integer(),
    defaultValue: 240,
  },
  min_energy: {
    ...CustomDataTypes.Integer(),
    defaultValue: 0,
  }
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
});

function hasChanged(instance) {
  const relevantFields = [
    'level',
    'prev_exp_req',
    'current_level_exp',
    'current_exp_req',
  ];

  return relevantFields.some(field => instance.changed(field));
}

function calculateTotals(instance) {
  const currentLevelExp = instance.current_level_exp || 0;

  if (instance.changed('current_level_exp') && currentLevelExp) {
    const expDifference = currentLevelExp - instance.previous('current_level_exp');
    instance.total_exp += expDifference;
  }
}
