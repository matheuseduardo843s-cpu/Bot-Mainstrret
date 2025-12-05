import { Component } from "@/discord/base";
import { ButtonStyle, ComponentType, GuildMember, TextChannel } from "discord.js";

new Component({
  customId: "assume-ticket",
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
      const member = interaction.member as GuildMember;
      const channel = interaction.channel as TextChannel;

      if (!member.roles.cache.has(process.env.CARGO_STAFF ?? "")) 
        return interaction.reply({ content: "❌ Apenas staff pode assumir tickets.", ephemeral: true });

      channel.permissionOverwrites.cache.forEach(o => {
        if (o.allow.has("ManageChannels")) channel.permissionOverwrites.edit(o.id, { ManageChannels: false });
      });

      await channel.permissionOverwrites.edit(member.id, { ManageChannels: true });
      await channel.send(`✅ Ticket assumido por <@${member.id}>. Apenas ele poderá finalizar.`);
      await interaction.reply({ content: "✅ Você assumiu o ticket.", ephemeral: true });

    } catch {
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});
