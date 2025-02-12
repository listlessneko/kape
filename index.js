const environment = process.env.NODE_ENV || 'dev';
let token;

import { client } from './client.js';
import { logger } from './logger.js';
import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';
import { CronServices } from './cron/cron.js';

async function initMapCollections() {
  client.cache = {};
  client.mutex = {};
  const mainCacheNamesArr = [
    'commands',
    'cooldowns',
    'menus'
  ];

  try {
    for (let cacheName of mainCacheNamesArr) {
      logger.log(`[LOG] Initiating cache: ${cacheName}`);
      client.cache[cacheName] = new Collection();
    }
    logger.log(`[LOG] Main caches created.`);
  } catch (e) {
    logger.error(`[ERROR] Main caches failed to load.`);
  }
}

async function loadCommands() {

  let filePath;

  try {
    const commandsPath = path.join(process.cwd(), 'commands'); 
    const commandDir = fs.readdirSync(commandsPath);

    for (let dir of commandDir) {
      const commandPath = path.join(commandsPath, dir);
      const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

      for (let file of commandFiles) {
        filePath = path.join(commandPath, file);
        const command = (await import(filePath)).default;
        //logger.debug(`[DEBUG] index.js Loading command:`, command);

        if ('data' in command && 'execute' in command) {
          client.cache['commands'].set(command.data.name, command);
          //logger.debug(`[DEBUG] index.js Command '${command.data.name}' set in cache.`);
        }
        else {
          //logger.debug(`[DEBUG] index.js Command ${command.data.name} not set in cache.`);
          logger.warn(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
        }
      }
    }
    logger.log(`[LOG] Commands set in cache successfully.`);
  } catch (e) {
    logger.error(`[ERROR] The command at ${filePath} failed to load.`, e);
  }
}

async function registerEvents() {
  let filePath;

  try {
    const eventsPath = path.join(process.cwd(), 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (let file of eventFiles) {
      filePath = path.join(eventsPath, file);
      const event = (await import(filePath)).default;
      //logger.debug(`[DEBUG] Event:`, event);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      }
      else if (event.on) {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  } catch (e) {
    logger.error(`[ERROR] The event at ${filePath} failed to load.`, e);
  }
}

function loadIndivMenu(menu, filePath) {
  if ('content' in menu && 'row' in menu && 'customId' in menu) {
    client.cache['menus'].set(menu.customId, {
      customId: menu.customId,
      content: menu.content,
      row: menu.row
    });
    //logger.debug(`[DEBUG] index.js Menu '${menu.customId}' set in cache.`);
  } else if ('createMenu' in menu) {
    client.cache['menus'].set(menu.customId, {
      customId: menu.customId,
      createMenu: menu.createMenu
    });
    //logger.debug(`[DEBUG] index.js Menu '${menu.customId}' set in cache.`);
  }
  else {
    logger.debug(`[DEBUG] index.js Menu '${menu.customId}' not set in cache.`);
    logger.warn(`[WARNING] The menu at ${filePath} is missing a required 'content', 'row', or 'customId' property.`);
  }
  //logger.debug(`[DEBUG] index.js menu:`, menu.customId);
}

async function loadMenus() {

  let filePath;
  let menu;

  try {
    const pathAllMenus = path.join(process.cwd(), 'menus');
    const menuDir = fs.readdirSync(pathAllMenus);

    for (let firstDir of menuDir) {
      const firstMenuPath = path.join(pathAllMenus, firstDir);
      //const menuFiles = fs.readdirSync(menuPath).filter(file => file.endsWith('menu.js'));
      const firstDirEntries = fs.readdirSync(firstMenuPath);

      for (let firstEntry of firstDirEntries) {
        //logger.debug(`[DEBUG] index.js firstEntry:`, firstEntry);
        if (firstEntry.endsWith('menus')) {
          //logger.debug(`[DEBUG] index.js firstEntry:`, firstEntry);
          const secondMenuPath = path.join(firstMenuPath, firstEntry);
          const secondDirEntries = fs.readdirSync(secondMenuPath);

          for (let secondEntry of secondDirEntries) {
            filePath = path.join(secondMenuPath, secondEntry);
            menu = await import(filePath);
            //logger.debug(`[DEBUG] index.js firstEntry menu:`, menu.customId);
            loadIndivMenu(menu, filePath);
          }
        } else {
          filePath = path.join(firstMenuPath, firstEntry);
          //logger.debug(`[DEBUG] index.js Loading menu:`, filePath);
          menu = await import(filePath);
          //logger.debug(`[DEBUG] index.js Loading menu:`, menu);
          loadIndivMenu(menu, filePath);
        }
      }
    }
    logger.log(`[LOG] Menus set in cache successfully.`);
  } catch (e) {
    logger.error(`[ERROR] The menu at ${filePath} failed to load.`, e);
  }
}

async function loadConfig() {
  try {
    const config = await import(`./config/${environment}-config.json`, { assert: { type: 'json' } });
    token = config.default.token;
    logger.log(`[LOG] Client configuration loaded successfully.`);
  } catch (e) {
    logger.error(`[ERROR] Error loading client configuration:`, e);
    process.exit(1);
  }
};

async function initializeClient() {
  await loadConfig();

  try {
    await client.login(token);
    logger.log(`[LOG] Client logged in successfully.`)
  } catch (e) {
    logger.error(`[ERROR] Client failed to log in:`, e);
    process.exit(1);
  }
}

async function main() {
  await initMapCollections();
  await loadCommands();
  await registerEvents();
  await loadMenus();
  await CronServices.setUpJobSchedules();
  await initializeClient();
}

await main().catch(e => {
  logger.error(`[ERROR] Failed to fully initialize bot:`, e);
  process.exit(1);
});
