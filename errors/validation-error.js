import { logger } from '../logger.js';
import { AppError } from './app-error.js';

export class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message || 'Validation error encountered.', {
      type: 'VALIDATION_ERROR', 
      code: 400,
      details: `General validation error.`,
      ...options
    });
    //logger.error(this.message, this.type, this.code);
  }
}

export class NullValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a non-null value, but received: ${value}`), {
      type: `NULL_VALIDATION_ERROR`,
      details: `Value is null.`
    }
  }
}

export class UndefinedValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a defined value, but received: ${value}`), {
      type: `UNDEFINED_VALIDATION_ERROR`,
      details: `Value is not defined.`
    }
  }
}

export class StringValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a valid string, but received: ${value}`, {
      type: `STRING_VALIDATION_ERROR`,
      details: `String validation failed.`
    });
  }
}

export class NumberValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a valid number, but received: ${value}`, {
      type: `NUMBER_VALIDATION_ERROR`,
      details: `Number validation failed.`
    });
  }
}

export class DatabaseValidationError extends ValidationError {
  constructor(value) {
    super(`Expected valid database, but received: ${value}`, {
      type: `DATABASE_VALIDATION_ERROR`,
      details: `Database validation failed.`
    });
  }
}

export class CacheValidationError extends ValidationError {
  constructor(value) {
    super(`Expected valid cache name, but received: ${value}`, {
      type: `CACHE_VALIDATION_ERROR`,
      details: `Cache validation failed.`
    });
  }
}

export class MutexValidationError extends ValidationError {
  constructor(value) {
    super(`Expected valid mutex name, but received: ${value}`, {
      type: `MUTEX_VALIDATION_ERROR`,
      details: `Mutex validation failed.`
    });
  }
}

export class TransactionValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a valid Sequelize transaction object, but received: ${value}`, {
      type: `TRANSACTION_VALIDATION_ERROR`,
      details: `Sequelize transaction validation failed.`
    });
  }
}

export class UserSupplyItemValidationError extends ValidationError {
  constructor(value) {
    super(`Expected a valid Sequelize instance of 'UserSupplies', but received: ${value}`, {
      type: `USER_SUPPLY_ITEM_VALIDATION_ERROR`,
      details: `Sequelize 'UserSupplies' instance validation failed.`
    });
  }
}
