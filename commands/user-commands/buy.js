const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const items = require(path.join(__dirname, '..', '..', 'data', 'items.json'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the cafe.'),

  async execute(interaction) {
    const mainMenu = client.menus.get('main-menu');
    const response = await interaction.reply({
      content: mainMenu.content,
      components: [mainMenu.row]
    });

    try {
      const collector = await response.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect, 
        time: 60_000 
      });

      collector.on('collect', async i => {
        const menu = client.menus.get(i.values[0]);

        if (i.user.id === interaction.user.id) {
          if (!menu) {
            await i.update({
              content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
              components: [],
            });
            console.error(`No select menu matching '${i.values[0]}' was found.`);
            collector.stop('Cat is causing trouble again.')
            return;
          }

          await i.update({
            content: menu.content,
            components: [menu.row]
          });
        }

        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: `Please wait your turn.`,
            ephemeral: true
          });
        }

      });

      collector.on('end', (collected, reason) => {
        console.log(reason);
      });
    }
    catch (e) {
      await interaction.editReply({ 
        content: `Hm... Take your time then.`, 
        components: [] 
      });
    }
  },
}
