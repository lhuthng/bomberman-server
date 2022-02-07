const express = require('express');
const port = process.env.PORT || 8080;

const app = express();

app.use(express.static(__dirname + '/build'));

app.listen(port, () => {
  console.log(port);
});
app.get('/', (req, res, nxt) => {
  res.sendFile(__dirname + '/build/index.html');
});