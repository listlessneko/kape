const path = require('node:path');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: path.resolve(__dirname, 'database.sqlite')
});

const Users = require(path.join(__dirname, '..', 'models', 'users.js'))(sequelize, Sequelize.DataTypes);
const KafeItems = require(path.join(__dirname, '..', 'models', 'kafe-items.js'))(sequelize, Sequelize.DataTypes);
const UserItems = require(path.join(__dirname, '..', 'models', 'user-items.js'))(sequelize, Sequelize.DataTypes);
const RPSScores = require(path.join(__dirname, '..', 'models', 'rock-paper-scissors-scores.js'))(sequelize, Sequelize.DataTypes);
const FateScores = require(path.join(__dirname, '..', 'models', 'fate-scores.js'))(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(KafeItems, { foreignKey: 'item_id', as: 'kafeItem' });
KafeItems.hasMany(UserItems, { foreignKey: 'item_id', as: 'kafeItem' });

module.exports = {
  sequelize,
  Op: Sequelize.Op,
  Users,
  KafeItems,
  UserItems,
  RPSScores,
  FateScores
}
