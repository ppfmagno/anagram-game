const server = require('http').createServer();
const io = require('socket.io')(server);

const MAX_PLAYERS = 4;
let rooms = 0;

io.on('connection', socket => {
  console.log(io.sockets.adapter.rooms)
  socket.join('room' + rooms);
  let room = io.sockets.adapter.rooms['room' + rooms];
  // TODO: change to MAX_PLAYERS later
  if (room.length >= 2) rooms++;
  socket.on('disconnecting', () => {
    let rooms = Object.keys(socket.rooms);
    rooms.forEach(room => {
      if (io.sockets.adapter.rooms[room].length < 2) {
        rooms--;
      }
    });
  });
});

server.listen(3000);