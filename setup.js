const fs = require('fs');
const readline = require('readline');

const TEMPLATE = {
<<<<<<< HEAD
  'SERVER_ADDRESS': {
    'message': "Here you need to put your server adress without the port. Example: 127.0.0.1 or play.hypixel.net",
    'required': true,
  },

  'SERVER_PORT': {
    'message': "Here you need to put your server port. Example: 25565",
    'required': true,
  },

  'SHOW_SERVER_PORT': {
    'message': "Enable or Disable the server port in de Playing status of the bot",
    'required': false,
  },

  'SERVER_VERSION': {
    'message': "Here you need to put your server version",
    'required': false,
  },
  'SHOW_SERVER_VERSION': {
    'message': "Enable or Disable the server version in the status message",
    'required': false,
  },

  'UPDATE_TIME': {
    'message': "This is the time that de Discord embed will be updated. (This is in MS. 2500 = 2.5 Seconds, 300000 = 5 minute)",
    'required': false,
  },

=======
>>>>>>> 9fd68555a6ac9209780a12df57146422ded84dfc
  'BOT_TOKEN': {
    'message': "Here you need to put your Discord Bot Token (https://discord.com/developers/applications)",
    'required': true,
  },

<<<<<<< HEAD
  'STATUS_MESSAGE': {
    'message': "Here you need to put the ID of the channel where you wanting the message to appear",
    'required': false,
  },

  'USE_STATUS_MESSAGE': {
    'message': "Enable or Disable the status message",
    'required': false,
  },

  'MESSAGE_ID': {
    'message': "This is the message that will be updating if you restart the bot",
    'required': false,
    'default': null
  },

=======
>>>>>>> 9fd68555a6ac9209780a12df57146422ded84dfc
  'SUGGESTION_CHANNEL': {
    'message': "Here you need to put the ID of the channel where you wanting to have the server suggestion",
    'required': false,
  },

  'USE_SUGGESTION_CHANNEL': {
    'message': "Enable or Disable the suggestion channel",
    'required': false,
  },

  'CHANGELOGS_CHANNEL': {
    'message': "Here you need to put the ID of the channel where you wanting to have the server suggestion",
    'required': false,
  },

  'USE_CHANGELOGS_CHANNEL': {
    'message': "Enable or Disable the suggestion channel",
    'required': false,
  },

  'BUG_CHANNEL': {
    'message': "Here you need to put the ID of the channel where you wanting to have the server bugs",
    'required': false
  },

  'USE_BUG_CHANNEL': {
    'message': "Enable or Disable the bug channel",
    'required': false
  },

  'BUG_LOG_CHANNEL': {
    'message': "Here you need to put the ID of the channel where you wanting to have the server bugs logs",
    'required': false,
  },

  'LOG_CHANNEL': {
    'message': "Here you need to put the ID of the channel where you wanting to have the discord bot log",
    'required': true,
  },

  'LOG_LEVEL': {
    'message': "Dont change this...",
    'required': true,
    'default': 3,
  },
};
const SAVE_FILE = './config.json';

function loadValue(key) {
  return new Promise((resolve,reject) => {
    const io = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    io.question(`Please enter a value for '${key}'${TEMPLATE[key].required ? '' : ` (Not required defaults to '${TEMPLATE[key].default}')`}\n  ${TEMPLATE[key].message}\n> `, (value) => {
      io.close();
      resolve(value);
    });
  })
}

exports.createValues = function(keys) {
  return new Promise((resolve,reject) => {
    var data = {};
    if (keys === undefined) {
      keys = Object.keys(TEMPLATE);
    }
    const loop = function(i) {
      if (i < keys.length) {
        loadValue(keys[i]).then((value) => {
          let realValue = value.trim();
          if (TEMPLATE[keys[i]].required) {
            if (realValue.length > 0) {
              data[keys[i]] = realValue;
              loop(i+1);
            } else {
              console.log('Invalid input');
              loop(i);
            }
          } else {
            if (realValue.length > 0) {
              data[keys[i]] = realValue;
              loop(i+1);
            } else {
              data[keys[i]] = TEMPLATE[keys[i]].default;
              loop(i+1);
            }
          }
        })
      } else {
        resolve(data);
      }
    }
    loop(0);
  })
}

exports.saveValues = function(values) {
  return new Promise((resolve,reject) => {
    fs.writeFile(SAVE_FILE,JSON.stringify(values),(err) => {
      if (err) return reject(err);
      return resolve(true);
    })
  })
}

exports.loadValues = function() {
  return new Promise((resolve,reject) => {
    fs.readFile(SAVE_FILE,(err,data) => {
      if (err) return reject(err);
      var json;
      try {
        json = JSON.parse(data);
      } catch(e) {
        console.log('Bad json in config.json');
        return reject(e);
      }
      let notFound = new Array();
      for (var key in TEMPLATE) {
        if (!json.hasOwnProperty(key)) {
          notFound.push(key);
        }
      }
      if (notFound.length === 0) {
        return resolve(json);
      } else {
        console.log('Some new configuration values have been added');
        exports.createValues(notFound).then((data) => {
          for (var key in data) {
            json[key] = data[key];
          }
          exports.saveValues(json).then(() => {
            resolve(json);
          }).catch(reject);
        }).catch(reject);
      }
    })
  });
}
