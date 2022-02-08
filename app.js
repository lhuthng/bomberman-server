const express = require('express');
const app = express();
const server  = require('http').createServer(app);
const port = process.env.port || 8080;

server.listen(port, () => {
  console.log(port);
})

const command = require('./command')(server);

app.use(express.static(__dirname + '/build'));

app.get('/', (req, res, nxt) => {
  res.sendFile(__dirname + '/build/index.html');
});
