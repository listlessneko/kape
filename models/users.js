module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Users', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    energy: {
      type: DataTypes.FLOAT,
      defaultValue: 100,
      allowNull: false,
    },
    max_energy: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    min_energy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    timestamps: false,
  });
}
