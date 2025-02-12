import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserKafeBalance = sequelize.define('UserKafeBalance', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  balance: {
    ...CustomDataTypes.Float(),
  },
  max_debt: {
    ...CustomDataTypes.Float(),
    defaultValue: -500,
  },
});
