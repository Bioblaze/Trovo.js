const EventEmitter = require('events');
const TrovoApollo = require('../api/TrovoApollo');
const TrovoSocket = require('../socket/TrovoSocket');

class Trovo extends EventEmitter {
  constructor(settings) {
    super();
    this.bot = null;
    this.creator = null;
    this.ws = null;
    this.channelName = undefined;
    this.channelId = undefined;
    this.logger = console.log;
    if (settings) {
      this.logger = settings.logger;
    }
  }

  async login(channel, botEmail, botPassword, creatorEmail, creatorPassword) {
    if (channel.startsWith('https://trovo.live/')) {
      channel = channel.substring('https://trovo.live/'.length);
    }
    this.channelName = channel;

    this.bot = new TrovoApollo();
    await this.bot.login(botEmail, botPassword);
    if ((creatorEmail && creatorEmail.length > 0) && (creatorPassword && creatorPassword.length > 0)) {
      if (botEmail === creatorEmail) {
        this.creator = this.bot;
      } else {
        this.creator = new TrovoApollo();
        await this.creator.login(creatorEmail, creatorPassword);
      }
    }

    // Fetch channelInfo
    const { getLiveInfo } = await this.bot.GetLiveInfo(this.channelName);
    this.channelId = getLiveInfo.channelInfo.id;

    this.ws = new TrovoSocket(this.channelId, this);
    this.ws.connect();
    this.ws.on('chatMessage', (message) => {
      this.emit('chatMessage', message);
    });
    this.ws.on('chatEvent', (type, data) => {
      this.emit('chatEvent', type, data);
    });
    this.ws.on('jsonData', (type, data) => {
      this.emit('jsonData', type, data);
    });
  }

  async sendMessage(message) {
    this.bot.SendMessage(message, this.channelId);
  }

  async setTitle(title) {
    if (this.creator === null) throw new Error('setTitle require creator login');
    return this.creator.SetTitle(title);
  }

  async close () {
    this.ws.close()
  }
}

Trovo.Client = Trovo;

module.exports = Trovo;
