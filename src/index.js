require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField, EmbedBuilder, ActivityType } = require('discord.js');
const moment = require('moment-timezone');
const sqlite3 = require('sqlite3').verbose();

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

        for (type of leagueData.data) {
            if (type.queueType === 'RANKED_SOLO_5x5') return type;
        }
    
        return null;
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
            if (!leagueData) {
                interaction.reply(`${name} is currently unranked.`);
            } else {
                const { tier, rank, leaguePoints, wins, losses } = leagueData;
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
    
    // Send the scheduled message
    const channel = client.channels.cache.get(process.env.RANK_CHANNEL_ID); // Replace with your channel ID
    if (!channel) return;

    let leagueData;
    await retrieveRank().then((dataRetieved) => {
        if (dataRetieved) {
            leagueData = dataRetieved;
        } else {
            channel.send('Unranked...');
            dailyUpdate();
        }
    }).catch((error) => {
        console.error(error);
    })

    const { tier, rank, leaguePoints } = leagueData;

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

// Establish a connection to the SQLite database
const db = new sqlite3.Database('src/database.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to the database.');
  
        // Read the .sql file
        const fs = require('fs');
        const schema = fs.readFileSync('src/database.sql', 'utf-8');
  
        // Execute the .sql file to create tables
        db.exec(schema, (err) => {
            if (err) {
            console.error('Error executing schema:', err);
            } else {
                console.log('Tables created successfully.');
        
                // Check if initial rows exist before inserting them
                db.get('SELECT COUNT(*) AS count FROM scores', (err, row) => {
                    if (err) {
                        console.error('Error checking if initial rows exist:', err);
                        return;
                    }
        
                    const initialRowCount = row.count;
        
                    if (initialRowCount === 0) {
                        // Insert the initial rows
                        const initialDataSql = fs.readFileSync('src/initial_values.sql', 'utf-8');
                        db.exec(initialDataSql, (err) => {
                            if (err) {
                                console.error('Error inserting initial data:', err);
                            } else {
                                console.log('Initial data inserted successfully.');
                            }
                        });
                    } else {
                        console.log('Initial rows already exist. Skipping insertion.');
                    }
                });
            }
        });
    }
});
