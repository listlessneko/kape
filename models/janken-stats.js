module.exports = (sequelize, DataTypes) => {
  return sequelize.define('JankenStats', {
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
        beforeSave: (instance) => {
          if (hasChanged(instance)) {
            calculateTotals(instance);
          }
        },
        afterFind: (instances) => {
          if (Array.isArray(instances)) {
            instances.forEach(instance => {
              if (hasChanged(instance)) {
                calculateTotals(instance);
              }
            });
          }
          else if (instances) {
            if (hasChanged(instances)) {
              calculateTotals(instances);
            }
          }
        }
      }
    });

};

function hasChanged(instance) {
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

  return relevantFields.some(field => instance.changed(field));
}

function calculateTotals(instances) {
  instances.wins = instances.rock_wins + instances.paper_wins + instances.scissors_wins;
  instances.losses = instances.rock_losses + instances.paper_losses + instances.scissors_losses;
  instances.draws = instances.rock_draws + instances.paper_draws + instances.scissors_draws;
  instances.rock = instances.rock_wins + instances.rock_losses + instances.rock_draws;
  instances.paper = instances.paper_wins + instances.paper_losses + instances.paper_draws;
  instances.scissors = instances.scissors_wins + instances.scissors_losses + instances.scissors_draws;
  instances.battles = instances.wins + instances.losses + instances.draws;
}
