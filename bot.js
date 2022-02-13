'use strict';

const util = require('minecraft-server-util');
const Discord = require('discord.js');
const client = new Discord.Client({ fetchAllMembers: true });

if (Discord.version.startsWith('12.')) {
  Discord.RichEmbed = Discord.MessageEmbed;
  Discord.TextChannel.prototype.fetchMessage = function(snowflake) {
    return this.messages.fetch.apply(this.messages,[snowflake]);
  }
  Object.defineProperty(Discord.User.prototype,'displayAvatarURL',{
    'get': function() {
      return this.avatarURL();
    }
  })
}

const LOG_LEVELS = {
  'ERROR': 3,
  'INFO': 2,
  'DEBUG': 1,
  'SPAM': 0
}

const BOT_CONFIG = {
  'apiRequestMethod': 'sequential',
  'messageCacheMaxSize': 50,
  'messageCacheLifetime': 0,
  'messageSweepInterval': 0,
  'fetchAllMembers': false,
  'disableEveryone': true,
  'sync': false,
  'restWsBridgeTimeout': 5000,
  'restTimeOffset': 300,
  'disabledEvents': [
    'CHANNEL_PINS_UPDATE',
    'TYPING_START'
  ],
  'ws': {
    'large_threshold': 100,
    'compress': true
  }
}

