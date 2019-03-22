const server = require('http').createServer();
const io = require('socket.io')(server);

// TODO: change to 4 later
const MAX_PLAYERS = 3;
const rooms = io.sockets.adapter.rooms;

io.on('connection', socket => {
  let roomName = allocatePlayer(socket);
  sendLetters(roomName);
  
  if (io.sockets.adapter.rooms[roomName].length === MAX_PLAYERS) {
    io.to(roomName).emit('match start', { foo: 'bar '});
  }

  socket.on('set letters', newLetters => {
    const playerId = socket.id;
    // let roomName = getRoomName(socket);
    let othersLetters = rooms[roomName].letters.filter(letter => letter.playerId !== playerId);
    rooms[roomName].letters = [...othersLetters, ...newLetters]
    sendLetters(roomName);
  });

  socket.on('disconnecting', reason => {
    console.log()
  });
});

const sendLetters = roomName => {
  if (rooms[roomName].letters.length > 0)
    io.to(roomName).emit('set letters', rooms[roomName].letters);
}

// const getRoomName = player => {
//   let playerRooms = Object.keys(player.rooms);
//   return playerRooms.filter(room => room.match('match-room'));
// }

const allocatePlayer = player => {
  let wasPlayerAllocated = false;
  let matchRooms = countRooms();
  let designatedRoom = 'match-room-';

  if (matchRooms === 0) {
    designatedRoom += 0;
    player.join(designatedRoom);
    // create letters attribute in new room to store match letters 
    io.sockets.adapter.rooms[designatedRoom].letters = [];
    return designatedRoom;
  }
  if (matchRooms > 0) {
    for (let i = 0; i < matchRooms; i++) {
      let players = io.sockets.adapter.rooms[`match-room-${i}`].length;
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
      // create letters attribute in new room to store match letters 
      io.sockets.adapter.rooms[designatedRoom].letters = [];
      return designatedRoom;
    }
  }
}

const countRooms = () => {
  let allRooms = Object.keys(io.sockets.adapter.rooms);
  return allRooms.filter(room => room.match('match-room')).length;
}

server.listen(3000);