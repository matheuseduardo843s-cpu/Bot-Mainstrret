import { Component } from "@/discord/base";
import {
  ButtonInteraction,
  TextChannel,
  GuildMember,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from "discord.js";

// ID do botão
const BUTTON_ID = "move-ticket";

new Component({
  customId: BUTTON_ID,
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction: ButtonInteraction) {
    try {
      const member = interaction.member as GuildMember;

      // Apenas staff
      if (!member.roles.cache.has(process.env.CARGO_STAFF ?? "")) {
        return interaction.reply({ content: "❌ Apenas staff pode mover tickets.", ephemeral: true });
      }

      const channel = interaction.channel as TextChannel;
      if (!channel || channel.type !== 0) {
        return interaction.reply({ content: "❌ Este botão só funciona em tickets.", ephemeral: true });
      }

      // Pegar categorias do servidor
      const categories = interaction.guild?.channels.cache.filter(
        c => c.type === 4 // GuildCategory
      );

      if (!categories || categories.size === 0) {
        return interaction.reply({ content: "❌ Nenhuma categoria encontrada.", ephemeral: true });
      }

      // Criar select menu com categorias
      const select = new StringSelectMenuBuilder()
        .setCustomId("move-ticket-select")
        .setPlaceholder("Selecione a categoria para mover o ticket")
        .addOptions(
          categories.map(c => ({
            label: c.name,
            value: c.id,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      await interaction.reply({
        content: "Escolha a nova categoria:",
        components: [row],
        ephemeral: true,
      });
    } catch (err) {
      console.error("Erro ao abrir select menu para mover ticket:", err);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});

// Component para processar a seleção do menu
new Component({
  customId: "move-ticket-select",
  type: ComponentType.StringSelect,
  cache: "cached",
  async run(interaction) {
    try {
      const selectedCategoryId = interaction.values[0];
      const channel = interaction.channel as TextChannel;

      if (!channel || channel.type !== 0) {
        return interaction.reply({ content: "❌ Este menu só funciona em tickets.", ephemeral: true });
      }

      await channel.setParent(selectedCategoryId);

      await interaction.reply({
        content: `✅ Ticket movido para a categoria <#${selectedCategoryId}>!`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("Erro ao mover ticket:", err);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro ao mover o ticket.", ephemeral: true });
    }
  },
});
