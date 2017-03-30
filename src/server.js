const path = require('path');
const express = require('express');
const receiver = require('./receiver.js');

const app = express();
const port = process.env.PORT || process.env.NODE_PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});

receiver.init(server);

//  --  HTTP stuff

app.use(express.static(path.join(`${__dirname}/../client/html/`)));
app.use('/js/client.js', express.static(path.join(`${__dirname}/../client/js/client.js`)));

app.get('/', (request, response) => {
  response.sendFile(`${__dirname}/../client/html/index.html`);
});
