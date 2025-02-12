import { setTimeout as wait } from 'node:timers/promises';

export const TextAnimationsServices = {
  async loadingEllipses(interaction, text) {
    let ellipses = '...';
    let i = 0;
    await interaction.editReply({
      content: `*${text}*`,
      components: []
    });
    await wait(500);

    while (i < 2) {
      await interaction.editReply({
        content: `*${text}${ellipses.slice(0, 1)}*`,
        components: []
      });
      await wait(500);
      await interaction.editReply({
        content: `*${text}${ellipses.slice(0, 2)}*`,
        components: []
      });
      await wait(500);
      await interaction.editReply({
        content: `*${text}${ellipses}*`,
        components: []
      });
      await wait(500);
      await interaction.editReply({
        content: `*${text}*`,
        components: []
      });
      await wait(500);
      i += 1;
    }
  }
};
