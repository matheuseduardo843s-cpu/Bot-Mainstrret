import Rcon from '../../../index';
import { Event } from "@/discord/base";
import { Message, Client, TextChannel, GuildMember } from "discord.js";
import dotenv from 'dotenv';

dotenv.config();

const config = process.env;

// Configurações do RCON
const rcon = new Rcon(
    config.RCON_HOST || "127.0.0.1",
    parseInt(config.RCON_PORT || "30120", 10),
    config.RCON_PASSWORD || "123456"
);

// Comandos restritos ao dono do servidor
const restrictedCommands = ["quit", "rrcity", "refresh"];

// Evento "ready" para limpar o canal ao iniciar
new Event({
    name: "ready",
    async run(client: Client) {
        const canalId = config.CANALCONSOLE || "";
        const channel = client.channels.cache.get(canalId);

        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`Lancaster`);
            return;
        }

        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true);
                console.log(`[✅] Canal ${channel.name} limpo com sucesso!`);
            } else {
                console.log(`[ℹ️] Canal ${channel.name} já estava vazio.`);
            }
        } catch (err) {
            console.error(`[❌] Erro ao limpar o canal "${channel.name}":`, err);
        }
    }
});

// Evento "messageCreate" para processar os comandos
new Event({
    name: "messageCreate",
    async run(message: Message) {
        if (message.author.bot) return;

        const canalId = config.CANALCONSOLE || "";
        if (message.channel.id !== canalId) return;

        const member = message.member as GuildMember;
        const requiredRole = config.RCARGO?.toString();

        // Verifica se o usuário tem o cargo necessário
        if (!member || !requiredRole || !member.roles.cache.has(requiredRole)) {
            console.log(`[⛔] ${message.author.tag} tentou executar um comando sem permissão.`);
            return;
        }

        const prefix = config.PREFIX || "$";
        if (message.content.startsWith(prefix)) {
            const command = message.content.slice(prefix.length).trim().toLowerCase(); // Remove o prefixo e converte para minúsculas
            
            // Verifica se o comando é restrito e se o autor não é o dono do servidor
            if (restrictedCommands.includes(command) && message.guild?.ownerId !== message.author.id) {
                console.log(`[⛔] ${message.author.tag} tentou executar "${command}" sem ser o dono do servidor.`);
                message.channel.send(`⛔ Apenas o dono do servidor pode executar o comando "${command}".`);
                return;
            }

            try {
                const response = await rcon.command(command);
                let result = response.get();
    
                result = result.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
                const playerName = message.author.username;
        
                if (result.trim()) {
                    message.channel.send(`\`\`\`ini\n🔹 ${result}\`\`\``);
                } else {
                    message.channel.send(`\`🔹 Comando executado: ${playerName} "${command}"\``);
                }
            } catch (err) {
                console.error(`[❌] Erro ao executar comando "${command}":`, err);
                message.channel.send(`Erro ao executar o comando: ${err}`);
            }
        }
    }
});
