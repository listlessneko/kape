import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';

export const UserKafeLevel = sequelize.define('UserKafeLevel', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true
  },
  level: {
    ...CustomDataTypes.Integer(),
    defaultValue: 0
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
      beforeSave: (UserKafeLevels) => {
        if (hasChanged(UserKafeLevels)) {
          calculateTotals(UserKafeLevels);
        }
      },
      afterFind: (UserKafeLevels) => {
        if (Array.isArray(UserKafeLevels)) {
          UserKafeLevels.forEach(UserKafeLevel => {
            if (hasChanged(UserKafeLevel)) {
              calculateTotals(UserKafeLevel);
            }
          });
        }
        else if (UserKafeLevels) {
          if (hasChanged(UserKafeLevels)) {
            calculateTotals(UserKafeLevels);
          }
        }
      },
    }
  }
);

function hasChanged(UserKafeLevels) {
  const relevantFields = [
    'level',
    'prev_exp_req',
    'current_level_exp',
    'current_exp_req',
  ];

  return relevantFields.some(field => UserKafeLevels.changed(field));
}

function calculateTotals(UserKafeLevels) {
  if (UserKafeLevels.changed('current_level_exp') && UserKafeLevels.current_level_exp) {
    const expDifference = UserKafeLevels.current_level_exp - UserKafeLevels.previous('current_level_exp');
    UserKafeLevels.total_exp += expDifference;
  }
}
