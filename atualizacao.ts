const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('atualizacao')
        .setDescription('Enviar uma nova atualização semanal'),
    async execute(interaction) {

        // Cria o modal
        const modal = new ModalBuilder()
            .setCustomId('formulario_atualizacao')
            .setTitle('Atualização Semanal');

        // Campos do modal
        const tituloInput = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel('Título da Atualização')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const adicoesInput = new TextInputBuilder()
            .setCustomId('adicoes')
            .setLabel('Adições (Opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const ajustesInput = new TextInputBuilder()
            .setCustomId('ajustes')
            .setLabel('Ajustes (Opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        // Adiciona campos ao modal
        const firstRow = new ActionRowBuilder().addComponents(tituloInput);
        const secondRow = new ActionRowBuilder().addComponents(adicoesInput);
        const thirdRow = new ActionRowBuilder().addComponents(ajustesInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        // Mostra o modal
        await interaction.showModal(modal);
    }
};
