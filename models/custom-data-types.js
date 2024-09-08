const { DataTypes } = require('sequelize');

const CustomInteger = () => ({ 
  type: DataTypes.INTEGER,
  defaultValue: 0,
  allowNull: false,
  validate: {
    isInt: true,
    notNaN(value) {
      if (isNaN(value)) {
        throw new Error('Value cannot be NaN');
      }
    }
  }
});

module.exports = {
  CustomInteger
}
