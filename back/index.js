const server = require('http').createServer();
const io = require('socket.io')(server);

// TODO: change to 4 later
const MAX_PLAYERS = 2;

io.on('connection', socket => {
  let roomName = allocatePlayer(socket);
  
  if (io.sockets.adapter.rooms[roomName].length === MAX_PLAYERS) {
    io.to(roomName).emit('match start', { foo: 'bar '});
  }

  socket.on('set letters', letters => {
    let room = getRoomName(socket);
    socket.broadcast.to(room).emit('set letters', letters);
  });
});

const getRoomName = player => {
  let playerRooms = Object.keys(player.rooms);
  return playerRooms.filter(room => room.match('match-room'));
}

const allocatePlayer = player => {
  let wasPlayerAllocated = false;
  let matchRooms = countRooms();
  let designatedRoom = 'match-room-';

  if (matchRooms === 0) {
    designatedRoom += 0;
    player.join(designatedRoom);
    wasPlayerAllocated = true;
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
      return designatedRoom;
    }
  }
}

const countRooms = () => {
  let allRooms = Object.keys(io.sockets.adapter.rooms);
  return allRooms.filter(room => room.match('match-room')).length;
}

server.listen(3000);