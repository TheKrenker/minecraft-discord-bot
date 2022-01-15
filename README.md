# Minecraft Discord Server Status
Minecraft Server Status Discord Bot

A custom discord bot providing functionality for interacting with Minecraft servers and a discord community

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes

### Requirements:
- discord.js
- minecraft-server-util

### Running:
1. npm i
2. npm i discord.js
3. npm i minecraft-server-util
4. node ./index,js

### Setup:
```
BOT_TOKEN: Here you need to put your Discord Bot Token (https://discord.com/developers/applications)
SERVER_ADDRESS: Here you need to put your server adress without the port. Example: 127.0.0.1 or play.hypixel.net
SHOW_SERVER_PORT: true
SERVER_PORT: Here you need to put your server port. Example: 25565
SHOW_SERVER_VERSION: true,
SERVER_VERSION: Here you need to put your server version
UPDATE_TIME: This is the time that de Discord embed will be updated. (This is in MS. 2500 = 2.5 Seconds, 300000 = 5 minute)
USE_STATUS_MESSAGE: true
STATUS_MESSAGE: Here you need to put the ID of the channel where you wanting the message to appear
MESSAGE_ID: This is the message that will be updating if you restart the bot
USE_SUGGESTION_CHANNEL: true
SUGGESTION_CHANNEL: Here you need to put the ID of the channel where you wanting to have the server suggestion
USE_BUG_CHANNEL: true
BUG_CHANNEL: Here you need to put the ID of the channel where you wanting to have the server bugs
BUG_LOG_CHANNEL: Here you need to put the ID of the channel where you wanting to have the server bugs logs
LOG_CHANNEL: Here you need to put the ID of the channel where you wanting to have the discord bot log
LOG_LEVEL: Dont change this...
```

### Functions:
1. Server Status Embed
2. Server Suggestion Channel
3. Bug Channel
3. Bug Logs Channel

### Commands:
1. +status {message} - To add a warning message in the server status embed
2. +status clear - Clears status messsage

![Screenshot](https://cdn.discordapp.com/attachments/786291224189206548/931918352631332935/unknown.png)
