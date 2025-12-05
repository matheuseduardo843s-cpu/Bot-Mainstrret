"use strict";
import { Event } from "../../base";
import {
    TextChannel,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

export default new Event({
    name: "ready",
    async run(client) {
        console.log(`✅ Logado como ${client.user?.tag}`);

        const canalId = process.env.CANAL_VERIFICACAO;
        if (!canalId) {
            console.error("❌ CANAL_VERIFICACAO não definido no .env");
            return;
        }

        try {
            const canal = await client.channels.fetch(canalId);

            if (!canal || !canal.isTextBased()) {
                console.error("❌ Canal não encontrado ou não é um canal de texto!");
                return;
            }

            const botPerms = canal.permissionsFor(client.user!);
            if (!botPerms?.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
                console.error("❌ Bot não tem permissão de enviar mensagens ou embeds nesse canal!");
                return;
            }

            await enviarPainel(canal as TextChannel);

        } catch (error) {
            console.error("Erro ao enviar painel:", error);
        }
    },
});

async function enviarPainel(channel: TextChannel) {
    try {
        await channel.bulkDelete(10, true);
    } catch {
        console.log("⚠️ Não foi possível limpar mensagens antigas.");
    }

    const embed = new EmbedBuilder()
        .setTitle("📋 Painel de Verificação - Lancaster")
        .setDescription(
            "Bem-vindo(a)! Para se tornar parte da família, utilize os botões abaixo e siga os passos de verificação.\n\n" +
            "Clique em **Ver Regras** para conhecer nossas regras.\n" +
            "Clique em **Sobre Nós** para saber mais sobre a equipe.\n" +
            "Siga nosso **Instagram** para ficar por dentro das novidades!")
        .setColor("Blue")
        .setThumbnail("https://cdn.discordapp.com/attachments/1402173462927118557/1444684993485082795/logolsa.png")
        .setFooter({ text: "Lancaster • Todos os direitos reservados" })
        .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("abrir_form")
            .setLabel("✅ Verificar-se")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setLabel("📜 Regras")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/channels/@me/1402173464051454032"),

        new ButtonBuilder()
            .setLabel("ℹ️ Sobre Nós")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/channels/@me/1444071753088499865"),

        new ButtonBuilder()
            .setLabel("📸 Instagram")
            .setStyle(ButtonStyle.Link)
            .setURL("https://www.instagram.com/lancaster.gg/")
    );

    await channel.send({ embeds: [embed], components: [row] });
}
