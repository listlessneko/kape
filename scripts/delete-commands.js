const { REST, Routes } = require('discord.js');

const environment = process.env.NODE_ENV || 'dev';
const { token, clientId, guildIds } = require(`../config/${environment}-config.json`);

const rest = new REST().setToken(token);

const commandIds = [
  '1288589638281199628',
  '1288589638180671506',
  '1288589638281199629',
  '1288589638281199634',
  '1288589638394712106',
];

const guildIdsList = [];

for (const guildId of guildIds) {
  guildIdsList.push(guildId)
}
for (const commandId of commandIds) {
  rest.delete(Routes.applicationGuildCommand(clientId, guildIdsList[0], commandId))
    .then(() => console.log('Successfully deleted guild command'))
    .catch(console.error);
}
