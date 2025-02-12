import { logger } from '../logger.js';
import {
  ValidationError,
  NullValidationError,
  UndefinedValidationError,
  StringValidationError,
  NumberValidationError,
  CacheValidationError,
  MutexValidationError,
  TransactionValidationError,
  UserSupplyItemValidationError,
  DatabaseValidationError,
} from '../errors/error-barrel.js';
import { Sequelize } from 'sequelize';
import * as database from '../models/models-barrel.js';
import { sequelize } from '../data/db.js';

const cacherNamesArr = [
  'UsersCache',
  'UserEnergyCache',
  'UserLevelCache',
  'UserBalanceCache',
  'UserItemsCache',
  'FateStatsCache',
  'JankenStatsCache',
  'BaristaStatsCache',
  'UserKafeBalanceCache',
  'UserKafeItemsCache',
  'UserKafeSuppliesCache',
  'SuppliesCache',
  'KafeItemsCache',
  'UserNpcRelationshipCache',
  'UserNpccustomerOrdersCache',
  'UserNpcJankenStatsCache',
];

const mutexNamesArr = [
  'UsersMutexes',
  'UserEnergyMutexes',
  'UserLevelMutexes',
  'UserBalanceMutexes',
  'UserItemsMutexes',
  'FateStatsMutexes',
  'JankenStatsMutexes',
  'BaristaStatsMutexes',
  'UserKafeBalanceMutexes',
  'UserKafeItemsMutexes',
  'UserKafeSuppliesMutexes',
  'SuppliesMutexes',
  'KafeItemsMutexes',
  'UserNpcRelationshipMutexes',
  'UserNpccustomerOrdersMutexes',
  'UserNpcJankenStatsMutexes',
];

export const ValidationServices = {
  isDefined(value) {
    if (value === null) {
      throw new NullValidationError(value);
    }
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new UndefinedValidationError(value);
    }
    return;
  },
  // currently accepts any type as long as it's defined
  // possibly create validations for specific operations
  // e.g.: userIds
  validateInputs(inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === null) {
        throw new NullValidationError(`'${key}'`);
      }
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        throw new UndefinedValidationError(`'${key}'`);
      }
    }
    return { success: true };
  },

  isValidNumber(value) {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      throw new NumberValidationError(value);
    }
    return { success: true };
  },

  validateDatabase(depository) {
    const Database = database[depository];
    if (!depository) {
      throw new StringValidationError(depository);
    }
    if (!(Database.prototype instanceof Sequelize.Model)) {
      throw new DatabaseValidationError(depository);
    }
    return { success: true };
  },

  validateCache(value) {
    this.isDefined(value);
    if (!cacherNamesArr.includes(value)) {
      throw new CacheValidationError(value);
    }
    return { success: true };
  },

  validateMutex(value) {
    this.isDefined(value);
    if (!mutexNamesArr.includes(value)) {
      throw new MutexValidationError(value);
    }
    return { success: true };
  },

  ValidateTransactionObject(transaction) {
    if (!transaction) {
      return;
    }
    if (!(transaction instanceof Sequelize.Transaction)) {
      throw new TransactionValidationError(transaction)
    }
    return { success: true };
  },

  isUserSupplyItem(instance) {
    if (!(instance instanceof UserSupplies)) {
      throw new UserSupplyItemValidationError(instance);
    }
    return { success: true };
  },

  async validateField(tableName, fields) {
    logger.debug(`[TEST] tableName:`, tableName);
    logger.debug(`[TEST] fields:`, fields);
    const tableInfo = await sequelize.query(`PRAGMA table_info(${tableName})`);
    logger.debug(`[TEST] tableInfo:`, tableInfo);
    const existingColumns = tableInfo[0].map(column => column.name);
    logger.debug(`[TEST] existingColumns:`, existingColumns);
    const validFields = fields.filter(field => existingColumns.includes(field));
    return validFields;
  }
}
