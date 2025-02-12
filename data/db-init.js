import { Sequelize } from 'sequelize';
import * as Models from '../models/models-barrel.js';

import * as Database from './functions/populate-db.js';
import kafeItems from './kafe-items.json' assert { type: 'json' };
import supplies from './supplies.json' assert { type: 'json' };
import npcs from './npcs.json' assert { type: 'json' };

async function initializeDatabase() {
  await Models.Users.sync({ force: true });
  await Models.UserEnergy.sync({ force: true });
  await Models.UserLevel.sync({ force: true });
  await Models.UserBalance.sync({ force: true });
  await Models.UserItems.sync({ force: true });
  await Models.FateStats.sync({ force: true });
  await Models.JankenStats.sync({ force: true });
  await Models.BaristaStats.sync({ force: true });
  await Models.UserKafeBalance.sync({ force: true });
  await Models.UserKafeSupplies.sync({ force: true });
  await Models.UserKafeItems.sync({ force: true });
  await Models.UserNpcRelationship.sync({ force: true });
  await Models.UserNpccustomerOrders.sync({ force: true});
  await Models.UserNpcJankenStats.sync({ force: true });
  Models.KafeItems.sync({ force: true }).then(async () => {
    await Database.populateItems(Models.KafeItems, kafeItems);
  });
  Models.Supplies.sync({ force: true }).then(async () => {
    await Database.populateSupplies(Models.Supplies, supplies);
  });
  Models.Npcs.sync({ force: true }).then(async () => {
    await Database.populateNpcs(Models.Npcs, npcs);
  });
  console.log('[LOG] Database initialized.');
}

await initializeDatabase();

export { Models };
