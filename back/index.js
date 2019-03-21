const server = require('http').createServer();
const io = require('socket.io')(server);

// TODO: change to 4 later
const MAX_PLAYERS = 2;
let matchRooms = [];

io.on('connection', socket => {
  let allRooms = Object.keys(io.sockets.adapter.rooms);
  matchRooms = allRooms.filter((room) => room.match('match-room'));
  console.log(matchRooms)
  
  if (matchRooms.length === 0) {
    socket.join('match-room-0');
  } else {
    for (let i = 0; i < matchRooms.length; i++) {
      let players = io.sockets.adapter.rooms['match-room-' + i].length;
      if (players < MAX_PLAYERS) {
        socket.join('match-room-' + i);
        i = matchRooms.length;
      } else {
        // i = matchRooms.length;
        // socket.join('match-room-' + matchRooms.length);
      }
    }
  }
  console.log(Object.keys(socket.rooms));
  
  // let room = io.sockets.adapter.rooms['match-room-' + matchRooms.length];
  // if (room.length >= MAX_PLAYERS) rooms++;
  // socket.on('disconnecting', () => {
  //   let rooms = Object.keys(socket.rooms);
  //   rooms.forEach(room => {
  //     if (io.sockets.adapter.rooms[room].length < 2) {
  //       rooms--;
  //     }
  //   });
  // });
});

server.listen(3000);