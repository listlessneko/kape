const { CustomString, CustomText, CustomInteger, CustomFloat } = require('./custom-data-types');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserNpcJankenStats', {
    composite_key: CustomString(),
    user_id: {
      type: DataTypes.STRING,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    npc_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Npcs',
        key: 'npc_id'
      }
    },
    battles: CustomInteger(),
    wins: CustomInteger(),
    losses: CustomInteger(),
    draws: CustomInteger(),
    rock: CustomInteger(),
    rock_wins: CustomInteger(),
    rock_losses: CustomInteger(),
    rock_draws: CustomInteger(),
    paper: CustomInteger(),
    paper_wins: CustomInteger(),
    paper_losses: CustomInteger(),
    paper_draws: CustomInteger(),
    scissors: CustomInteger(),
    scissors_wins: CustomInteger(),
    scissors_losses: CustomInteger(),
    scissors_draws: CustomInteger(),
    energy_spent: CustomInteger(),
    fortune: CustomFloat(),
  },
    {
      timestamps: false,
      hooks: {
      beforeValidate: (instance) => {
        if (instance.user_id !== null && instance.npc_id !== null) {
          instance.composite_key = `${instance.user_id}:${instance.npc_id}`;
        }
        else {
          console.log('Model User Cusotmer Stats User Id:', instance.user_id);
          console.log('Model User Cusotmer Stats User Id:', instance.npc_id);
          throw new Error('Both user_id and customer_id must be provided.')
        }
      },
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

function calculateTotals(instance) {
  instance.wins = instance.rock_wins + instance.paper_wins + instance.scissors_wins;
  instance.losses = instance.rock_losses + instance.paper_losses + instance.scissors_losses;
  instance.draws = instance.rock_draws + instance.paper_draws + instance.scissors_draws;
  instance.rock = instance.rock_wins + instance.rock_losses + instance.rock_draws;
  instance.paper = instance.paper_wins + instance.paper_losses + instance.paper_draws;
  instance.scissors = instance.scissors_wins + instance.scissors_losses + instance.scissors_draws;
  instance.battles = instance.wins + instance.losses + instance.draws;
}
