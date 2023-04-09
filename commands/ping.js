module.exports = {
    name: 'ping',

    execute(client, message) {
        message.channel.send(`Botun Pingi **${client.ws.ping}ms** 👋`);
    },
};