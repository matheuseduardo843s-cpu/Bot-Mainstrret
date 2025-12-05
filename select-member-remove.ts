import { Component } from "@/discord/base";
import { ComponentType, GuildMember, TextChannel } from "discord.js";

new Component({
  customId: "select-member-remove",
  type: ComponentType.StringSelect,
  cache: "cached",
  async run(interaction) {
    try {
      const channel = interaction.channel as TextChannel;
      const userId = interaction.values[0];

      await channel.permissionOverwrites.delete(userId);
      await interaction.reply({ content: `✅ <@${userId}> removido do ticket.`, ephemeral: true });
    } catch {
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  }
});
