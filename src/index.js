require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'rank') {
        try {
            const summonerData = await axios.get(
                `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent("ltou Kaiji")}`,
                {
                    headers: {
                        'X-Riot-Token': process.env.RIOT_TOKEN,
                    },
                }
            );
            const { id, name } = summonerData.data;
      
            const leagueData = await axios.get(
                `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
                {
                    headers: {
                        'X-Riot-Token': process.env.RIOT_TOKEN,
                    },
                }
            );
      
            if (leagueData.data.length === 0) {
                interaction.reply(`${name} is currently unranked.`);
            } else {
                const { tier, rank, leaguePoints, wins, losses } = leagueData.data[0];
                interaction.reply(`${name} is currently ranked ${tier} ${rank} with ${leaguePoints} LP (${wins} wins, ${losses} losses).`);
            }
        } catch (error) {
            console.error(error);
            interaction.reply('An error occurred while retrieving the rank.');
        }
    }
})

client.login(process.env.DISCORD_TOKEN);
