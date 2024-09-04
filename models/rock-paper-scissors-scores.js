module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RPSScores', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    battles: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
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
    },
    rock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rock_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rock_losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rock_draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    paper: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    paper_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    paper_losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    paper_draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    scissors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    scissors_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    scissors_losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    scissors_draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    energy_spent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    fortune: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
  },
    {
      timestamps: false
    },
    {
      hooks: {
        beforeSave: (rpsScores) => {
          calculateTotals(rpsScores);
        },
        afterFind: (rpsScores) => {
          if (Array.isArray(rpsScores)) {
            rpsScores.forEach(rpsScore => {
              calculateTotals(rpsScore);
            });
          }
          else if (rpsScores) {
            calculateTotals(rpsScores);
          }
        }
      }
    });

  function calculateTotals(rpsScores) {
    rpsScores.wins = rpsScores.rock_wins + rpsScores.paper_wins + rpsScores.scissors_wins;
    rpsScores.losses = rpsScores.rock_losses + rpsScores.paper_losses + rpsScores.scissors_losses;
    rpsScores.draws = rpsScores.rock_draws + rpsScores.paper_draws + rpsScores.scissors_draws;
    rpsScores.rock = rpsScores.rock_wins + rpsScores.rock_losses + rpsScores.rock_draws;
    rpsScores.paper = rpsScores.paper_wins + rpsScores.paper_losses + rpsScores.paper_draws;
    rpsScores.scissors = rpsScores.scissors_wins + rpsScores.scissors_losses + rpsScores.scissors_draws;
    rpsScores.battles = rpsScores.wins + rpsScores.losses + rpsScores.draws;
  }
};
