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
        beforeCreate: (RPSScores) => {
          calculateTotals(RPSScores);
        },
        beforeUpdate: (RPSScores) => {
          calculateTotals(RPSScores);
        },
        afterFind: (RPSScores) => {
          if (Array.isArray(RPSScores)) {
            RPSScores.forEach(RPSScore => {
              calculateTotals(RPSScore);
            });
          }
          else if (RPSScores) {
            calculateTotals(RPSScores);
          }
        },
      }
    });

  function calculateTotals(RPSScores) {
    RPSScores.wins = RPSScores.rock_wins + RPSScores.paper_wins + RPSScores.scissors_wins;
    RPSScores.losses = RPSScores.rock_losses + RPSScores.paper_losses + RPSScores.scissors_losses;
    RPSScores.draws = RPSScores.rock_draws + RPSScores.paper_draws + RPSScores.scissors_draws;
    RPSScores.rock = RPSScores.rock_wins + RPSScores.rock_losses + RPSScores.rock_draws;
    RPSScores.paper = RPSScores.paper_wins + RPSScores.paper_losses + RPSScores.paper_draws;
    RPSScores.scissors = RPSScores.scissors_wins + RPSScores.scissors_losses + RPSScores.scissors_draws;
    RPSScores.battles = RPSScores.wins + RPSScores.losses + RPSScores.draws;
  }
};
