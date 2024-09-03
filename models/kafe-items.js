module.exports = (sequelize, DataTypes) => {
  return sequelize.define('KafeItems', {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
    value: {
      type: DataTypes.STRING,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: 'I am the void.'
    },
    content: {
      type: DataTypes.TEXT,
      defaultValue: 'Be consumed by the void.'
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    energy_replen: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { min: 0, max: 0 }
    },
    uses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: 1
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'void'
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'void'
    },
  }, {
    timestamps: false,
  });
}
