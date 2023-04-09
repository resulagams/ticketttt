const { Permissions, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'ticketkur',

    execute(client, message) {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            return message.channel.send('Bu komutu kullanmak için **mesajları yönetme** iznine sahip olmanız gerekir❌');
        }

        const setupEmbed = new MessageEmbed();

        setupEmbed.setColor('GREEN');
        setupEmbed.setAuthor('Bir ticket oluşturmak için aşağıdaki butona tıklayın 🤝');
        setupEmbed.setDescription('*Destek ile konuşmanız için yeni bir kanal oluşturulacaktır!*');

        const ticketButton = new MessageButton();

        ticketButton.setEmoji('🔓');
        ticketButton.setStyle('SUCCESS');
        ticketButton.setLabel('Ticket Aç');
        ticketButton.setCustomId('createTicket');

        const row = new MessageActionRow().addComponents(ticketButton);

        message.channel.send({ embeds: [setupEmbed], components: [row] });
    },
};