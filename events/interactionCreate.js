const { createWriteStream } = require('fs');
const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');

module.exports = async (client, int) => {
    const req = int.customId.split('_')[0];

    client.emit('ticketsLogs', req, int.guild, int.member.user);

    switch (req) {
        case 'createTicket': {
            const selectMenu = new MessageSelectMenu();

            selectMenu.setCustomId('newTicket');
            selectMenu.setPlaceholder('Choose a reason for the ticket');
            selectMenu.addOptions([
                {
                    emoji: '🐛',
                    label: 'Satın alma işlemleri',
                    description: 'Satın alacağınız ürünü destek bakmadan lütfen belirtiniz.',
                    value: 'newTicket'
                },
                {
                    emoji: '🦙',
                    label: 'Destek',
                    description: 'Lütfen sorularınızı desteği bekletmeden sorunuz.',
                    value: 'newTicket_Support'
                },
                {
                    emoji: '🐎',
                    label: 'Kurucu',
                    description: 'Sorununuzu hızlı bir şekilde belirtiniz.',
                    value: 'newTicket_Moderation'
                },
            ]);

            const row = new MessageActionRow().addComponents(selectMenu);

            return int.reply({ content: 'Biletin sebebi ne olacak?', components: [row], ephemeral: true });
        }

        case 'newTicket': {
            const reason = int.values[0].split('_')[1];

            const channel = int.guild.channels.cache.find(x => x.name === `ticket-${int.member.id}`);

            if (!channel) {
                await int.guild.channels.create(`ticket-${int.member.id}`, {
                    type: 'GUILD_TEXT',
                    topic: `Ticket created by ${int.member.user.username}${reason ? ` (${reason})` : ''} ${new Date(Date.now()).toLocaleString()}`,
                    permissionOverwrites: [
                        {
                            id: int.guild.id,
                            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: int.member.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                            id: client.user.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        }
                    ]
                });

                const channel = int.guild.channels.cache.find(x => x.name === `ticket-${int.member.id}`);

                const ticketEmbed = new MessageEmbed();

                ticketEmbed.setColor('GREEN');
                ticketEmbed.setAuthor(`Biletiniz başarıyla oluşturuldu ${int.member.user.username}${reason ? ` (${reason})` : ''} ✅`);
                ticketEmbed.setDescription('*Mevcut bileti kapatmak için aşağıdaki tepkiye tıklayın !*');

                const closeButton = new MessageButton();

                closeButton.setStyle('DANGER');
                closeButton.setLabel('Ticketı kapat');
                closeButton.setCustomId(`closeTicket_${int.member.id}`);

                const row = new MessageActionRow().addComponents(closeButton);

                await channel.send({ embeds: [ticketEmbed], components: [row] });

                return int.update({ content: `Ticketiniz açık <@${int.member.id}> <#${channel.id}> ✅`, components: [], ephemeral: true });
            } else {
                return int.update({ content: `Zaten açık bir ticketınız var <#${channel.id}> ❌`, components: [], ephemeral: true });
            }
        }

        case 'closeTicket': {
            const channel = int.guild.channels.cache.get(int.channelId);

            await channel.edit({
                permissionOverwrites: [
                    {
                        id: int.guild.id,
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    },
                    {
                        id: int.customId.split('_')[1],
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    },
                    {
                        id: client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    }
                ]
            });

            const ticketEmbed = new MessageEmbed();

            ticketEmbed.setColor('RED');
            ticketEmbed.setAuthor(`${int.member.user.username} bu ticketı kapatmaya karar verdi ❌`);
            ticketEmbed.setDescription('*Ticketı kalıcı olarak silmek veya bileti yeniden açmak için aşağıdaki butona tıklayın.*');

            const reopenButton = new MessageButton();

            reopenButton.setStyle('SUCCESS');
            reopenButton.setLabel('Ticketı tekrardan aç');
            reopenButton.setCustomId(`reopenTicket_${int.customId.split('_')[1]}`);

            const saveButton = new MessageButton();

            saveButton.setStyle('SUCCESS');
            saveButton.setLabel('Ticketı kaydet');
            saveButton.setCustomId(`saveTicket_${int.customId.split('_')[1]}`);

            const deleteButton = new MessageButton();

            deleteButton.setStyle('DANGER');
            deleteButton.setLabel('Ticketı sil');
            deleteButton.setCustomId('deleteTicket');

            const row = new MessageActionRow().addComponents(reopenButton, saveButton, deleteButton);

            return int.reply({ embeds: [ticketEmbed], components: [row] });
        }

        case 'reopenTicket': {
            const channel = int.guild.channels.cache.get(int.channelId);

            await channel.edit({
                permissionOverwrites: [
                    {
                        id: int.guild.id,
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    },
                    {
                        id: int.customId.split('_')[1],
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    },
                    {
                        id: client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                    }
                ]
            });

            const ticketEmbed = new MessageEmbed();

            ticketEmbed.setColor('GREEN');
            ticketEmbed.setAuthor(`Ticket başarıyla tekrardan açıldı ✅`);
            ticketEmbed.setDescription('*Mevcut ticketı kapatmak için aşağıdaki tepkiye tıklayın !*');

            const closeButton = new MessageButton();

            closeButton.setStyle('DANGER');
            closeButton.setLabel('Ticketi Kapat');
            closeButton.setCustomId(`closeTicket_${int.customId.split('_')[1]}`);

            const row = new MessageActionRow().addComponents(closeButton);

            return int.reply({ embeds: [ticketEmbed], components: [row] });
        }

        case 'deleteTicket': {
            const channel = int.guild.channels.cache.get(int.channelId);

            return channel.delete();
        }

        case 'saveTicket': {
            const channel = int.guild.channels.cache.get(int.channelId);

            await channel.messages.fetch().then(async msg => {
                let messages = msg.filter(msg => msg.author.bot !== true).map(m => {
                    const date = new Date(m.createdTimestamp).toLocaleString();
                    const user = `${m.author.tag}${m.author.id === int.customId.split('_')[1] ? ' (ticket kurucusu)' : ''}`;

                    return `${date} - ${user} : ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`;
                }).reverse().join('\n');

                if (messages.length < 1) messages = 'Bu ticketta hiç mesaj yok... garip';

                const ticketID = Date.now();

                const stream = await createWriteStream(`./data/${ticketID}.txt`);

                stream.once('open', () => {
                    stream.write(`User ticket ${int.customId.split('_')[1]} (channel #${channel.name})\n\n`);
                    stream.write(`${messages}\n\nLogs ${new Date(ticketID).toLocaleString()}`);

                    stream.end();
                });

                stream.on('finish', () => int.reply({ files: [`./data/${ticketID}.txt`] }));
            });
        }
    }
};