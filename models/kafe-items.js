import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const KafeItems = sequelize.define('KafeItems', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    ...CustomDataTypes.String(),
    unique: true,
  },
  value: {
    ...CustomDataTypes.String(),
    unique: true,
  },
  description: {
    ...CustomDataTypes.Text(),
  },
  content: {
    ...CustomDataTypes.Text(),
  },
  cost: {
    ...CustomDataTypes.Float(),
  },
  energy_replen: {
    type: DataTypes.JSON,
    defaultValue: { min: 0, max: 0 }
  },
  uses: {
    ...CustomDataTypes.Integer(),
    defaultValue: 1
  },
  supplies_required: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  category: {
    ...CustomDataTypes.String(),
  },
  type: {
    ...CustomDataTypes.String(),
  },
});
