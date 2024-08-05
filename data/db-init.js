const path = require('node:path');

const items = require(path.join(__dirname, 'items.json'));

const { populateItems } = require(path.join(__dirname, 'functions', 'populate-items.js'));

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: path.resolve(__dirname, 'database.sqlite')
});

const KafeItems = require(path.join(__dirname, '..', 'models', 'kafe-items'))(sequelize, Sequelize.DataTypes);
require(path.join(__dirname, '..', 'models', 'users'))(sequelize, Sequelize.DataTypes);
require(path.join(__dirname, '..', 'models', 'user-items'))(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('--f');

sequelize.sync({ force }).then(async () => {
  try {
    await populateItems(KafeItems, items);
    console.log(`All 'Kafe Items' upserted.`);
    const itemsData = await KafeItems.findAll();
    console.log('Kafe Items:', JSON.stringify(itemsData, null, 2)); // Pretty print JSON
  }
  catch (error) {
    console.log(`'Kafe Items' failed to upsert.`, error);
  } finally {
    await sequelize.close();
  }
}).catch(error => {
  console.error('Failed to sync database:', error);
});

