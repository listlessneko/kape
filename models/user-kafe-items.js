import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserKafeItems = sequelize.define('UserKafeItems', {
  item_id: {
    type: DataTypes.INTEGER,
    //reference: {
    //  model: 'KafeItems',
    //  key: 'id'
    //}
  },
  user_id: {
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
  amount: {
    ...CustomDataTypes.Integer(),
  },
  max_amount: {
    ...CustomDataTypes.Integer(),
  }
}, {
  }
);
