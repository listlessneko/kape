const { DataTypes } = require('sequelize');

const CustomInteger = () => ({ 
  type: DataTypes.INTEGER,
  defaultValue: 0,
  allowNull: false,
  validate: {
    isInt: true,
    notNaN(value) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Value must be a valid number and cannot be NaN.');
      }
    }
  }
});

const CustomFloat = () => ({ 
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

const CustomString = () => ({ 
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

const CustomText = () => ({ 
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

module.exports = {
  CustomInteger,
  CustomFloat,
  CustomString,
  CustomText
}
