"use strict";
import { Event } from "../../base";
import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

const filaVerificacao: Array<{
    userId: string,
    nome: string,
    seuid: string,
    recrutou: string,
    motivo: string
}> = [];

let processandoFila = false;

export default new Event({
    name: "interactionCreate",

    async run(interaction) {
        const client = interaction.client;

        // =========================================================
        // 1. ABRIR MODAL DE VERIFICAÇÃO
        // =========================================================
        if (interaction.isButton() && interaction.customId === "abrir_form") {
            const modal = new ModalBuilder()
                .setCustomId("form_verificacao")
                .setTitle("Verificação");

            const nome = new TextInputBuilder()
                .setCustomId("nome")
                .setLabel("Seu nome:")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const seuid = new TextInputBuilder()
                .setCustomId("seuid")
                .setLabel("Qual seu id?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const recrutou = new TextInputBuilder()
                .setCustomId("recrutou")
                .setLabel("Quem te recrutou?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const motivo = new TextInputBuilder()
                .setCustomId("motivo")
                .setLabel("Por que devemos aceitar você?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nome),
                new ActionRowBuilder<TextInputBuilder>().addComponents(seuid),
                new ActionRowBuilder<TextInputBuilder>().addComponents(recrutou),
                new ActionRowBuilder<TextInputBuilder>().addComponents(motivo)
            );

            return interaction.showModal(modal);
        }

        // =========================================================
        // 2. SUBMIT DO MODAL DE VERIFICAÇÃO
        // =========================================================
        if (interaction.isModalSubmit() && interaction.customId === "form_verificacao") {
            const nome = interaction.fields.getTextInputValue("nome");
            const seuid = interaction.fields.getTextInputValue("seuid");
            const recrutou = interaction.fields.getTextInputValue("recrutou");
            const motivo = interaction.fields.getTextInputValue("motivo");

            filaVerificacao.push({
                userId: interaction.user.id,
                nome,
                seuid,
                recrutou,
                motivo
            });

            if (!processandoFila) {
                processandoFila = true;
                processarFila(client);
            }

            return interaction.reply({
                content: "Sua verificação foi adicionada à fila! Aguarde análise.",
                ephemeral: true
            });
        }

        // =========================================================
        // 3. VER PERFIL
        // =========================================================
        if (interaction.isButton() && interaction.customId.startsWith("perfil_")) {
            const userId = interaction.customId.split("_")[1];

            const user = await client.users.fetch(userId).catch(() => null);
            if (!user)
                return interaction.reply({ content: "Não foi possível carregar o perfil.", ephemeral: true });

            const membro = await interaction.guild.members.fetch(userId).catch(() => null);

            let comuns = 0;
            for (const [_, guild] of client.guilds.cache) {
                const pertence = await guild.members.fetch(userId)
                    .then(() => true)
                    .catch(() => false);
                if (pertence) comuns++;
            }

            const embed = new EmbedBuilder()
                .setTitle("👤 Perfil do Usuário")
                .setThumbnail(user.displayAvatarURL())
                .setColor("Blue")
                .addFields(
                    { name: "Nome", value: user.tag },
                    { name: "ID", value: user.id },
                    { name: "Conta criada", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
                    { name: "Servidores em comum", value: `${comuns}` }
                )
                .setTimestamp();

            if (membro) {
                embed.addFields({
                    name: "Entrou no servidor",
                    value: `<t:${Math.floor(membro.joinedTimestamp / 1000)}:F>`
                });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // =========================================================
        // 4. APROVAR / REPROVAR (CORRIGIDO)
        // =========================================================
        if (interaction.isButton() && (interaction.customId.startsWith("aprovar_") || interaction.customId.startsWith("reprovar_"))) {

            // customId = aprovar_userId_nome_seuid
            const partes = interaction.customId.split("_");
            const acao = partes[0];
            const userId = partes[1];
            const nomeFormulario = decodeURIComponent(partes[2]);
            const seuid = decodeURIComponent(partes[3]);

            const membro = await interaction.guild.members.fetch(userId).catch(() => null);
            if (!membro)
                return interaction.reply({ content: "Usuário não encontrado.", ephemeral: true });

            const msg = interaction.message;

            const canalAprovado = "1445983320675713174";
            const canalReprovado = "1445983320675713174";
            const cargoAprovado = "1442336534140289144";
            const cargoRemover = "1442336534140289140";

            // ==============================
            // APROVAR
            // ==============================
            if (acao === "aprovar") {

                await interaction.reply({ content: "Usuário aprovado!", ephemeral: true });

                await membro.roles.add(cargoAprovado).catch(() => null);
                await membro.roles.remove(cargoRemover).catch(() => null);

                const apelidoFormatado = `[M] ${nomeFormulario} #${seuid}`;
                await membro.setNickname(apelidoFormatado).catch(() => null);

                await membro.send("🎉 Você foi **aprovado**! Seja bem-vindo!").catch(() => null);

                const log = new EmbedBuilder()
                    .setTitle("🟢 Usuário Aprovado")
                    .setColor("Green")
                    .setThumbnail(membro.user.displayAvatarURL())
                    .addFields(
                        { name: "Usuário", value: `${membro.user.tag}\nID: ${membro.id}` },
                        { name: "Aprovado por", value: `${interaction.user.tag}` },
                        { name: "Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                    );

                const canal = await interaction.guild.channels.fetch(canalAprovado);
                canal?.isTextBased() && await canal.send({ embeds: [log] });

                await msg.delete().catch(() => null);
                return;
            }

            // ==============================
            // REPROVAR
            // ==============================
            if (acao === "reprovar") {

                await interaction.reply({ content: "Usuário reprovado!", ephemeral: true });

                await membro.setNickname(null).catch(() => null);
                await membro.send("❌ Sua verificação foi **reprovada**.").catch(() => null);

                const log = new EmbedBuilder()
                    .setTitle("🔴 Usuário Reprovado")
                    .setColor("Red")
                    .setThumbnail(membro.user.displayAvatarURL())
                    .addFields(
                        { name: "Usuário", value: `${membro.user.tag}\nID: ${membro.id}` },
                        { name: "Reprovado por", value: `${interaction.user.tag}` },
                        { name: "Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                    );

                const canal = await interaction.guild.channels.fetch(canalReprovado);
                canal?.isTextBased() && await canal.send({ embeds: [log] });

                await msg.delete().catch(() => null);
                return;
            }
        }

        // =========================================================
        // 5. MODAL DE ATUALIZAÇÃO SEMANAL
        // =========================================================
        if (interaction.isChatInputCommand() && interaction.commandName === "atualizacao") {
            const modal = new ModalBuilder()
                .setCustomId("form_atualizacao")
                .setTitle("Atualização Semanal");

            const tituloInput = new TextInputBuilder()
                .setCustomId("titulo")
                .setLabel("Título da Atualização")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const adicoesInput = new TextInputBuilder()
                .setCustomId("adicoes")
                .setLabel("Adições (Opcional)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const ajustesInput = new TextInputBuilder()
                .setCustomId("ajustes")
                .setLabel("Ajustes (Opcional)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(tituloInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(adicoesInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(ajustesInput)
            );

            return interaction.showModal(modal);
        }

        // =========================================================
        // 6. SUBMIT DO MODAL DE ATUALIZAÇÃO
        // =========================================================
        if (interaction.isModalSubmit() && interaction.customId === "form_atualizacao") {
            const titulo = interaction.fields.getTextInputValue("titulo");
            const adicoes = interaction.fields.getTextInputValue("adicoes") || "Nenhuma";
            const ajustes = interaction.fields.getTextInputValue("ajustes") || "Nenhum";

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .addFields(
                    { name: "Adições", value: adicoes },
                    { name: "Ajustes", value: ajustes }
                )
                .setColor("Blue")
                .setFooter({ text: "MS - Todos os direitos reservados" })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

    }
});

// =========================================================
// Função para processar a fila de verificações
// =========================================================
async function processarFila(client: any) {
    while (filaVerificacao.length > 0) {
        const item = filaVerificacao.shift();

        const canalAnalise = "1445983320675713174";
        const canal = await client.guilds.cache.first()?.channels.fetch(canalAnalise).catch(() => null);

        if (!canal || !canal.isTextBased()) continue;

        const user = await client.users.fetch(item!.userId).catch(() => null);
        if (!user) continue;

        const embed = new EmbedBuilder()
            .setTitle("📋 Nova Solicitação de Verificação")
            .setColor("Yellow")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "👤 Nome", value: item!.nome },
                { name: "🧲 ID", value: item!.seuid },
                { name: "🧲 Recrutado por", value: item!.recrutou },
                { name: "📝 Motivo", value: item!.motivo }
            )
            .setFooter({ text: `Usuário: ${user.tag} • ID ${user.id}` })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`aprovar_${user.id}_${encodeURIComponent(item!.nome)}_${encodeURIComponent(item!.seuid)}`)
                .setLabel("Aprovar")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`reprovar_${user.id}_${encodeURIComponent(item!.nome)}_${encodeURIComponent(item!.seuid)}`)
                .setLabel("Reprovar")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`perfil_${user.id}`)
                .setLabel("Ver Perfil")
                .setStyle(ButtonStyle.Secondary)
        );

        await canal.send({ embeds: [embed], components: [row] });

        await new Promise(res => setTimeout(res, 1000));
    }

    processandoFila = false;
}
