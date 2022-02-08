const express = require('express');
const app = express();
const server  = require('http').createServer(app);
const port = process.env.port || 8080;

server.listen(port, () => {
  console.log(port);
})

const io = require('socket.io')(server);

app.use(express.static(__dirname + '/build'));

app.get('/', (req, res, nxt) => {
  res.sendFile(__dirname + '/build/index.html');
});

io.on('connection', socket => {
  console.log(`${socket} connected`);

  socket.on('disconnect', () => {
    console.log(`${socket} disconnected`);
  });
});
