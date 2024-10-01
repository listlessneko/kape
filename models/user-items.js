module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserItems', {
    user_id: DataTypes.STRING,
    name: DataTypes.STRING,
    value: DataTypes.STRING,
    item_id: DataTypes.INTEGER,
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    //value: DataTypes.STRING,
    //description: DataTypes.TEXT,
    //content: DataTypes.TEXT,
    //cost: DataTypes.FLOAT,
    //energy_replen: DataTypes.FLOAT,
    //uses: DataTypes.FLOAT,
    //category: DataTypes.STRING,
    //type: DataTypes.STRING
  }, {
    timestamps: false,
  });
};
