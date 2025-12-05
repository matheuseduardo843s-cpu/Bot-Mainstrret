import { Component } from "@/discord/base";
import { ComponentType, GuildMember } from "discord.js";

new Component({
  customId: "select-member-add",
  type: ComponentType.StringSelect,
  cache: "cached",
  async run(interaction) {
    try {
      const channel = interaction.channel as TextChannel;
      const userId = interaction.values[0];

      await channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      await interaction.reply({ content: `✅ <@${userId}> adicionado ao ticket.`, ephemeral: true });
    } catch {
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  }
});
