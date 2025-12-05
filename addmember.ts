import { Component } from "@/discord/base";
import { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from "discord.js";

new Component({
  customId: "add-member",
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
      if (!interaction.guild) return;

      // Cria select menu com membros do servidor
      const selectMenu = new StringSelectMenuBuilder({
        customId: "select-member-add",
        placeholder: "Escolha um membro para adicionar",
        options: interaction.guild.members.cache.map(m => ({
          label: m.user.username,
          value: m.id
        })).slice(0, 25), // max 25 opções
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      await interaction.reply({ content: "Selecione o membro que deseja adicionar:", components: [row], ephemeral: true });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});
