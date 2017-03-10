const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || process.env.NODE_PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});

// const httpServer = require('http').createServer(app);
const io = require('socket.io')(server);

//  --  HTTP stuff

app.use(express.static(path.join(`${__dirname}/../client/html/`)));
app.use('/js/client.js', express.static(path.join(`${__dirname}/../client/js/client.js`)));

app.get('/', (request, response) => {
  response.sendFile(`${__dirname}/../client/html/index.html`);
});

//  --  Some socket stuff

/**
 * Gets all clients in a given room. Modified version of function from:
 *  http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients
 * @param  {String} roomname  The name of a room to search
 * @return {Array}            The sockets in the given room
 */
const getRoomClients = (roomname) => {
  const room = io.sockets.adapter.rooms[roomname];
  const clients = room.map(id => io.sockets.adapter.nsp.connected[id]);

  return clients;
};

//  --  Game Logic

/*
User object: {
  name: String  (what the object is keyed to)
  role: String  (the role of the player)
  lost: boolean (whether or not they can still take actions)
  won: boolean (whether or not they won the game)
  hasGone: boolean  (whether or not they can still go)
  innocence: int  (resource)
  guilt: int  (resource)
  status: int (resource)
  persuasion: int (how much is left in their individual win pool)
  action: {
    actionName: String (the action they took)
    target: String (the user they targeted)
  }
  effects: Array of String (what actions were taken against them this turn)
}
*/
// const users = [];  // Won't actually be a "global" object like this, will be per room
//
/*
  roomname: String (the roomname, as referred to in socket io, of this session)
  acquittal: int (the remaining amount of innocence all players need to win)
  users: Array of type user (see above) (the users in the session)
  active: bool (if the game has started)
  gameOver: bool (if an active game has finished) -- May be removed later
  turnNum: int (how many turns have passed)
  lossThreshold: int (how much guilt users need to lose)  -- May be removed
  notifications: Array of String (game state updates)
 */
const sessions = [];

const isTurnDone = (room) => {
  // returns false if any users have not yet gone
  const turnDone = room.users.every(user => (user.hasGone && !user.lost));

  return turnDone;
};

const processUser = (_user) => {
  const user = _user;

  // Process user's own action
  switch (user.action) {
    case 'slander':
      user.guilt += 1;
      break;
    case 'indict':
      user.guilt += 1;
      break;
    case 'vindicated':
      user.innocence += 1;
      break;
    case 'condemn':
      user.innocence -= 1;
      break;
    case 'confess':
      user.innocence -= 1;
      break;
    case 'absolve':
      user.innocence -= 1;
      this.room.acquittal -= 1;
      this.room.notifications.push('Someone has absolved the group.');
      break;
    default:
      break;
  }

  // Process actions that targeted user
  for (let i = 0; i < user.effects.length; i++) {
    switch (user.effects[i]) {
      case 'slander':
        user.status -= 1;
        this.room.notifications.push(`${user.name} has been slandered.`);
        break;
      case 'indict':
        user.innocence -= 1;
        this.room.notifications.push(`${user.name} has been indicted.`);
        break;
      case 'vindicated':
        user.guilt -= 1;
        this.room.notifications.push(`${user.name} has been vindicated.`);
        break;
      case 'condemn':
        user.guilt += 1;
        this.room.notifications.push(`${user.name} has been condemned.`);
        break;
      case 'confess':
        user.status += 1;
        this.room.notifications.push('Someone has confessed.');
        break;
      default:
        break;
    }
  }
  user.effects = [];   // Empty out array to prepare for next turn

  if (user.guilt >= this.room.lossThreshold) {
    user.lost = true;
    this.room.notifications.push(`${user.name} has been branded guilty!`);
  }
};

const processEndGame = (room, winner) => {
  // List all winners/losers & their roles, etc.
  console.dir(winner);  // Deal with this later
  const players = [];

  for (let i = 0; i < room.users.length; i++) {
    players[i] = {
      name: room.users[i].name,
      role: room.users[i].role,
    };
  }

  io.sockets.in(room.roomname).emit('results', { players });
};

