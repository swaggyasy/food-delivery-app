const { io } = require('socket.io-client');

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('Connected!', socket.id);
  socket.emit('test', { hello: 'world' });
});

socket.on('disconnect', () => {
  console.log('Disconnected!');
}); 