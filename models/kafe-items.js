module.exports = (sequelize, DataTypes) => {
  return sequelize.define('KafeItems', {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
    value: DataTypes.STRING,
    description: DataTypes.TEXT,
    cost: DataTypes.FLOAT,
    uses: DataTypes.FLOAT,
    category: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    timestamps: false,
  });
}
