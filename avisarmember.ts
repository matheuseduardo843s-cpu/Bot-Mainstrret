import { Component } from "@/discord/base";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";

new Component({
  customId: "warn-member",
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
      const channel = interaction.channel;

      const ticketOwnerId = channel?.topic;
      if (!ticketOwnerId) return;

      const user = await interaction.guild?.members.fetch(ticketOwnerId);

      const embed = new EmbedBuilder()
        .setTitle("📬 Seu ticket recebeu uma resposta!")
        .setDescription("Clique no botão abaixo para acessar o ticket.")
        .setColor(0x00ff00);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel("Ir para o ticket").setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${interaction.guild?.id}/${channel?.id}`)
      );

      await user?.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: "✅ O usuário foi avisado no privado.", ephemeral: true });

    } catch {
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});
