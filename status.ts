import { Event } from "@/discord/base";
import {
    Client,
    TextChannel,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// -----------------------------------------------------
// SALVAR ID NO .ENV
// -----------------------------------------------------
function updateEnv(key: string, value: string) {
    let env = fs.readFileSync(".env", "utf8");
    const regex = new RegExp(`^${key}=.*`, "m");

    if (env.match(regex)) {
        env = env.replace(regex, `${key}=${value}`);
    } else {
        env += `\n${key}=${value}`;
    }

    fs.writeFileSync(".env", env);
}

// timeout
function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -----------------------------------------------------
// BUSCA STATUS DO SERVIDOR
// -----------------------------------------------------
async function fetchServerData() {
    const ip = process.env.IP_SERVER;

    try {
        const playersReq = await fetch(`http://${ip}/players.json`);
        if (!playersReq.ok) throw new Error("players.json não respondeu");

        const playersData = await playersReq.json();
        const players = playersData.length;

        const infoReq = await fetch(`http://${ip}/info.json`);
        const info = infoReq.ok ? await infoReq.json() : null;

        return {
            online: true,
            players,
            maxPlayers: info?.vars?.sv_maxClients || "??",
            ping: info?.vars?.sv_licenseKeyToken ? "??" : "N/A",
            hostname: info?.vars?.sv_projectName || "Servidor FiveM"
        };
    } catch {
        return {
            online: false,
            players: 0,
            maxPlayers: 0,
            ping: "N/A",
            hostname: "Servidor Offline"
        };
    }
}

// -----------------------------------------------------
// CRIAR EMBED
// -----------------------------------------------------
async function buildMessage() {
    const data = await Promise.race([
        fetchServerData(),
        timeout(5000)
    ]);

    const isOnline = data.online;

    const embed = new EmbedBuilder()
        .setColor(isOnline ? 0x00ff00 : 0xff0000)
        .setTitle(process.env.TITULO ?? "Status do Servidor")
        .setThumbnail(process.env.LOGOSTATUS ?? "")
        .setImage(process.env.BANNERCONNECT ?? "")
        .addFields(
            {
                name: "Status",
                value: isOnline ? "🟢 **ONLINE**" : "🔴 **OFFLINE**",
                inline: true
            },
            {
                name: "Jogadores",
                value: `👥 **${data.players}/${data.maxPlayers}**`,
                inline: true
            },
            {
                name: "Ping",
                value: `📡 **${data.ping}**`,
                inline: true
            },
            {
                name: "Servidor",
                value: `\`\`\`fix\n${process.env.IP_SERVER}\n\`\`\``
            }
        )
        .setFooter({
            text: `Atualizado automaticamente • ${new Date().toLocaleTimeString()}`
        });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel("Entrar no Servidor")
            .setStyle(ButtonStyle.Link)
            .setEmoji("🚀")
            .setURL(process.env.FIVEMURL ?? "https://cfx.re/")
    );

    return { embeds: [embed], components: [row] };
}

// -----------------------------------------------------
// EVENTO READY — SISTEMA DE STATUS
// -----------------------------------------------------
export default new Event({
    name: "ready",
    async run(client: Client) {
        console.log("✅ Sistema de status iniciado!");

        const channelId = process.env.STATUS_CHANNEL;
        if (!channelId) return console.log("❌ STATUS_CHANNEL não configurado");

        const channel = await client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            return console.log("❌ Canal inválido");
        }

        let messageId = process.env.STATUS_MESSAGE;

        try {
            let msg;

            if (!messageId || messageId === "0") {
                msg = await channel.send(await buildMessage());
                updateEnv("STATUS_MESSAGE", msg.id);
            } else {
                msg = await channel.messages.fetch(messageId).catch(() => null);

                if (!msg) {
                    msg = await channel.send(await buildMessage());
                    updateEnv("STATUS_MESSAGE", msg.id);
                } else {
                    await msg.edit(await buildMessage());
                }
            }

            setInterval(async () => {
                try {
                    const m = await channel.messages.fetch(
                        process.env.STATUS_MESSAGE!
                    ).catch(() => null);

                    if (!m) {
                        const newMsg = await channel.send(await buildMessage());
                        updateEnv("STATUS_MESSAGE", newMsg.id);
                        return;
                    }

                    await m.edit(await buildMessage());
                } catch (err) {
                    console.log("Erro ao atualizar painel:", err);
                }
            }, Number(process.env.UPDATE_INTERVAL) || 120000);

        } catch (err) {
            console.log("Erro no sistema de status:", err);
        }
    }
});
