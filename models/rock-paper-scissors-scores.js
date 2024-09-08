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
      timestamps: false,
      hooks: {
        beforeSave: (rpsScores) => {
          if (hasChanged(rpsScores)) {
            calculateTotals(rpsScores);
          }
        },
        afterFind: (rpsScores) => {
          if (Array.isArray(rpsScores)) {
            rpsScores.forEach(rpsScore => {
              if (hasChanged(rpsScore)) {
                calculateTotals(rpsScore);
              }
            });
          }
          else if (rpsScores) {
            if (hasChanged(rpsScores)) {
              calculateTotals(rpsScores);
            }
          }
        }
      }
    });

};

function hasChanged(rpsScores) {
  const relevantFields = [
    'rock_wins',
    'rock_losses',
    'rock_draws',
    'paper_wins',
    'paper_losses',
    'paper_draws',
    'scissors_wins',
    'scissors_losses',
    'scissors_draws',
  ];

  return relevantFields.some(field => rpsScores.changed(field));
}

function calculateTotals(rpsScores) {
  rpsScores.wins = rpsScores.rock_wins + rpsScores.paper_wins + rpsScores.scissors_wins;
  rpsScores.losses = rpsScores.rock_losses + rpsScores.paper_losses + rpsScores.scissors_losses;
  rpsScores.draws = rpsScores.rock_draws + rpsScores.paper_draws + rpsScores.scissors_draws;
  rpsScores.rock = rpsScores.rock_wins + rpsScores.rock_losses + rpsScores.rock_draws;
  rpsScores.paper = rpsScores.paper_wins + rpsScores.paper_losses + rpsScores.paper_draws;
  rpsScores.scissors = rpsScores.scissors_wins + rpsScores.scissors_losses + rpsScores.scissors_draws;
  rpsScores.battles = rpsScores.wins + rpsScores.losses + rpsScores.draws;
}
