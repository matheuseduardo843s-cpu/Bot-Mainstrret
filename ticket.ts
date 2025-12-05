import { Event } from "@/discord/base";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import dotenv from "dotenv";
import { createRow, hexToRgb } from "@magicyan/discord";
import { StringSelectMenuBuilder } from "discord.js";
import { settings } from "@/settings";

dotenv.config();

new Event({
  name: "ready",
  async run(client: Client) {
    if (!process.env.CANAL_TICKETID) {
      console.error("Channel ID não fornecido no .env");
      return;
    }

    try {
      const channel = await client.channels.fetch(process.env.CANAL_TICKETID);

      if (channel instanceof TextChannel) {
        await enviarPainel(channel);
      } else {
        console.error("Canal de tickets não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar o canal:", error);
    }
  },
});

async function enviarPainel(channel: TextChannel) {
  const embed = new EmbedBuilder({
    title: "⭐ ATENDIMENTO MS ",
    description:
      "Seja bem-vindo ao sistema de atendimento MS , use o menu abaixo para abrir um ticket e aguarde para ser atendido.\n\n" +
      "Não abra um ticket sem necessidade.\n" +
      "Não marque excessivamente os anciões.\n" +
      "Agilize o atendimento fornecendo o máximo de informações possíveis.",
    color: hexToRgb(settings.colors.theme.default),
    footer: {
      text: "MS © Todos os direitos reservados",
    },
    thumbnail: {
      url: process.env.LOGO ?? "",
    },
    image: {
      url: process.env.BANNERTK ?? "",
    },
  });

  const row = createRow(
    new StringSelectMenuBuilder({
      customId: "selecao-tickets",
      placeholder: "Selecione uma categoria",
      options: [
        {
          label: "Suporte",
          value: "Suporte",
          description: "Estamos aqui para resolver problemas e dúvidas!",
          emoji: "🎫",
        },
        {
          label: "Farm",
          value: "Farm",
          description: "Abra seu ticket de registro de farm.",
          emoji: "📟",
        },
        {
          label: "Denúncias",
          value: "Denúncias",
          description: "Se vir algo errado, denúncia e tomaremos providências.",
          emoji: "⭕",
        },
      ],
    })
  );

  try {
    await channel.send({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error("Erro ao enviar painel:", error);
  }
}
