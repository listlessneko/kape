import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';

export const Users = sequelize.define('Users', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true
  }
});
