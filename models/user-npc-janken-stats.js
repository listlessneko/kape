import * as CustomDataTypes from './custom-data-types.js';
import { sequelize } from '../data/db.js';
import { DataTypes } from 'sequelize';

export const UserNpcJankenStats = sequelize.define('UserNpcJankenStats', {
  id: {
    ...CustomDataTypes.String(),
    primaryKey: true,
  },
  user_id: {
    ...CustomDataTypes.String(),
  },
  npc_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Npcs',
      key: 'id'
    }
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
    beforeValidate: (instance) => {
      if (instance.user_id !== null && instance.npc_id !== null) {
        instance.id = `${instance.user_id}:${instance.npc_id}`;
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

function calculateTotals(instance) {
  instance.wins = instance.rock_wins + instance.paper_wins + instance.scissors_wins;
  instance.losses = instance.rock_losses + instance.paper_losses + instance.scissors_losses;
  instance.draws = instance.rock_draws + instance.paper_draws + instance.scissors_draws;
  instance.rock = instance.rock_wins + instance.rock_losses + instance.rock_draws;
  instance.paper = instance.paper_wins + instance.paper_losses + instance.paper_draws;
  instance.scissors = instance.scissors_wins + instance.scissors_losses + instance.scissors_draws;
  instance.battles = instance.wins + instance.losses + instance.draws;
}
