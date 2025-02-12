import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserItems = sequelize.define('UserItems', {
  user_id: {
    ...CustomDataTypes.String(),
  },
  item_id: {
    type: DataTypes.INTEGER,
  },
  name: {
    ...CustomDataTypes.String(),
  },
  min_quantity: {
    ...CustomDataTypes.Integer(),
  },
  quantity: {
    ...CustomDataTypes.Integer(),
  },
  max_quantity: {
    ...CustomDataTypes.Integer(),
    defaultValue: 99,
  },
  }, {
  }
);
