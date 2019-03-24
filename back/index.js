const server = require('http').createServer();
const io = require('socket.io')(server);

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
      rooms[roomName].words.push(words);
    }
  });

  socket.on('disconnecting', reason => {
    rooms[roomName].letters = rooms[roomName].letters.filter(letter => letter.playerId !== playerId);
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

  // TODO: implement logic to allocate player in roon only if match has not started yet

  // if there is no room created, join player in match-room-0
  if (matchRooms === 0) {
    designatedRoom += 0;
    player.join(designatedRoom);
    createNewRoom(designatedRoom);
    return designatedRoom;
  }
  if (matchRooms > 0) {
    // go through all created rooms to see if there is one vacant
    for (let i = 0; i < matchRooms; i++) {
      let players = rooms[`match-room-${i}`].length;
      if (players < MAX_PLAYERS) {
        designatedRoom += i;
        player.join(designatedRoom);
        wasPlayerAllocated = true;
        return designatedRoom;
      }
    }
    if (!wasPlayerAllocated) {
      designatedRoom += matchRooms;
      player.join(designatedRoom);
      createNewRoom(designatedRoom);
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
  // (this is an array of objects with player id an its words)
  rooms[roomName].words = []
  // words to verify attribute
  // (this is an aray of uniques with the words to be verified on dictionary api)
  rooms[roomName].wordsToCheck = [];
  // TODO: add active players logic to verify if the total number of players that sent words is the same as rooms active players
  // TODO: it has to decrement if player leaves room, just to be sure 
}

const countDownToLock = roomName => {
  setTimeout(() => {
    rooms[roomName].status = matchStatus.locked;
    io.to(roomName).emit(rooms[roomName].status);
    countDownToStart(roomName);
  }, WAITING_TIME - LOCK_TIME);
}

const countDownToStart = roomName => {
  setTimeout(() => {
    rooms[roomName].status = matchStatus.start;
    io.to(roomName).emit(rooms[roomName].status);
    countDownToStop(roomName);
  }, LOCK_TIME)
}

const countDownToStop = roomName => {
  setTimeout(() => {
    rooms[roomName].status = matchStatus.stop;
    io.to(roomName).emit(rooms[roomName].status);
  }, WORDS_TIME)
}

const checkWords = roomName => {
  // go through each rooms[roomName].words and get unique words to check
  rooms[roomName].wordsToCheck = [... new Set([...words.words])]
}

const countRooms = () => {
  let allRooms = Object.keys(rooms);
  return allRooms.filter(room => room.match('match-room')).length;
}

server.listen(3000);