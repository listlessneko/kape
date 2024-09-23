const { REST, Routes } = require('discord.js');
const { clientId, guildIds, token } = require('../config/config.json');

const rest = new REST().setToken(token);

const commandIds = [
  '1280394933014102084',
  '1280394933118828677',
  '1280394933118828678',
  '1282182650466930743',
  '1280394933118828685',
];

const guildIdsList = [];

for (const guildId of guildIds) {
  guildIdsList.push(guildId)
}
for (const commandId of commandIds) {
  rest.delete(Routes.applicationGuildCommand(clientId, guildIdsList[1], commandId))
    .then(() => console.log('Successfully deleted guild command'))
    .catch(console.error);
}
