import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';

const environment = process.env.NODE_ENV || 'dev';
let token;
let clientId;
let guildIds;
const commands = [];

async function loadConfig() {
  try {
    const config = await import(`../config/${environment}-config.json`, { assert: { type: 'json' } });
    token = config.default.token;
    clientId = config.default.clientId;
    guildIds = config.default.guildIds;
    console.log(`[LOG] guildIds`, guildIds);
    console.log(`[LOG] Configuration deploy-commands script loaded successfully.`);
  } catch (e) {
    console.error(`[ERROR] Error loading  configuration for deploy-commands script:`, e);
    process.exit(1);
  }
};

async function loadCommands() {
  const dirPath = path.join(process.cwd(), 'commands');
  const commandsDir = fs.readdirSync(dirPath);

  for (const dir of commandsDir) {
    const commandsPath = path.join(dirPath, dir);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = (await import(filePath)).default;
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      }
      else {
        console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
      }
    }
  }
}

async function initializeScript() {
  await loadConfig();
  await loadCommands();
}

await initializeScript();

const rest = new REST().setToken(token);

async function deployCommands() {
  try {
    console.log(`[LOG] Started refreshing ${commands.length} application (/) commands.`)
    console.log(`[LOG] commands:`, commands);

    for (const guildId of guildIds) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`[LOG] GuildId ${guildId}: Successfully reloaded ${data.length} application (/) commands.`);
    }

  }
  catch (error) {
    console.error('[ERROR] There was an error deploying commands:', error);
    process.exit(1);
  }
  finally {
    process.exit(0);
  }
}

await deployCommands();
