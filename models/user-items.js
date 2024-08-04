module.exports = (sequelize, DataTypes) => {
  return sequelize.define('user_items', {
    user_id: DataTypes.STRING,
    item_id: DataTypes.INTEGER,
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    }
  });
}
