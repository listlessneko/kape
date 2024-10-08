const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const environment = process.env.NODE_ENV || 'dev';
const { token, clientId, guildIds } = require(`../config/${environment}-config.json`);

const commands = [];
const dirPath = path.join(__dirname, '..', 'commands');
const commandsDir = fs.readdirSync(dirPath);

for (const dir of commandsDir) {
  const commandsPath = path.join(dirPath, dir);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
    else {
      console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)

    for (const guildId of guildIds) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`GuildId ${guildId}: Successfully reloaded ${data.length} application (/) commands.`);
    }

  }
  catch (error) {
    console.error('There was an error deploying commands:', error);
  }
  finally {
    process.exit();
  }
})();
