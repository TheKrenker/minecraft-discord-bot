'use strict';

const util = require('minecraft-server-util');
const Discord = require('discord.js');

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
  const SERVER_ADDRESS = SETUP.SERVER_ADDRESS;
  const SERVER_PORT = SETUP.SERVER_PORT;
  const SHOW_SERVER_PORT = SETUP.SHOW_SERVER_PORT;
  const SERVER_VERSION = SETUP.SERVER_VERSION;
  const SHOW_SERVER_VERSION = SETUP.SHOW_SERVER_VERSION;
  const TICK_MAX = 1 << 9;
  const LOG_LEVEL = SETUP.LOG_LEVEL !== undefined ? parseInt(SETUP.LOG_LEVEL) : LOG_LEVELS.INFO;
  const BOT_TOKEN = SETUP.BOT_TOKEN;
  const STATUS_MESSAGE = SETUP.STATUS_MESSAGE;
  const USE_STATUS_MESSAGE = SETUP.USE_STATUS_MESSAGE;
  const MESSAGE_ID = SETUP.MESSAGE_ID;
  const SUGGESTION_CHANNEL = SETUP.SUGGESTION_CHANNEL;
  const USE_SUGGESTION_CHANNEL = SETUP.USE_SUGGESTION_CHANNEL;
  const BUG_CHANNEL = SETUP.BUG_CHANNEL;
  const BUG_LOG_CHANNEL = SETUP.BUG_LOG_CHANNEL;
  const USE_BUG_CHANNEL = SETUP.USE_BUG_CHANNEL;
  const LOG_CHANNEL = SETUP.LOG_CHANNEL;
  const UPDATE_TIME = SETUP.UPDATE_TIME;

  var TICK_N = 0;
  var MESSAGE;
  var STATUS;

  var loop_callbacks = [];

  const log = function(level,message) {
    if (level >= LOG_LEVEL) console.log(`${new Date().toLocaleString()} :${level}: ${message}`);
  };

  const bot = new Discord.Client(BOT_CONFIG);

  const sendOrUpdate = function(embed) {
    if (MESSAGE !== undefined) {
      MESSAGE.edit(embed).then(() => {
        log(LOG_LEVELS.DEBUG,'Update success');
      }).catch(() => {
        log(LOG_LEVELS.ERROR,'Update failed');
      })
    } else {
      let channel = bot.channels.get(STATUS_MESSAGE);
      if (channel !== undefined) {
        channel.fetchMessage(MESSAGE_ID).then((message) => {
          MESSAGE = message;
          message.edit(embed).then(() => {
            log(LOG_LEVELS.SPAM,'Update success');
          }).catch(() => {
            log(LOG_LEVELS.ERROR,'Update failed');
          });
        }).catch(() => {
          channel.send(embed).then((message) => {
            MESSAGE = message;
            log(LOG_LEVELS.INFO,`Sent message (${message.id})`);
          }).catch(console.error);
        })
      } else {
        log(LOG_LEVELS.ERROR,'Update channel not set');
      }
    }
  };

  const UpdateEmbed = function() {
    let dot = TICK_N % 2 === 0 ? 'StoneMC' : 'Minecraft';
    let embed = new Discord.RichEmbed()
    embed.setAuthor("StoneMC Server Status", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
    embed.setColor(0x42f563)
    embed.setFooter("StoneMC")
    embed.setTimestamp(new Date())
    if (STATUS !== undefined)
    {
      embed.addField('Important Server Message',`${STATUS}\n\u200b\n`);
      embed.setColor(0xeff542)
    }
    embed.addField('Quick Links?','[Website](https://stonemc.net) | [Store](https://stonemc.tebex.io/) | [Vote](https://stonemc.net/vote.php)\n\u200b\n')
    // embed.addField('How can i join?','I WILL CHANGE THIS LATER\n\u200b\n')
    return embed;
  };

  const options = {
    timeout: 1000 * 5,
    enableSRV: true
  };

  const updateMessage = function() {
    util.status(SERVER_ADDRESS, SERVER_PORT, options)
      .then((result) => {
        // console.log(result)
        let embed = UpdateEmbed()
        embed.addField('Server Status', 'Online', true)
        embed.addField('Online Players', result.players.online + '/' + result.players.max + '\n\u200b\n', true)
        if (SHOW_SERVER_VERSION == true) {
          embed.addField('Version', SERVER_VERSION + '\n\u200b\n', true)
        }
        sendOrUpdate(embed);
      })
      .catch((error) => {
        let embed = UpdateEmbed()
        .setColor(0xf54242)
        .addField('Server Status', 'Offline\n\u200b\n', true)
        sendOrUpdate(embed);
      })
    TICK_N++;
    if (TICK_N >= TICK_MAX) {
      TICK_N = 0;
    }
    for (var i=0;i<loop_callbacks.length;i++) {
      let callback = loop_callbacks.pop(0);
      callback();
    }
  };

  bot.on('ready',() => {
    log(LOG_LEVELS.INFO,'Started...');
    if (SHOW_SERVER_PORT == true) {
      bot.user.setActivity(SERVER_ADDRESS + ":" + SERVER_PORT)
    } else {
      bot.user.setActivity(SERVER_ADDRESS)
    }

    if (USE_STATUS_MESSAGE == true) {
      bot.setInterval(updateMessage, UPDATE_TIME);
    }
  });

  function checkLoop() {
    return new Promise((resolve,reject) => {
      var resolved = false;
      let id = loop_callbacks.push(() => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        } else {
          log(LOG_LEVELS.ERROR,'Loop callback called after timeout');
          reject(null);
        }
      })
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      },3000);
    })
  }

  bot.on('debug',(info) => {
    log(LOG_LEVELS.SPAM,info);
  })

  bot.on('error',(error,shard) => {
    log(LOG_LEVELS.ERROR,error);
  })

  bot.on('warn',(info) => {
    log(LOG_LEVELS.DEBUG,info);
  })

  bot.on('disconnect',(devent,shard) => {
    log(LOG_LEVELS.INFO,'Disconnected');
    checkLoop().then((running) => {
      log(LOG_LEVELS.INFO,`Loop still running: ${running}`);
    }).catch(console.error);
  })

  bot.on('reconnecting',(shard) => {
    log(LOG_LEVELS.INFO,'Reconnecting');
    checkLoop().then((running) => {
      log(LOG_LEVELS.INFO,`Loop still running: ${running}`);
    }).catch(console.error);
  })

  bot.on('resume',(replayed,shard) => {
    log(LOG_LEVELS.INFO,`Resuming (${replayed} events replayed)`);
    checkLoop().then((running) => {
      log(LOG_LEVELS.INFO,`Loop still running: ${running}`);
    }).catch(console.error);
  })

  bot.on('rateLimit',(info) => {
    log(LOG_LEVELS.INFO,`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}ms (${info.path} / ${info.requestLimit ? info.requestLimit : info.limit ? info.limit : 'Unkown limit'})`);
    if (info.path.startsWith(`/channels/${STATUS_MESSAGE}/messages/${MESSAGE_ID ? MESSAGE_ID : MESSAGE ? MESSAGE.id : ''}`)) bot.emit('restart');
    checkLoop().then((running) => {
      log(LOG_LEVELS.DEBUG,`Loop still running: ${running}`);
    }).catch(console.error);
  })
  
  bot.on('message', async function (msg) {
    if (msg.channel.id === '586631869928308743') {
      await msg.react(bot.emojis.get('587057796936368128'));
      await msg.react(bot.emojis.get('595353996626231326'));
    }
  });

  bot.on('message',(message) => {
    if (!message.author.bot) {
      if (message.member) {
        if (message.member.hasPermission('ADMINISTRATOR')) {
          if (message.content.startsWith('+status ')) {
            let status = message.content.substr(7).trim();
            let embed =  new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0xf54242)
            .setTitle('Updated status message')
            .setTimestamp(new Date());
            if (status === 'clear') {
              STATUS = undefined;
              embed.setDescription('Cleared status message');
            } else {
              STATUS = status;
              embed.setDescription(`New message:\n\`\`\`${STATUS}\`\`\``);
            }
            bot.channels.get(LOG_CHANNEL).send(embed);
            return log(LOG_LEVELS.INFO,`${message.author.username} updated status`);
          }
        }
        
        if (message.channel.id === SUGGESTION_CHANNEL) {
          if (USE_SUGGESTION_CHANNEL == true) {
            let embed = new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0x666666)
            .setTitle('Server Suggestion')
            .setDescription(message.content)
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

        if (message.channel.id === BUG_CHANNEL) {
          if (USE_BUG_CHANNEL == true) {
            let embedUser = new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0xf54242)
            .setTitle('Bug Report')
            .setDescription('Your message is sended to our staff-team!')
            .setTimestamp(new Date());

            let embedStaff = new Discord.RichEmbed()
            .setAuthor(message.member.nickname ? message.member.nickname : message.author.tag,message.author.displayAvatarURL)
            .setColor(0xf54242)
            .setTitle('Bug Report')
            .setDescription(message.content)
            .setTimestamp(new Date());

            message.channel.send(embedUser).then(null).catch(console.error);
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