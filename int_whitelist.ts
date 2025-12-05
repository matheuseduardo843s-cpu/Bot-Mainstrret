import { Component, Modal } from "@/discord/base";
import { createModalInput } from "@magicyan/discord";
import { ButtonInteraction, ComponentType, ModalBuilder, TextChannel, TextInputStyle, VoiceChannel, GuildMember } from "discord.js";
import dotenv from 'dotenv';
const mysql = require('mysql2/promise');

dotenv.config();

const VISITOR_ROLE_ID = process.env.CARGO_VISITANTE;
const NEW_ROLE_ID = process.env.CARGO_CIDADAO;
const CHANNEL_ID = process.env.CANAL_APROVADOS;

new Component({
    customId: "btn_registrar",
    type: ComponentType.Button,
    cache: "cached",
    async run(interaction: ButtonInteraction) {
        try {
            if (interaction.deferred || interaction.replied) return;
            if (!interaction.guild) return;

            const member: GuildMember = await interaction.guild.members.fetch(interaction.user);
            if (!member.roles.cache.has(VISITOR_ROLE_ID ??"")) {
                await interaction.reply({ ephemeral: true, content: "Esse membro já possui sua whitelist liberada!" });
                return;
            }

            new Modal({
                customId: "whitelist_modal",
                cache: "cached",
                isFromMessage: true,
                async run(interaction) { /* seu conteúdo aqui */ },
            });

            const modal = await interaction.showModal(new ModalBuilder({
                customId: "whitelist_modal",
                title: "- LIBERAÇÃO AUTOMÁTICA -",
                components: [
                    createModalInput({
                        customId: "input_id",
                        label: "ID:",
                        placeholder: "Preencha com seu id fornecido pela cidade!",
                        style: TextInputStyle.Short,
                        minLength: 1,
                        maxLength: 10
                    }),
                    createModalInput({
                        customId: "input_nome",
                        label: "NOME E SOBRENOME:",
                        placeholder: "Preencha o mesmo nome que usará na cidade!",
                        style: TextInputStyle.Short,
                        minLength: 3,
                        maxLength: 20
                    })
                ]
            }));

            const modalInteraction = await interaction.awaitModalSubmit({ time: 50_000, filter: (i) => i.user.id === interaction.user.id });
            if (!modalInteraction) return;

            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });

            const { fields } = modalInteraction;
            const name = fields.getTextInputValue("input_nome");
            const id = fields.getTextInputValue("input_id");

            if (!interaction.guild) {
                await modalInteraction.reply({ ephemeral: true, content: `Esta funcionalidade está disponível apenas em servidores.` });
                return;
            }

            const [rows] = await connection.query(`SELECT ${process.env.COLUM_WHITELIST} FROM ${process.env.TABLE_USERS} WHERE id = ?`, [id]);
            if (rows.length > 0) {
                const { whitelist } = rows[0];
                if (whitelist === 0) {
                    await connection.query(`UPDATE ${process.env.TABLE_USERS} SET ${process.env.COLUM_WHITELIST} = 1 WHERE id = ?`, [id]);

                    // ✔️ Verifica se é possível alterar o nickname
                    if (member.manageable && !member.permissions.has("Administrator")) {
                        await member.setNickname(`${name} | ${id}`);
                    } else {
                        console.warn(`Não foi possível alterar o nickname de ${member.user.tag}. Verifique permissões e hierarquia.`);
                    }

                    // ✔️ Adiciona e remove papéis
                    if (NEW_ROLE_ID) await member.roles.add(NEW_ROLE_ID);
                    if (VISITOR_ROLE_ID) await member.roles.remove(VISITOR_ROLE_ID);

                    // ✔️ Envia mensagem no canal de aprovados
                    const channel = interaction.guild.channels.cache.get(CHANNEL_ID ??"");
                    if (channel instanceof TextChannel) {
                        await channel.send(`<@${member.id}> ** - foi liberado no servidor | ID:${id} **`);
                    }

                    await modalInteraction.reply({ ephemeral: true, content: "ID Aprovado com Sucesso! Receba as <#" + process.env.CANAL_BEMVINDO + ">" });

                } else {
                    await modalInteraction.reply({ ephemeral: true, content: `Esse membro já possui sua whitelist liberada!` });
                    if (NEW_ROLE_ID) await member.roles.add(NEW_ROLE_ID);
                    if (VISITOR_ROLE_ID) await member.roles.remove(VISITOR_ROLE_ID);
                }
            } else {
                await modalInteraction.reply({ ephemeral: true, content: `ID não encontrado, informe um ID válido.` });
            }

        } catch (error) {
            console.error('Error handling button interaction:', error);
        }
    },
});
