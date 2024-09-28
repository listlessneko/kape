const path = require('node:path');

const items = require('./items.json');
const customers = require('./customers.json');

const { populateItems, populateCustomers } = require('./functions/populate-db.js');

const Sequelize = require('sequelize');
const userBaristaStats = require('../models/user-barista-stats.js');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: path.resolve(__dirname, 'database.sqlite')
});

const KafeItems = require(path.join(__dirname, '..', 'models', 'kafe-items'))(sequelize, Sequelize.DataTypes);
const Users = require(path.join(__dirname, '..', 'models', 'users'))(sequelize, Sequelize.DataTypes);
const UserItems = require(path.join(__dirname, '..', 'models', 'user-items'))(sequelize, Sequelize.DataTypes);
const UserLevels = require(path.join(__dirname, '..', 'models', 'user-levels'))(sequelize, Sequelize.DataTypes);
const Customers = require(path.join(__dirname, '..', 'models', 'customers'))(sequelize, Sequelize.DataTypes);
const UserCustomerStats = require(path.join(__dirname, '..', 'models', 'user-customer-stats'))(sequelize, Sequelize.DataTypes);
const UserBaristaStats = require(path.join(__dirname, '..', 'models', 'user-barista-stats'))(sequelize, Sequelize.DataTypes);
//const UserLevels = require('../models/user-levels')(sequelize, Sequelize.DataTypes);
const RPSScores = require(path.join(__dirname, '..', 'models', 'rock-paper-scissors-scores'))(sequelize, Sequelize.DataTypes);
const FateScores = require(path.join(__dirname, '..', 'models', 'fate-scores'))(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('--f');

async function initializeDatabase() {
  //KafeItems.sync({ force: true }).then(async () => {
  // await populateItems(KafeItems, items);
  //});
  Customers.sync({ force: true }).then(async () => {
    await populateCustomers(Customers, customers);
  });
  //await Users.sync({ force: true });
  //await UserLevels.sync({ force: true });
  await UserCustomerStats.sync({ force: true });
  await UserBaristaStats.sync({ force: true });
  //await UserItems.sync({ force: true });
  //await RPSScores.sync({ force: true });
  //await FateScores.sync({ force: true });
  console.log('Database initialized.')
}

initializeDatabase();
//
//sequelize.sync({ force }).then(async () => {
//  try {
//    await populateItems(KafeItems, items);
//    console.log(`All 'Kafe Items' upserted.`);
//    const itemsData = await KafeItems.findAll();
//    console.log('Kafe Items:', JSON.stringify(itemsData, null, 2)); // Pretty print JSON
//  }
//  catch (error) {
//    console.log(`'Kafe Items' failed to upsert.`, error);
//  } finally {
//    await sequelize.close();
//  }
//}).catch(error => {
//  console.error('Failed to sync database:', error);
//});

