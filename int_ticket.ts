import { Component } from "@/discord/base";
import { settings } from "@/settings";
import { hexToRgb } from "@magicyan/discord";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  GuildMember,
  TextChannel,
  StringSelectMenuInteraction,
} from "discord.js";

// --- Configurações ---
const TICKET_CATEGORIES = {
  Suporte: "🎫 Suporte",
  Farm: "📟 Farm",
  Denúncias: "⭕ Denúncias",
};

const BUTTON_IDS = {
  ADD_MEMBER: "add-member",
  REMOVE_MEMBER: "remove-member",
  WARN_MEMBER: "warn-member",
  MOVE_TICKET: "move-ticket",
  ASSUME_TICKET: "assume-ticket",
  FINALIZE: "finalizar-ticket",
};

// --- Função para verificar se é Staff ---
function isStaff(member: GuildMember) {
  return member.roles.cache.has(process.env.CARGO_STAFF ?? "");
}

// --- COMPONENTE: Abrir Ticket ---
new Component({
  customId: "selecao-tickets",
  type: ComponentType.StringSelect,
  cache: "cached",
  async run(interaction: StringSelectMenuInteraction) {
    try {
      if (!interaction.guild || !interaction.member) return;

      const member = interaction.member as GuildMember;

      // Pega o valor selecionado
      const option = interaction.values[0];
      if (!option || !(option in TICKET_CATEGORIES)) {
        return interaction.reply({ content: "❌ Categoria inválida.", ephemeral: true });
      }

      // Verifica se já existe um ticket aberto
      const existingChannel = interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.topic === member.id
      );
      if (existingChannel) {
        return interaction.reply({ content: `⚠️ Você já possui um ticket aberto: ${existingChannel}`, ephemeral: true });
      }

      // Cria o canal de ticket
      const channel = await interaction.guild.channels.create({
        name: `${TICKET_CATEGORIES[option as keyof typeof TICKET_CATEGORIES]}-${member.displayName}`,
        topic: member.id,
        type: ChannelType.GuildText,
        parent: process.env.CATEGORIA_TICKETID,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: member.id, allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"] },
          { id: process.env.CARGO_STAFF ?? "", allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"] },
          { id: process.env.CARGO_TICKET ?? "", allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"] },
        ],
      });

      // Embed do ticket
      const embed = new EmbedBuilder({
        title: "🎟️ Ticket Criado com Sucesso!",
        description: `Olá **${member.user.username}**!\n\nSeu ticket foi aberto e nossa equipe já foi notificada. Aguarde atendimento.`,
        thumbnail: { url: member.user.displayAvatarURL() ?? process.env.LOGO },
        color: hexToRgb(settings.colors.theme.default),
        fields: [
          { name: "📂 Categoria", value: `\`\`\`${TICKET_CATEGORIES[option as keyof typeof TICKET_CATEGORIES]}\`\`\``, inline: true },
          { name: "👤 Dono do Ticket", value: `<@${member.id}>`, inline: true },
          { name: "ℹ️ Instruções", value: "Abaixo estará listado, todas as informações de entrega de farm da nossa facção:\n• QUANTIDADE DE FARM: 800x Polvoras & 800 Acidos\n• Envie print do inventário aberto apresentando a quantidade farmada\n• A meta inicia no Domingo e Finaliza no Sábado.\n• Qualquer problema contate os Gerentes de Farm" },
        ],
        footer: { text: "Tickets | Sistema Automatizado", icon_url: process.env.LOGO },
        timestamp: new Date(),
      });

      // --- Botões divididos em dois ActionRows ---
      const row1 = new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({ customId: BUTTON_IDS.ADD_MEMBER, label: "Adicionar Membro", style: ButtonStyle.Primary, emoji: "📂" }),
          new ButtonBuilder({ customId: BUTTON_IDS.REMOVE_MEMBER, label: "Remover Membro", style: ButtonStyle.Danger, emoji: "📂" }),
          new ButtonBuilder({ customId: BUTTON_IDS.WARN_MEMBER, label: "Avisar Membro", style: ButtonStyle.Secondary, emoji: "💬" }),
          new ButtonBuilder({ customId: BUTTON_IDS.MOVE_TICKET, label: "Mover Ticket", style: ButtonStyle.Secondary, emoji: "🔄" }),
          new ButtonBuilder({ customId: BUTTON_IDS.ASSUME_TICKET, label: "Assumir Ticket", style: ButtonStyle.Success, emoji: "✅" }),
        ],
      });

      const row2 = new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({ customId: BUTTON_IDS.FINALIZE, label: "Finalizar Ticket", style: ButtonStyle.Danger, emoji: "🗑️" }),
        ],
      });

      await channel.send({ embeds: [embed], components: [row1, row2] });
      await interaction.reply({ content: `✅ Seu ticket foi criado: ${channel}`, ephemeral: true });

    } catch (error) {
      console.error("Erro ao abrir ticket:", error);
      if (!interaction.replied) interaction.reply({ content: "❌ Ocorreu um erro ao abrir o ticket.", ephemeral: true });
    }
  },
});
