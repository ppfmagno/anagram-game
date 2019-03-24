const server = require('http').createServer();
const io = require('socket.io')(server);
const axios = require('axios');

const rooms = io.sockets.adapter.rooms; // 'shortcut' (reference) to rooms
const MAX_PLAYERS = 3; // max number of players for room
const MAX_LETTERS = MAX_PLAYERS * 2; // max players times number of letters each player can select
const WAITING_TIME = 5000; // time in milliseconds to wait when every player has selected its letters
const LOCK_TIME = 2000; // time in milliseconds to lock letters; it's included in WAITING_TIME and should no be less than WAITING_TIME
const WORDS_TIME = 10000; // time to players send their words
const matchStatus = {
  waiting: 'waiting',
  ready: 'ready',
  locked: 'locked',
  start: 'start',
  stop: 'stop',
  checking: 'checking',
  finished: 'finished'
};

io.on('connection', socket => {
  const playerId = socket.id;
  const roomName = allocatePlayer(socket);
  sendLetters(roomName);
  
  if (rooms[roomName].length === MAX_PLAYERS) {
    io.to(roomName).emit('full room', { foo: 'bar '});
  }

  socket.on('set letters', newLetters => {
    if (rooms[roomName].status === matchStatus.waiting){
      // get room's letters and separate only letters from other players
      let othersLetters = rooms[roomName].letters.filter(letter => letter.playerId !== playerId);
      // make sure incoming letter array doesn't have more than 2 letters
      // if so, remove the excess
      if (newLetters.length > 2) newLetters.splice(2);
      // set room's letters to be other's letters + new ones
      rooms[roomName].letters = [...othersLetters, ...newLetters]
      sendLetters(roomName);
      // if room is full and has all letters set, prepare to start (status -> ready)
      if (rooms[roomName].length === MAX_PLAYERS && rooms[roomName].letters.length === MAX_LETTERS && rooms[roomName].status !== matchStatus.ready) {
        rooms[roomName].status = matchStatus.ready;
        io.to(roomName).emit(rooms[roomName].status);
        countDownToLock(roomName);
      }
    }
  });

  socket.on('set words', words => {
    if (rooms[roomName].status === matchStatus.stop) {
      // TODO: filter repeated words from each user (back and front to be sure)
      rooms[roomName].words.push(words);
      if (rooms[roomName].words.length === rooms[roomName].activePlayers.length) {
        checkWords(roomName);
      }
    }
  });

  socket.on('disconnecting', reason => {
    rooms[roomName].letters = rooms[roomName].letters.filter(letter => letter.playerId !== playerId);
    rooms[roomName].activePlayers = rooms[roomName].activePlayers.filter(id => id !== playerId);
    // if the room gets empty, stop all timers
    if (rooms[roomName].activePlayers.length === 0) {
      for (const timerName in rooms[roomName].timers) {
        clearTimeout(rooms[roomName].timers[timerName]);
      }
    }
    sendLetters(roomName);
  });
});

const sendLetters = roomName => {
  io.to(roomName).emit('set letters', rooms[roomName].letters);
}

const allocatePlayer = player => {
  let wasPlayerAllocated = false;
  let matchRooms = countRooms();
  let designatedRoom = 'match-room-';

  // if there is no room created, join player in match-room-0
  if (matchRooms === 0 || !rooms['match-room-0']) {
    designatedRoom += 0;
    player.join(designatedRoom);
    createNewRoom(designatedRoom);
    rooms[designatedRoom].activePlayers.push(player.id);
    return designatedRoom;
  }
  if (matchRooms > 0) {
    // go through all created rooms to see if there is one vacant
    for (let i = 0; i < matchRooms; i++) {
      // console.log(rooms)
      let players = rooms[`match-room-${i}`].length;
      let roomStatus = rooms[`match-room-${i}`].status;
      if (players < MAX_PLAYERS && roomStatus === matchStatus.waiting) {
        designatedRoom += i;
        player.join(designatedRoom);
        rooms[designatedRoom].activePlayers.push(player.id);
        wasPlayerAllocated = true;
        return designatedRoom;
      }
    }
    if (!wasPlayerAllocated) {
      designatedRoom += matchRooms;
      player.join(designatedRoom);
      createNewRoom(designatedRoom);
      rooms[designatedRoom].activePlayers.push(player.id);
      return designatedRoom;
    }
  }
}

const createNewRoom = roomName => {
  // create room status attribute to keep track of the match status,
  rooms[roomName].status = matchStatus.waiting;
  // letters attribute in new room to store match letters,
  rooms[roomName].letters = [];
  // words attribute to store match words
  // (this is an array of objects with player id an its words),
  rooms[roomName].words = []
  // words to be verified attribute
  // (this is an aray of uniques with the words to be verified on dictionary api),
  rooms[roomName].wordsToCheck = [];
  // active players attribute
  // (this is an array of the sockets' ids that are connected),
  rooms[roomName].activePlayers = [];
  // timers attribute
  // (this is an object of timers to control the match)
  rooms[roomName].timers = {};

}

const countDownToLock = roomName => {
  rooms[roomName].timers.timerToLock = setTimeout(() => {
    rooms[roomName].status = matchStatus.locked;
    io.to(roomName).emit(rooms[roomName].status);
    countDownToStart(roomName);
  }, WAITING_TIME - LOCK_TIME);
}

const countDownToStart = roomName => {
  rooms[roomName].timers.timerToStart = setTimeout(() => {
    rooms[roomName].status = matchStatus.start;
    io.to(roomName).emit(rooms[roomName].status);
    countDownToStop(roomName);
  }, LOCK_TIME)
}

const countDownToStop = roomName => {
  rooms[roomName].timers.timerToStop = setTimeout(() => {
    rooms[roomName].status = matchStatus.stop;
    io.to(roomName).emit(rooms[roomName].status);
  }, WORDS_TIME)
}

const checkWords = roomName => {
  const url = 'http://dicionario-aberto.net/search-json/';
  let allWords = [];
  for (const wordGroup of rooms[roomName].words) {
    allWords = [...allWords, ...wordGroup.words]
  }
  rooms[roomName].wordsToCheck = [... new Set([...allWords])];
  rooms[roomName].wordsToCheck.forEach(word => {
    axios.request({
      method: 'get',
      baseURL: url,
      url: encodeURI(word),
      data: { word },
    })
    .then(res => console.log(res.data))
    .catch(err => {
      if (err.response.status === 404)
      console.log(JSON.parse(err.config.data).word);
    });
  });
}

const countRooms = () => {
  let allRooms = Object.keys(rooms);
  return allRooms.filter(room => room.match('match-room')).length;
}

server.listen(3000);