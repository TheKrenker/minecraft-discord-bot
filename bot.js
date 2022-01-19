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
  const CHANGELOGS_CHANNEL = SETUP.CHANGELOGS_CHANNEL;
  const USE_CHANGELOGS_CHANNEL = SETUP.USE_CHANGELOGS_CHANNEL;
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
    let embed = new Discord.RichEmbed()
    embed.setAuthor("StoneMC Server Status", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
    embed.setColor(0x42f563)
    embed.setFooter("StoneMC")
    embed.setTimestamp(new Date())
    if (STATUS !== undefined) {
      embed.addField('Important Server Message',`${STATUS}\n\u200b\n`);
      embed.setColor(0xeff542)
    }
    embed.addField('Quick Links','[Store](https://stonemc.tebex.io/)\n\u200b\n')
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
    if (msg.channel.id === '923271051478200390') {
      await msg.react(bot.emojis.get('932610680983519272'));
    }
  });

  // bot.on("ready", async () => {
  //   let guildID = "891752202740310097";
  //   let channelID = "923271051478200390";
  //   let emojiID = "932610680983519272";
  //   let roleID = "891752416675000330";

  //   let guild = bot.guilds.cache.find(guild => guild.id == guildID);
  //   let channel = await guild.channels.cache.find(ch => ch.id == channelID)
  //   channel.messages.fetch({ limit: 10 })
  //   .then(async messages => {
  //     messages.forEach(async message => {
  //       if (message.partial) await message.fetch();
  //       if (!message.guild) return;
  //       for (let reactionObj of message.reactions.cache) {
  //         for (let reaction of reactionObj) {
  //           if (typeof reaction == "string") continue;
  //           if (reaction.emoji.id != emojiID) continue;
  //           reaction.users.fetch()
  //           .then(async users => {
  //             users.forEach(async user => {
  //               if (user.bot) return;
  //               console.log("Adding role")
  //               await reaction.message.guild.members.cache.get(user.id).roles.add(roleID)
  //             })
  //           })
  //         }
  //       }
  //     });
  //   })
  //   .catch(console.error);
  // });

  bot.on("messageReactionAdd", async (reaction, user)=>{
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if(user.bot) return;
    if(!reaction.message.guild) return;
    if(reaction.message.channel.id === "923271051478200390"){
      if(reaction.emoji.id === "932610680983519272"){
        await reaction.message.guild.members.cache.get(user.id).roles.add("891752416675000330")
      }
    }
  })

  bot.on('message',(message) => {
    if (!message.author.bot) {
      if (message.member) {
        if (message.member.hasPermission('ADMINISTRATOR')) {
          // SERVER RULES COMMAND
          if (message.content.startsWith('+rules')) {
            let embed = new Discord.RichEmbed()
            let embed2 = new Discord.RichEmbed()
            let embed3 = new Discord.RichEmbed()
            let embed4 = new Discord.RichEmbed()
            let embed5 = new Discord.RichEmbed()

            embed.setAuthor("StoneMC Rules", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
            embed.setColor(0x666666)
            embed.setDescription("You must always obey the server rules. If you find someone who is breaking the rules, report them with /report or in the Discord.")

            embed2.setAuthor("Respect All Players")
            embed2.setColor(0x666666)
            embed2.setDescription("All players have the right to be spoken to or addressed in a respectful manner. Players are all users that play on the StoneMC Network.\n\u200b\n")
            embed2.addField('What do we mean by Respecting Players?', 'Respecting players means that players should not create negative experiences for others.\n\u200b\n**Including:**\n```> Trolling\n> Discriminatiob\n> Bad language\n> Insulting\n> Encouraging violence\n> Sharing another players personal information\n> Media advertising\n> Spamming\n>  chat filters\n> Harassment of content creators\n> Discussion of inappropriate topics```')

            embed3.setAuthor("Cheating and Exploiting")
            embed3.setColor(0x666666)
            embed3.setDescription("Players have the right to play in an environment which is fair and free of cheating and exploiting.\n\u200b\n")
            embed3.addField('What is an unfair advantage?', 'Unfair advantage means that players should not get interrupted during games for any of the reasons below:\n```> Encouraging cheating\n> Exploiting\n> Autoclick / Macros\n> Griefing\n> Disallowed mods\n> Stats boosting\n> Boosting experience through illegitimate methods```\n\u200b\n')
            embed3.addField('Found an exploit/bug?', 'If you find a bug please report it in the bugs channel.\n\u200b\n')
            embed3.addField('What Mods are allowed?', 'Modifications that are allowed on the StoneMC Network are cosmetic mods which show limited amounts of additional information or mods that cannot otherwise give an unfair in-game advantage.\n\u200b\n**Categories of Allowed Modifications::**\n```> Client performance improvement\n> Aesthetic modifications\n> Armor and Effect Status hud mods\n> Brightness and gamma adjustment mods```\nAll modifications are used at your own risk. For more information, please read the Allowed Modifications Guide.\n\u200b\n')

            embed4.setAuthor("Sensible Creative and Artistic Content")
            embed4.setColor(0x666666)
            embed4.setDescription("We encourage players to be creative in art and designs in a way that doesnt damage the experience of others. This includes all content such as drawings, item names, skins, and capes, which are created by players.\n\u200b\n")
            embed4.addField('What does Sensible Creative and Artistic Content mean?', 'Sensible Creative and Artistic Content means that players can express themselves with interactive parts of the server. However, players also have the right to not be exposed to certain content. Inappropriate creation/usage of the following content below should be reported to staff:\n\u200b\n**Including:**\n```> Drawings/Buildings\n> Pet names\n> Item Names\n> Skins and Capes\n> Usernames```\nPlease note you may also get punished for participating in building with others who break the rules.\n\u200b\n')
            embed4.addField('How can I log back on after having a bad username?', 'If your account was found to have a bad username, you will not be able to log onto the server.\nTo be able to log back on the server, you need to change your username to something appropriate and then you will be allowed to log onto the server.\nIf you believe there has been a mistake with the username that you can not access the server with, please contact us.\n\u200b\n')
            embed4.addField('What to do if you feel someone has not followed this rule:','If you feel someone has broken this rule, please let us know by reporting the user.\n\u200b\n**Ways to Report:**\n```> /report\n> In our Discord```')

            embed5.setAuthor("Player and Account Safety")
            embed5.setColor(0x666666)
            embed5.setDescription("Players have the right to play in an environment which is safe from account phishing, scamming, and account selling.\n\u200b\n")
            embed5.addField('Why do we have this rule?', 'As a Minecraft server, we do not have any control over your Minecraft account. However, player safety is very important to us, so where possible, we take steps to help protect our players from losing their accounts or otherwise being tricked or subjected to scams.\nPlease do NOT share your Minecraft account details with anyone else. You are responsible for what happens to your account so make sure that your passwords are secure and that you never give them out to anyone.\n\u200b\n')
            embed5.addField('What does Player and Account Safety mean?', 'Player and Account Security means that you use strong passwords, use 2FA, and do not share your information with other Users.\n\u200b\nThere are various ways that your security could be affected. **Some are listed below:**\n```> Staff Impersonation\n> Youtuber Impersonation\n> Sharing security or personal information\n> Unauthorised account access\n> Trading items or accounts\n> Using third party websites\n> Account selling\n> Phishing links\n> Scamming```\n\u200b\n')
            embed5.addField('How do I appeal an Account Security Alert Ban?', 'After you have received a ban for Account Security Alert, you will be able to create and submit an appeal via the support channel.\nWhile we understand that mistakes happen, if your account is repeatedly broken into, we will not be able to unban it continually.\nWhen your appeal has been successfully processed, you will have a new message appear when trying to login that looks similar to the following: “Your accounts security appeal was processed and the account has entered a recovery phase and will be able to access the server again after 14 days. Use this time to change passwords, emails and security questions.”\n\u200b\n')
            embed5.addField('Tips: How to keep your account safe', '**We recommend you:**\n```> Use strong passwords. At least 12 characters long\n> Use security questions with your Microsoft account\n> Use security questions with your Mojang account\n> Use two-factor authentication (2FA) on your Microsoft account\n> Use two-factor authentication (2FA) with your email address if your email provider supports it\n> Avoid any fishy links or URLs\n> And most importantly, DO NOT SHARE your account information with anyone```We highly recommend you migrate your Mojang account to a Microsoft account to improve your accounts security\n\u200b\n')
            embed5.addField('How do I know someone is a Staff Member?', 'Their names will be gray in chat. And infront of their names will be a prefix. The following prefixes are staff members:```> Owner |\n> Admin |\n> Mod |\n> Helper |```If someone is saying he is a staff member and has NOT one of the prefixes above. Then they are a regular player.')

            message.channel.send(embed)
            message.channel.send(embed2)
            message.channel.send(embed3)
            message.channel.send(embed4)
            message.channel.send(embed5)

            return message.delete();
          }

          // VERIFICATION COMMAND
          if (message.content.startsWith('+verification')) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("StoneMC Verification", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
            embed.setDescription("By clicking the check mark, you automatically accept the rules of the Server. You always have to stick to the rules otherwise there will be consequences.")
            embed.setColor(0x666666)
            embed.setFooter("StoneMC")
            message.channel.send(embed).then(function (message) {
              message.react("✅")
            });
            return message.delete();
          }

          // BUGS COMMAND
          if (message.content.startsWith('+bugs')) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("StoneMC Bugs", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
            embed.setDescription("Here you can see clients that are allowed on the server. You will only see the clients that have been asked the most if they are allowed.\n\u200b\nIf you find a bug or exploit, please report it in here in the next format:```Desciption:\nLink to video(s):```")
            embed.setColor(0x666666)
            embed.setFooter("StoneMC")
            embed.addField('Important Information:', 'You need to put everything in 1 message, otherwise you spam with multiple messages because we get the bugs in a other channel.', false)
            message.channel.send(embed)
            return message.delete();
          }

          // CLIENTS COMMAND
          if (message.content.startsWith('+clients')) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("StoneMC Rules", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
            embed.setDescription("Here you can see clients that are allowed on the server. You will only see the clients that have been asked the most if they are allowed.")
            embed.setColor(0x42f563)
            embed.setFooter("StoneMC")
            embed.addField('Allowed Clients:', '[Forge](https://files.minecraftforge.net/net/minecraftforge/forge/)\n[Lunar Client](https://www.lunarclient.com/)\n[Badlion Client](https://client.badlion.net/)\n\u200b\n', true)
            message.channel.send(embed)
            return message.delete();
          }

          // STATUS COMMAND, add a important message tot the server status
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
        
        // CHANGELOG SHIT
        if (message.channel.id === CHANGELOGS_CHANNEL) {
          if (USE_CHANGELOGS_CHANNEL == true) {
            let embed = new Discord.RichEmbed()
            embed.setAuthor("StoneMC Changelogs", "https://cdn.discordapp.com/attachments/786291224189206548/931646289450512404/stone.png")
            .setColor(0x666666)
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
            .setColor(0x666666)
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