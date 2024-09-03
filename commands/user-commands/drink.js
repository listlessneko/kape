const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
const { Users, KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('drink')
    .setDescription('Consume a drink.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from cafe and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a drink from your inventory.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'order') {
      const subMenu = client.menus.get('drinks-sub-menu');
      const response = await interaction.reply({
        content: subMenu.content,
        components: [subMenu.row]
      });

      try {
        const collector = await response.createMessageComponentCollector({
          componenttype: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const menu = client.menus.get(i.values[0])
          const selectedValue = i.values[0];

          if (i.user.id === interaction.user.id) {
            if (menu) {
              await i.update({
                content: menu.content,
                components: [menu.row]
              });
            }

            else if (!menu) {
              if (selectedValue === 'nevermind') {
                await i.update({
                  content: `Oh, Maybe next time.`,
                  components: []
                });
                collector.stop('Drink Cmd: User canceled order.');
                return;
              }

              const item = await KafeServices.findItem(selectedValue);
              const user = await UserServices.getUsers({requestModelInstance: false}, interaction.user.id);

              try {
                if (item) {
                  try {
                    if (item.cost <= user.balance) {
                      const a = await UserServices.subtractBalance(item.cost, user.user_id);
                      console.log('a:', a);
                      const b = await UserServices.addEnergy(item.energy_replen.max, user.user_id);
                      console.log('b:', b);
                      await interaction.editReply({
                        content: `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You drink all of it in one gulp.*\nYou have gained **${item.energy_replen.max} energy**.`,
                        components: []
                      });
                      return collector.stop('Drink Cmd: Drink consumed from cafe.');
                    }
                    else if (item.cost > user.balance) {
                      return await interaction.editReply({
                        content: `Hm... You don't have enough credits. Maybe come back next time.`,
                        components: []
                      });
                    }
                  }
                  catch (e) {
                    return console.error('Drink Cmd: An unexpected error occurred in evaluating item cost and user balance:', e);
                  }
                }
              }
              catch (e) {
                return console.error('Drink Cmd: Not an item. error:', e);
              }
            }
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });
        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Drink Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          }
          return console.log('Drink Cmd:', reason);
        });
      }
      catch (e) {
        console.error('Drink Cmd: An unexpected error occurred:', e);
        return await i.update({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }

    else if (subcommand === 'inventory') {
      const inventory = new StringSelectMenuBuilder()
        .setCustomId('inventory')
        .setPlaceholder('View your inventory.')

      const userItems = await UserItemsServices.getUserItems({requestModelInstance: false}, interaction.user.id);

      userItems.forEach(userItem => {
        console.log('Drink Cmd - UserItem:', userItem);
        const item = userItem.kafeItem;
        console.log('Drink Cmd - Item:', item);
        //console.log('Drink Cmd - Item Data Values:', item.dataValues);
        console.log('Drink Cmd - Item Category:', item.category);
        if (item.category === 'drinks') {
          inventory.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(
                (() => {
                  if (i.energy_replen.min === i.energy_replen.max) {
                    return `${i.name} (${i.cost} credits, ${i.energy_replen.max} energy)`;
                  }
                  else {
                    return `${i.name} (${i.cost} credits, ${i.energy_replen.min} - ${i.energy_replen.max} energy)`;
                  }
                })()
              )
              .setValue(item.value)
              .setDescription(item.description)
          )
        }
      });

      if (inventory.options.length === 0) {
        return await interaction.reply({
          content: `*You ruffle through your bag and realize you don't have any food...*`
        });
      }

      inventory.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Nevermind')
          .setValue('nevermind')
          .setDescription('Close bag.')
      )

      const row = new ActionRowBuilder().addComponents(inventory);

      const response = await interaction.reply({
        content: `*You ruffle through your bag. Hm...*`,
        components: [row]
      });

      try {
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];

          if (selectedValue === 'nevermind') {
            await i.update({
              content: `*You close your bag.*`,
              components: []
            });
            return collector.stop('Drink Cmd: User closed bag.')
          }

          if (i.user.id === interaction.user.id) {
            const item = await KafeServices.findItem(selectedValue);
            console.log('Drink Cmd: Item:', item);
            const user = interaction.user.id;
            await UserItemsServices.removeItems(item, 1, user);
            await UserServices.addEnergy(item.energy_replen.max, user);
            await i.update({
              content: `*You gulp down the entire beverage.*\nYou have gained **${item.energy_replen.max} energy**.`,
              components: []
            });
            return collector.stop('Drink Cmd: Drink consumed from inventory.');
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Drink Cmd: time limit reached.');
            return interaction.editReply({
              content: `Distracted? Give it some more thought.`,
              components: []
            });
          }
          else {
            return console.log(reason);
          }
        });
      }
      catch (e) {
        console.error('Drink Cmd: An unexpected error occurred:', e);
        return await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
  }
}
