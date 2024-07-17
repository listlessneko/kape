const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');

const { token } = require(path.join(__dirname, 'config.json'));

const { client } = require(path.join(__dirname, 'client.js'));

client.commands = new Collection();
client.cooldowns = new Collection();
client.currency = new Collection();

const commandsPath = path.join(__dirname, 'commands'); 
const commandDir = fs.readdirSync(commandsPath);

for (const dir of commandDir) {
  const commandPath = path.join(commandsPath, dir);
  const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

  for (file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
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

client.login(token);
