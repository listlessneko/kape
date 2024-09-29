const path = require('node:path');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: path.resolve(__dirname, 'database.sqlite')
});

const Users = require(path.join(__dirname, '..', 'models', 'users.js'))(sequelize, Sequelize.DataTypes);
const UserLevels = require(path.join(__dirname, '..', 'models', 'user-levels.js'))(sequelize, Sequelize.DataTypes);
const Npcs = require(path.join(__dirname, '..', 'models', 'npcs'))(sequelize, Sequelize.DataTypes);
const Customers = require(path.join(__dirname, '..', 'models', 'customers'))(sequelize, Sequelize.DataTypes);
const UserCustomerStats = require(path.join(__dirname, '..', 'models', 'user-customer-stats'))(sequelize, Sequelize.DataTypes);
const UserBaristaStats = require(path.join(__dirname, '..', 'models', 'user-barista-stats'))(sequelize, Sequelize.DataTypes);
const KafeItems = require(path.join(__dirname, '..', 'models', 'kafe-items.js'))(sequelize, Sequelize.DataTypes);
const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'))(sequelize, Sequelize.DataTypes);
const RPSScores = require(path.join(__dirname, '..', 'models', 'rock-paper-scissors-scores.js'))(sequelize, Sequelize.DataTypes);
const UserNpcJankenStats = require(path.join(__dirname, '..', 'models', 'user-npc-janken-stats'))(sequelize, Sequelize.DataTypes);
const FateScores = require(path.join(__dirname, '..', 'models', 'fate-scores.js'))(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(KafeItems, { foreignKey: 'item_id', as: 'kafeItem' });
KafeItems.hasMany(UserItems, { foreignKey: 'item_id', as: 'kafeItem' });

Users.belongsToMany(Customers, {
  through: UserCustomerStats,
  foreignKey: 'user_id',
  otherKey: 'customer_id'
});
Customers.belongsToMany(Users, {
  through: UserCustomerStats,
  foreignKey: 'customer_id',
  otherKey: 'user_id'
});

Users.belongsToMany(Npcs, {
  through: UserNpcJankenStats,
  foreignKey: 'user_id',
  otherKey: 'npc_id'
});
Npcs.belongsToMany(Users, {
  through: UserNpcJankenStats,
  foreignKey: 'npc_id',
  otherKey: 'user_id'
});

module.exports = {
  sequelize,
  Op: Sequelize.Op,
  Users,
  Npcs,
  UserLevels,
  Customers,
  UserCustomerStats,
  UserBaristaStats,
  KafeItems,
  UserItems,
  RPSScores,
  UserNpcJankenStats,
  FateScores
}
