const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

const environment = process.env.NODE_ENV || 'dev';
const { token } = require(`./config/${environment}-config.json`);

const { client } = require('./client.js');

const cacheArrNames = [
  'commands',
  'cooldowns',
  'menus',
  'usersCache',
  'userBaristaStatsCache',
  'userCustomerStatsCache',
  'userLevelsCache',
  'userItemsCache',
  'jankenStatsCache',
  'userNpcJankenStatsCache',
  'fateScoresCache'
];

client.cache = {};

for (let cacheName of cacheArrNames) {
  console.log('Cache:', cacheName);
  client.cache[cacheName] = new Collection();
}

console.log('Caches Created.');

const { CronServices } = require('./cron/cron.js');
CronServices.setUpJobSchedules();
//client.commands = new Collection();
//client.cooldowns = new Collection();
//client.menus = new Collection();
//client.usersCache = new Collection();
//client.userBaristaStatsCache = new Collection();
//client.userCustomerStatsCache = new Collection();
//client.userLevelsCache = new Collection();
//client.userItemsCache = new Collection();
//client.jankenStatsCache = new Collection();
//client.userNpcJankenStatsCache = new Collection();
//client.fateScoresCache = new Collection();

const commandsPath = path.join(__dirname, 'commands'); 
const commandDir = fs.readdirSync(commandsPath);

for (dir of commandDir) {
  const commandPath = path.join(commandsPath, dir);
  const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

  for (file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.cache['commands'].set(command.data.name, command);
    }
    else {
      console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
  client.once(event.name, (...args) => event.execute(...args));
  } 
  else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const pathKafeMenus = path.join(__dirname, 'kafe-menus');
const menuDir = fs.readdirSync(pathKafeMenus);

for (dir of menuDir) {
  const menuPath = path.join(pathKafeMenus, dir);
  const menuFiles = fs.readdirSync(menuPath).filter(file => file.endsWith('menu.js'));

  for (file of menuFiles) {
    const filePath = path.join(menuPath, file);
    const menu = require(filePath);

    if ('content' in menu && 'row' in menu && 'customId' in menu) {
      client.cache['menus'].set(menu.customId, {
        content: menu.content,
        row: menu.row
      });
    }
    else {
      console.log(`[WARNING] The command at ${filePath} is missing a required 'data', 'execute', or 'customId' property.`);
    }
  }
}

client.login(token);
