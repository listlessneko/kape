import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserNpcRelationship = sequelize.define('UserNpcRelationship', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  user_id: {
    ...CustomDataTypes.String(),
  },
  npc_id: {
    type: DataTypes.INTEGER,
  },
  status: {
    ...CustomDataTypes.String(),
    defaultValue: 'stranger'
  },
  level: {
    ...CustomDataTypes.Integer(),
  },
  total_exp: {
    ...CustomDataTypes.Integer(),
  },
  prev_exp_req: {
    ...CustomDataTypes.Integer(),
  },
  current_level_exp: {
    ...CustomDataTypes.Integer(),
  },
  current_exp_req: {
    ...CustomDataTypes.Integer(),
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
        throw new Error('Both user_id and npc_id must be provided.')
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
    'current_level_exp',
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