exports.start = function(SETUP) {
  const LOG_LEVEL = SETUP.LOG_LEVEL !== undefined ? parseInt(SETUP.LOG_LEVEL) : LOG_LEVELS.INFO;
  const BOT_TOKEN = SETUP.BOT_TOKEN;
  const SUGGESTION_CHANNEL = SETUP.SUGGESTION_CHANNEL;
  const USE_SUGGESTION_CHANNEL = SETUP.USE_SUGGESTION_CHANNEL;
  const CHANGELOGS_CHANNEL = SETUP.CHANGELOGS_CHANNEL;
  const USE_CHANGELOGS_CHANNEL = SETUP.USE_CHANGELOGS_CHANNEL;
  const BUG_CHANNEL = SETUP.BUG_CHANNEL;
  const BUG_LOG_CHANNEL = SETUP.BUG_LOG_CHANNEL;
  const USE_BUG_CHANNEL = SETUP.USE_BUG_CHANNEL;
  const LOG_CHANNEL = SETUP.LOG_CHANNEL;

  var loop_callbacks = [];

  const log = function(level,message) {
    if (level >= LOG_LEVEL) console.log(`${new Date().toLocaleString()} :${level}: ${message}`);
  };

  const bot = new Discord.Client(BOT_CONFIG);

  bot.on('message',(message) => {
    if (!message.author.bot) {
      if (message.member) {
        if (message.member.hasPermission('ADMINISTRATOR')) {
          // SERVER RULES COMMAND
          if (message.content.startsWith('+version')) {
            let embed = new Discord.RichEmbed()

            embed.setAuthor("How to select a server version", "https://static.spigotmc.org/img/spigot-og.png")
            embed.setColor(0x741cb8)
            embed.setDescription("Before you can play on your server, you have to select a Server Version.")
            embed.addField('Step 1', 'Click on the `Manage` button.')
            embed.addField('Step 2', 'G0 to `Configuration > Advanced`')
            embed.addField('Step 3', 'Choose with Server Version you want\n```> Edition: With type, vanilla, Spigot, Bungeecord etc.\n> Version: Witch server version you want```')
            embed.addField('Step 4', 'Click on the red text called `Install Edition`')
            embed.addField('Step 5', 'Go back to `System > Console`')
            embed.addField('Step 6', 'Type witch Java version you need for your server\n```> Java 8: 1.7 - 1.16.5\n> Java 11: None\n> Java 16: 1.17 - 1.17.1\n> Java 17: 1.18 - 1.18.7```')
            embed.addField('Step 7', 'Have Fun!')
            embed.setTimestamp()

            message.channel.send(embed)
            return message.delete();
          }

          // MINECRAFT MOD INSTALL COMMAND
          if (message.content.startsWith('+mods')) {
            let embed = new Discord.RichEmbed()

            embed.setAuthor("How to install a mod pack", "https://i.pinimg.com/originals/33/24/e1/3324e1703430de8fc30452a5975d1fc1.png")
            embed.setColor(0x741cb8)
            embed.setDescription("Here is a step by step tutorial on how to install a mod pack")
            embed.addField('Step 1', 'Stop your server')
            embed.addField('Step 2', '(Optional) Make a backup of your world')
            embed.addField('Step 3', 'Go to `Tools > Mod Pack Manager`')
            embed.addField('Step 4', 'Search the mod you want')
            embed.addField('Step 5', 'Choose a verison you want')
            embed.addField('Step 6', 'Click on `Install`')
            embed.addField('Step 7', 'In the popup you click check the `Format server (all data will be lost)`')
            embed.addField('Step 8', 'Click on the `Ok` button')
            embed.addField('Step 9', 'G0 to `Configuration > Advanced`')
            embed.addField('Step 10', 'Choose with `Forge Version` the mod need tyo run\n```> Edition: With type, vanilla, Spigot, Bungeecord etc.\n> Version: Witch server version you want```')
            embed.addField('Step 11', 'Click on the red text called `Install Edition`')
            embed.addField('Step 12', 'Go back to `System > Console`')
            embed.addField('Step 13', 'Type witch Java version you need for your server\n```> Java 8: 1.7 - 1.16.5\n> Java 11: None\n> Java 16: 1.17 - 1.17.1\n> Java 17: 1.18 - 1.18.7```')
            embed.addField('Step 14', 'Have Fun!')
            embed.setTimestamp()

            message.channel.send(embed)
            return message.delete();
          }

          // TXADMIN COMMAND
          if (message.content.startsWith('+txadmin')) {
            let embed = new Discord.RichEmbed()

            embed.setAuthor("How to enable txAdmin on your FiveM Server", "https://i.file.glass/yuFh9dmlBS.png")
            embed.setColor(0x741cb8)
            embed.setDescription("Here is a step by step tutorial on how to enable txAdmin for your Fivem Server")
            embed.addField('Step 1', '1. Stop your server')
            embed.addField('Step 2', 'Go to `Configuration > Startup Parameters`')
            embed.addField('Step 3', 'Change `Enable txadmin` to 1')
            embed.addField('Step 4', 'Clikc on the blue text called `Update Startup Parameters`')
            embed.addField('Step 5', 'Go back to `System > Console`')
            embed.addField('Step 6', 'Start your server')
            embed.addField('Step 7', 'See the console for more info')
            embed.setTimestamp()

            message.channel.send(embed)
            return message.delete();
          }

          // VERIFICATION COMMAND
          if (message.content.startsWith('+verification')) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("Galaxynode Verification", "https://cdn.discordapp.com/attachments/934472126893817856/942420228430762024/logo.png")
            embed.setDescription("By clicking the check mark, you automatically accept the rules of the Server. You always have to stick to the rules otherwise there will be consequences.")
            embed.setColor(0x741cb8)
            embed.setFooter("Galaxynode")
            message.channel.send(embed).then(function (message) {
              message.react("✅")
            });
            return message.delete();
          }

          // BUGS COMMAND
          if (message.content.startsWith('+bugs')) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("Galaxynode Bugs", "https://cdn.discordapp.com/attachments/934472126893817856/942420228430762024/logo.png")
            embed.setDescription("If you find a bug, please report it in here in the next format:```Desciption:\nLink to video(s):```")
            embed.setColor(0x741cb8)
            embed.setFooter("Galaxynode")
            embed.addField('Important Information:', 'You need to put everything in 1 message, otherwise you are spamming.', false)
            message.channel.send(embed)
            return message.delete();
          }
        }
        
        // CHANGELOG SHIT
        if (message.channel.id === CHANGELOGS_CHANNEL) {
          if (USE_CHANGELOGS_CHANNEL == true) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("Galaxynode Changelogs", "https://cdn.discordapp.com/attachments/934472126893817856/942420228430762024/logo.png")
            .setColor(0x741cb8)
            .setDescription(message.content + "\n\u200b\n")
            .setTimestamp(new Date());
            message.channel.send(embed)
            return message.delete();
          }
        }
        
        // SERVER SUGGESTION SHIT
        if (message.channel.id === SUGGESTION_CHANNEL) {
          if (USE_SUGGESTION_CHANNEL == true) {
            let embed = new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0x741cb8)
            .setTitle('Server Suggestion')
            .setDescription(message.content + "\n\u200b\n")
            .setTimestamp(new Date());
            message.channel.send(embed).then((message) => {
              const sent = message;
              sent.react('👍').then(() => {
                sent.react('👎').then(() => {
                  log(LOG_LEVELS.SPAM,'Completed suggestion message');
                }).catch(console.error);
              }).catch(console.error);
            }).catch(console.error);
            return message.delete();
          }
        }

        // BUG CHANNEL SHIT
        if (message.channel.id === BUG_CHANNEL) {
          if (USE_BUG_CHANNEL == true) {
            let embedStaff = new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0xf54242)
            .setTitle('Bug Report')
            .setDescription(message.content)
            .setTimestamp(new Date());
            bot.channels.get(BUG_LOG_CHANNEL).send(embedStaff).then(null).catch(console.error);
            return message.delete();
          }
        }
      }
    }
  });

  bot.login(BOT_TOKEN).then(null).catch(() => {
    log(LOG_LEVELS.ERROR,'Unable to login check your login token');
    console.error(e);
    process.exit(1);
  });

  return bot;
}