require('dotenv').config();
const { REST, Routes} = require('discord.js');

const commands = [
    {
        name: 'rank',
        description: 'Mauro\'s current rank',
    },
];

const rest = new REST({ versio: '10'}).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands}
        )

        console.log('Slash commands were registered successfully!');
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();