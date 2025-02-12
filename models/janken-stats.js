import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const JankenStats = sequelize.define('JankenStats', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  battles: {
    ...CustomDataTypes.Integer(),
  },
  wins: {
    ...CustomDataTypes.Integer(),
  },
  losses: {
    ...CustomDataTypes.Integer(),
  },
  draws: {
    ...CustomDataTypes.Integer(),
  },
  rock: {
    ...CustomDataTypes.Integer(),
  },
  rock_wins: {
    ...CustomDataTypes.Integer(),
  },
  rock_losses: {
    ...CustomDataTypes.Integer(),
  },
  rock_draws: {
    ...CustomDataTypes.Integer(),
  },
  paper: {
    ...CustomDataTypes.Integer(),
  },
  paper_wins: {
    ...CustomDataTypes.Integer(),
  },
  paper_losses: {
    ...CustomDataTypes.Integer(),
  },
  paper_draws: {
    ...CustomDataTypes.Integer(),
  },
  scissors: {
    ...CustomDataTypes.Integer(),
  },
  scissors_wins: {
    ...CustomDataTypes.Integer(),
  },
  scissors_losses: {
    ...CustomDataTypes.Integer(),
  },
  scissors_draws: {
    ...CustomDataTypes.Integer(),
  },
  energy_spent: {
    ...CustomDataTypes.Integer(),
  },
  fortune: {
    ...CustomDataTypes.Float(),
  },
}, {
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
  }
);

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
