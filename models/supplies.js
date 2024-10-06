const { CustomString, CustomText, CustomInteger, CustomFloat } = require('./custom-data-types.js');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('KafeItems', {
    name: {
      ...CustomString
    },
    value: {
      ...CustomString
    },
    description: {
      ...CustomText
    },
    cost: {
      ...CustomFloat
    },
    category: {
      ...CustomString
    },
    type: {
      ...CustomString
    },
  }, {
    timestamps: false,
  });
}
