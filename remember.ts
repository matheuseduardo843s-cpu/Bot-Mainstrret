import { Component } from "@/discord/base";
import { ActionRowBuilder, StringSelectMenuBuilder, ComponentType, GuildMember } from "discord.js";

new Component({
  customId: "remove-member",
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
      const member = interaction.member as GuildMember;
      if (!member.roles.cache.has(process.env.CARGO_STAFF ?? ""))
        return interaction.reply({ content: "❌ Apenas staff pode remover membros.", ephemeral: true });

      if (!interaction.guild) return;

      const selectMenu = new StringSelectMenuBuilder({
        customId: "select-member-remove",
        placeholder: "Escolha um membro para remover",
        options: interaction.guild.members.cache.map(m => ({
          label: m.user.username,
          value: m.id
        })).slice(0, 25),
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      await interaction.reply({ content: "Selecione o membro que deseja remover:", components: [row], ephemeral: true });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});
