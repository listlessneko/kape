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

async function loadMenus() {

  let filePath;

  try {
    const pathKafeMenus = path.join(process.cwd(), 'kafe-menus');
    const menuDir = fs.readdirSync(pathKafeMenus);

    for (let dir of menuDir) {
      const menuPath = path.join(pathKafeMenus, dir);
      const menuFiles = fs.readdirSync(menuPath).filter(file => file.endsWith('menu.js'));

      for (let file of menuFiles) {
        filePath = path.join(menuPath, file);
        const menu = await import(filePath);
        //logger.debug(`[DEBUG] index.js Loading menu:`, menu);

        if ('content' in menu && 'row' in menu && 'customId' in menu) {
          client.cache['menus'].set(menu.customId, {
            content: menu.content,
            row: menu.row
          });
          //logger.debug(`[DEBUG] index.js Menu '${menu.customId}' set in cache.`);
        }
        else {
          //logger.debug(`[DEBUG] index.js Menu '${menu.customId}' not set in cache.`);
          logger.warn(`[WARNING] The menu at ${filePath} is missing a required 'data', 'execute', or 'customId' property.`);
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

test('refreshSupplies waits for testMutex to be released', async () => {
  const mutexName = 'SuppliesMutexes';
  const testMutex = MutexServices.getOrSetMutex(1, mutexName);

  // Acquire the mutex in the first task
  const testRelease = await testMutex.acquire();

  let isRefreshSuppliesExecuted = false;

  // Simulate refreshSupplies execution in another task
  const refreshPromise = (async () => {
      await InventoryServices.refreshSupplies();
      isRefreshSuppliesExecuted = true;
  })();

  // Check that refreshSupplies has not yet executed
  expect(isRefreshSuppliesExecuted).toBe(false);

  // Release the mutex
  await testRelease();

  // Wait for the refreshSupplies task to complete
  await refreshPromise;

  // Ensure refreshSupplies has now executed
  expect(isRefreshSuppliesExecuted).toBe(true);
});

