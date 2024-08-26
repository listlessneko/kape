module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RPSScores', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  },
    {
      timestamps: false
    });
};