const processTurn = (_room) => {
  const room = _room;

  // Insert random server action

  // Process (and randomize order of) all actions
  room.users.forEach(processUser.bind({ room }));

  room.notifications.forEach((notification) => {
    io.sockets.in(room.roomname).emit('notification', { msg: notification });
  });

  // Check if all players lost, and send loss messages as appropriate regardless
  const clients = getRoomClients(room.roomname);
  const allGuilty = room.users.every(user => user.lost);

  const comrades = room.users.map(user => (user.role.toLowerCase() === 'comrade' && !user.lost));
  const groupWin = room.acquittal <= 0;

  const traitors = room.users.map(user => (user.role.toLowerCase() === 'traitor' && !user.lost));
  const individualWin = !(traitors.every(user => (user.persuasion > 0)));

  if (allGuilty) {
    processEndGame(room, 'none');

    room.users.forEach((user) => {
      clients[user.name].emit('loss', { });
    });
  } else if (groupWin) {
    comrades.forEach((user) => {
      clients[user.name].emit('win', { });
    });

    traitors.forEach((user) => {
      clients[user.name].emit('loss', { });
    });

    processEndGame(room, 'comrades');
  } else if (individualWin) {
    traitors.forEach((user) => {
      clients[user.name].emit('win', { });
    });

    comrades.forEach((user) => {
      clients[user.name].emit('loss', { });
    });

    processEndGame(room, 'traitors');
  } else {
    room.turnNum += 1;
    room.users.forEach((_user) => {
      const user = _user;
      user.hasGone = false; // Reset turn track
    });
    io.sockets.in(room.roomname).emit('turnCount', { turnNum: room.turnNum });
  }
};

//  --  Socket stuff

const onJoin = (_socket) => {
  const socket = _socket;

  socket.on('join', (data) => {
    // Initialize session
    if (!sessions[data.roomname]) {
      sessions[data.roomname] = {
        roomname: data.roomname,
        acquittal: 20,
        users: [],
        active: true,   // For now
        gameOver: false,
        turnNum: 0,
        lossThreshold: 10,
        notifications: [],
      };
    }

    sessions[data.roomname].users.push({
      name: data.name,
      role: 'comrade',  // Will need to be randomized at some point
      lost: false,
      won: false,
      hasGone: false,
      innocence: 0,
      guilt: 0,
      status: 0,
      persuasion: 0,
      action: { },
      effects: [],
    });
  });
};

const onStart = (_socket) => {
  const socket = _socket;

  socket.on('start', (data) => {
    if (sessions[data.roomname]) {
      sessions[data.roomname].active = true;
    }

    io.sockets.in(data.roomname).emit('turnCount', { turnNum: sessions[data.roomname].turnNum });
  });
};

const onAction = (_socket) => {
  const socket = _socket;

  socket.on('action', (data) => {
    const room = data.room;
    const actingUser = data.name;
    const targetedUser = data.target;
    const action = data.action;

    // First perform validity checks on all the passed params & check if user lost

    // Next, add action to queue if user hasn't gone yet
    const currRoom = sessions[room];
    const user = sessions[room].users[actingUser];
    if (user.hasGone === false) {
      user.hasGone = true;
      user.action = {
        actionName: action,
        target: targetedUser,
      };
      currRoom.users[targetedUser].effects.push(action);
    }

    // Tell the user if their action was successfully received
    socket.emit('confirm', { confirm: user.hasGone });

    // If that was the last user to go, resolve the turn
    if (user.hasGone) {
      if (isTurnDone(currRoom)) {
        processTurn(currRoom);
      }
    }
  });
};

const onList = (_socket) => {
  const socket = _socket;

  socket.on('listUsers', (data) => {
    const room = data.room;
    const usersInGame = [];
    for (let i = 0; i < room.users.length; i++) {
      usersInGame.push({
        name: room.users[i].name,
      });
    }
    socket.emit('playerList', { list: usersInGame });
  });
};

io.on('connection', (_socket) => {
  onJoin(_socket);
  onStart(_socket);
  onAction(_socket);
  onList(_socket);
});
