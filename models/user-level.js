// deprecata...e I LIED
import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserLevel = sequelize.define('UserLevel', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true
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
    defaultValue: 50,
  },
});
