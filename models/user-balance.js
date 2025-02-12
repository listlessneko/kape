import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserBalance = sequelize.define('UserBalance', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  balance: {
    ...CustomDataTypes.Float(),
  },
  max_debt: {
    ...CustomDataTypes.Float(),
    defaultValue: -100,
  },
  water_allowance: {
    ...CustomDataTypes.Integer(),
    defaultValue: 10,
  },
});
