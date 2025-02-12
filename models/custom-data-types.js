import { DataTypes } from 'sequelize';

export const Integer = () => ({
  type: DataTypes.INTEGER,
  defaultValue: 0,
  allowNull: false,
  validate: {
    isInt: true,
    notNaN(value) {
      if (typeof value !== 'number' || isNaN(value)) {
        console.log(`[TEST] CUSTOM DATA TYPE value:`, value, `Type:`, typeof value);
        throw new Error('Value must be a valid number and cannot be NaN.');
      }
    }
  }
});

export const Float = () => ({
  type: DataTypes.FLOAT,
  defaultValue: 0,
  allowNull: false,
  validate: {
    isFloat: true,
    notNaN(value) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Value must be a valid number and cannot be NaN.');
      }
    }
  }
});

export const String = () => ({
  type: DataTypes.STRING,
  defaultValue: 'The Void',
  allowNull: false,
  validate: {
    notEmpty: true,
    isDefined(value) {
      if (value === undefined) {
        throw new Error('Value cannot be undefined.');
      } 
      if (value === null) {
        throw new Error('Value cannot be null.');
      }
    }
  }
});

export const Text = () => ({ 
  type: DataTypes.TEXT,
  defaultValue: 'The Void',
  allowNull: false,
  validate: {
    notEmpty: true,
    isDefined(value) {
      if (value === undefined) {
        throw new Error('Value cannot be undefined.');
      } 
      if (value === null) {
        throw new Error('Value cannot be null.');
      }
    }
  }
});
