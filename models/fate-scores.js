module.exports = (sequelize, DataTypes) => {
  return sequelize.define('FateScores', {
    user_id: DataTypes.STRING,
    trials_with_fate: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lucky: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    unlucky: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    ultra_rare_plus: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    heads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lucky_heads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    unlucky_heads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    ultra_lucky_heads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    tails: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lucky_tails: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    unlucky_tails: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    ultra_lucky_tails: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    coins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    one_credit: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    fifty_parts: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    twenty_five_parts: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    fortune: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
  }, {
    hooks: {
      beforeCreate: (fateScores) => {
        calculateTotals(fateScores);
      },
      beforeUpdate: (fateScores) => {
        calculateTotals(fateScores);
      },
      afterFind: (fateScores) => {
        if (Array.isArray(fateScores)) {
          fateScores.forEach(fateScore => {
            calculateTotals(fateScore);
          });
        }
        else if (fateScores) {
            calculateTotals(fateScores);
        }
      }
    }
  });

  function calculateTotals(fateScores) {
    fateScores.lucky = fateScores.lucky_heads + fateScores.lucky_tails;
    fateScores.unlucky = fateScores.unlucky_heads + fateScores.unlucky_tails;
    fateScores.heads = fateScores.lucky_heads + fateScores.unlucky_heads + fateScores.ultra_lucky_heads;
    fateScores.tails = fateScores.lucky_tails + fateScores.unlucky_tails + fateScores.ultra_lucky_tails;
    fateScores.coins = fateScores.one_credit + fateScores.fifty_parts + fateScores.twenty_five_parts;
    fateScores.fortune = fateScores.one_credit + ((fateScores.fifty_parts * 50) / 100) + ((fateScores.twenty_five_parts * 25) / 100);
    fateScores.trials_with_fate = fateScores.lucky + fateScores.unlucky + fateScores.ultra_rare_plus;
  }
};
