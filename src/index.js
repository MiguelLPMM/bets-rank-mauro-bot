require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField, EmbedBuilder, ActivityType } = require('discord.js');
const moment = require('moment-timezone');

const timeZone = 'Europe/Lisbon'; // Replace with the desired time zone (e.g., 'America/New_York')

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity({
        name: 'Mauro a jogar LOL',
        type: ActivityType.Watching,
    });

    dailyUpdate();
});

async function retrieveRank() {
    try {
        /*
        const summonerData = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent("ltou Kaiji")}`, // Replace with the player name you want
            {
            headers: {
                'X-Riot-Token': process.env.RIOT_TOKEN,
            },
            }
        );
        const { id, name } = summonerData.data;
        */

        // Removed to reduce requests
    
        const leagueData = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${"PuhXk1UdPkL5ywAnRzq-7_ps0bCZ8ZbtJ4pWDhnIMvXRwoQ"}`, // Use the upper request to get the ID from the Name
            {
            headers: {
                'X-Riot-Token': process.env.RIOT_TOKEN,
            },
            }
        );
    
        return leagueData.data;
    } catch (error) {
        console.error(error);
        throw new Error('An error occurred while retrieving the rank.');
    }
  }

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'rank') {
        const name = "ltou Kaiji";

        await retrieveRank().then((leagueData) => {
            if (leagueData.length === 0) {
                interaction.reply(`${name} is currently unranked.`);
            } else {
                const { tier, rank, leaguePoints, wins, losses } = leagueData[0];
                interaction.reply(`${name} is currently ranked ${tier} ${rank} with ${leaguePoints} LP (${wins} wins, ${losses} losses).`);
            }
        }).catch((error) => {
            console.error(error);
            interaction.reply('An error occurred while retrieving the rank.');
        })
    }
})

async function dailyUpdate() {
    const currentDate = moment().tz(timeZone);
    const nextMidnight = currentDate.clone().endOf('day').add(1, 'second');

    const timeUntilMidnight = nextMidnight - currentDate;
  
    // Wait until the next midnight
    await sleep(timeUntilMidnight);

    let leagueData;
    await retrieveRank().then((dataRetieved) => {
        leagueData = dataRetieved[0];
    }).catch((error) => {
        console.error(error);
    })

    const { tier, rank, leaguePoints, wins, losses } = leagueData;
  
    // Send the scheduled message
    const channel = client.channels.cache.get(process.env.RANK_CHANNEL_ID); // Replace with your channel ID
    if (!channel) return;

    const day = currentDate.add(1, 'day').format('DD/MM/YYYY');

    const embed = new EmbedBuilder()
        .setTitle(`Dia ${day}`)
        .setColor('Random') // Change to color depending on result
        .addFields({
            name: `${tier} ${rank}`,
            value: `${leaguePoints} LP`
        });

    channel.send({ embeds: [embed] });
  
    // Schedule the next message
    dailyUpdate();
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

client.login(process.env.DISCORD_TOKEN);
