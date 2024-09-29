const { CustomString, CustomText, CustomInteger } = require('./custom-data-types');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Npcs', {
    npc_id: {
      type: CustomInteger(),
      primaryKey: true
    },
    name: CustomString(),
    descriptive_name: CustomString(),
    proper_name: CustomString(),
    janken: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [
        {
          choice: 'rock',
          weight: 1
        },
        {
          choice: 'paper',
          weight: 1
        },
        {
          choice: 'scissors',
          weight: 1
        }
      ]
    }
  }, {
    timestamps: false
  });
}
