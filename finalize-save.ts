import { Component } from "@/discord/base";
import { ButtonInteraction, GuildMember, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import * as fs from "fs";
import * as path from "path";
import { hexToRgb } from "@magicyan/discord";
import { settings } from "@/settings";

new Component({
  customId: "finalize-save",
  type: 2, // Button
  cache: "cached",
  async run(interaction: ButtonInteraction) {
    try {
      const member = interaction.member as GuildMember;
      if (!member.roles.cache.has(process.env.CARGO_STAFF ?? ""))
        return interaction.reply({ content: "❌ Apenas staff pode finalizar tickets.", ephemeral: true });

      const channel = interaction.channel as TextChannel;
      if (!channel || channel.type !== 0)
        return interaction.reply({ content: "❌ Este botão só funciona em tickets.", ephemeral: true });

      await interaction.deferReply({ ephemeral: true });

      // 1️⃣ Criar transcript em buffer
      const transcriptBuffer = await createTranscript(channel, {
        returnType: ExportReturnType.Buffer,
        saveImages: true,
      });

      // 2️⃣ Salvar como TXT
      const basePath = process.env.PATH_TRANSCRIPT ?? "./transcripts";
      await fs.promises.mkdir(basePath, { recursive: true });
      const transcriptPath = path.join(basePath, `transcript-${channel.id}.txt`);
      await fs.promises.writeFile(transcriptPath, transcriptBuffer);

      const transcriptAttachment = new AttachmentBuilder(transcriptPath, { name: `transcript-${channel.id}.txt` });

      // 3️⃣ Enviar embed bonito para o canal de log
      const logChannelId = process.env.CANAL_TRANSCRIPT ?? "";
      const logChannel = interaction.guild?.channels.cache.get(logChannelId) as TextChannel;
      const ticketOwnerId = channel.topic;

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle(`🎟️ Ticket Finalizado - #${channel.name}`)
          .setThumbnail(interaction.guild?.iconURL() || process.env.LOGO)
          .setColor(hexToRgb(settings.colors.theme.default))
          .addFields(
            { name: "👤 Dono do Ticket", value: ticketOwnerId ? `<@${ticketOwnerId}>` : "Desconhecido", inline: true },
            { name: "🛠️ Finalizado por", value: `<@${member.id}>`, inline: true },
            { name: "📄 Canal do Ticket", value: `<#${channel.id}>`, inline: true },
            { name: "⏰ Finalizado em", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setFooter({ text: interaction.guild?.name || "Lancaster", iconURL: interaction.guild?.iconURL() || process.env.LOGO })
          .setTimestamp();

        await logChannel.send({
          embeds: [logEmbed],
          files: [transcriptAttachment]
        });
      }

      // 4️⃣ Enviar DM para o dono do ticket
      if (ticketOwnerId) {
        try {
          const user = await interaction.client.users.fetch(ticketOwnerId);
          if (user) {
            await user.send({
              content: `Seu ticket #${channel.name} foi finalizado por ${member.user.tag}. Segue o transcript:`,
              files: [transcriptAttachment]
            });
          }
        } catch {}
      }

      await interaction.editReply({ content: "✅ Ticket finalizado com sucesso! Transcript salvo em `.txt`" });
      await channel.delete().catch(() => {});
    } catch (err) {
      console.error("Erro ao finalizar ticket:", err);
      if (!interaction.replied)
        interaction.reply({ content: "❌ Ocorreu um erro ao finalizar o ticket.", ephemeral: true });
    }
  }
});
