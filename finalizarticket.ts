import { Component } from "@/discord/base";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, GuildMember, TextChannel } from "discord.js";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import * as fs from "fs";
import * as path from "path";

new Component({
  customId: "finalizar-ticket",
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
      const member = interaction.member as GuildMember;
      if (!member.roles.cache.has(process.env.CARGO_STAFF ?? ""))
        return interaction.reply({ content: "❌ Apenas staff pode finalizar tickets.", ephemeral: true });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          customId: "finalize-save",
          label: "Salvar Transcript e Finalizar",
          style: ButtonStyle.Success
        }),
        new ButtonBuilder({
          customId: "finalize-only",
          label: "Finalizar sem Transcript",
          style: ButtonStyle.Danger
        })
      );

      await interaction.reply({ content: "Deseja salvar o transcript antes de finalizar?", components: [row], ephemeral: true });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  },
});
