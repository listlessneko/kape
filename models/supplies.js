import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const Supplies = sequelize.define('Supplies', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    ...CustomDataTypes.String()
  },
  value: {
    ...CustomDataTypes.String()
  },
  type: {
    ...CustomDataTypes.String()
  },
  description: {
    ...CustomDataTypes.Text()
  },
  cost: {
    ...CustomDataTypes.Float()
  },
  min_quantity: {
    ...CustomDataTypes.Integer(),
  },
  quantity: {
    ...CustomDataTypes.Integer(),
    defaultValue: 99
  },
  max_quantity: {
    ...CustomDataTypes.Integer(),
    defaultValue: 99
  },
  amount: {
    ...CustomDataTypes.Float(),
  },
  max_amount: {
    ...CustomDataTypes.Float(),
  },
});
