const { CustomInteger } = require('./custom-data-types.js');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserLevels', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    level: CustomInteger(),
    total_exp: CustomInteger(),
    prev_exp_req: CustomInteger(),
    current_level_exp: CustomInteger(),
    current_exp_req: CustomInteger(),
  }, {
    timestamps: false,
    hooks: {
      beforeSave: (UserLevels) => {
        if (hasChanged(UserLevels)) {
          calculateTotals(UserLevels);
        }
      },
      afterFind: (UserLevels) => {
        if (Array.isArray(UserLevels)) {
          UserLevels.forEach(UserLevel => {
            if (hasChanged(UserLevel)) {
              calculateTotals(UserLevel);
            }
          });
        }
        else if (UserLevels) {
          if (hasChanged(UserLevels)) {
            calculateTotals(UserLevels);
          }
        }
      },
    }
  });
}

function hasChanged(UserLevels) {
  const relevantFields = [
    'level',
    'prev_exp_req',
    'current_level_exp',
    'current_exp_req',
  ];

  return relevantFields.some(field => UserLevels.changed(field));
}

function calculateTotals(UserLevels) {
  if (UserLevels.changed('current_level_exp') && UserLevels.current_level_exp) {
    const expDifference = UserLevels.current_level_exp - UserLevels.previous('current_level_exp');
    UserLevels.total_exp += expDifference;
  }
}
