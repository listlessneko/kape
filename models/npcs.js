import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const Npcs = sequelize.define('Npcs', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    ...CustomDataTypes.String(),
  },
  descriptive_name: {
    ...CustomDataTypes.String(),
  }
});
