const _io = require('./io.js');
const broadcaster = require('./broadcaster.js');
const game = require('./state.js');


const onJoin = (_socket) => {
  const socket = _socket;

  socket.on('join', (data) => {
  const sessions = game.sessions();
  const roles = game.roles();

  // Initialize session if necessary
  if (!sessions[data.roomname]) {
    sessions[data.roomname] = {
    roomname: data.roomname,
    acquittal: 20,
    users: { },
    active: false,
    gameOver: false,
    turnNum: 0,
    lossThreshold: 10,
    notifications: [],
    };
  }

  sessions[data.roomname].users[data.name] = {
    name: data.name,
    socketid: socket.id,
    role: roles[Math.floor(Math.random() * roles.length)],
    lost: false,
    won: false,
    hasGone: false,
    innocence: 0,
    guilt: 0,
    status: 0,
    persuasion: 10,
    action: { },
    effects: [],
  };

  socket.join(data.roomname);

  broadcaster.roomEmit(data.roomname, 'notification', {
    msg: `${data.name} has joined the game.`,
  });
  // io.sockets.in(data.roomname).emit('notification',
  //   { msg: `${data.name} has joined the game.` }
  // );
  broadcaster.socketEmit(socket.id, 'notification', {
    msg: `You are a ${sessions[data.roomname].users[data.name].role}.`,
  });
  // socket.emit('notification',
  //   { msg: `Your role is that of a ${game.sessions[data.roomname].users[data.name].role}.` }
  // );
  });
};

const onStart = (_socket) => {
  const socket = _socket;

  socket.on('start', (data) => {
  const sessions = game.sessions();
  if (sessions[data.roomname]) {
    sessions[data.roomname].active = true;
  }

  broadcaster.roomEmit(data.roomname, 'turnCount', {
    turnNum: sessions[data.roomname].turnNum,
  });
  // io.sockets.in(data.roomname).emit('turnCount',
  //   { turnNum: game.sessions[data.roomname].turnNum }
  // );
  });
};

const onAction = (_socket) => {
  const socket = _socket;

  socket.on('action', (data) => {
  const sessions = game.sessions();
  const room = data.roomname;
  const actingUser = data.name;
  const targetedUser = data.target;
  const action = data.action;

  let validAction = true;
  // First perform validity checks on all the passed params & check if user lost
  const currRoom = sessions[room];
  const user = currRoom.users[actingUser];

  if (user.hasGone || user.lost) {
    validAction = false;
  } else {

    switch(action) {
      case 'condemn':
      case 'confess':
      case 'absolve':
        if (user.innocence <= 0) {
        validAction = false;
        }
        break;
      case 'backstab':
        if (user.status <= 0) {
        validAction = false;
        }
        break;
      default:
      break;
    }

    // Next, add action to queue if user hasn't gone yet
    if (validAction) {
      user.hasGone = true;
      user.action = {
      actionName: action,
      target: targetedUser,
      };
      currRoom.users[targetedUser].effects.push(action);
    }
  }

  // Tell the user if their action was successfully received
  broadcaster.socketEmit(socket.id, 'confirm', { confirm: validAction });
  // socket.emit('confirm', { confirm: user.hasGone });

  // If that was the last user to go, resolve the turn
  if (user.hasGone) {
    game.processAction(currRoom);
  }
  });
};

const onGetStats = (_socket) => {
  const socket = _socket;

  socket.on('getStats', (data) => {
  const sessions = game.sessions();
  const room = sessions[data.roomname];
  const user = room.users[data.name];

  broadcaster.socketEmit(socket.id, 'stats', {
    acquittal: room.acquittal,
    innocence: user.innocence,
    status: user.status,
    guilt: user.guilt,
  });
  /* socket.emit('stats', {
    acquittal: room.acquittal,
    innocence: user.innocence,
    status: user.status,
    guilt: user.guilt
  });*/
  });
};

const onList = (_socket) => {
  const socket = _socket;

  socket.on('listUsers', (data) => {
  const sessions = game.sessions();
  const room = sessions[data.roomname];
  const usersInGame = Object.keys(room.users);

  // Remove requesting usser from list
  const index = usersInGame.indexOf(data.name);
  if (index > -1) {
    usersInGame.splice(index, 1);
  }

  broadcaster.socketEmit(socket.id, 'playerList', { list: usersInGame });
  // socket.emit('playerList', { list: usersInGame });
  });
};

const init = (server) => {
  const io = _io.init(server);

  io.on('connection', (_socket) => {
  onJoin(_socket);
  onStart(_socket);
  onAction(_socket);
  onGetStats(_socket);
  onList(_socket);
  });
};


module.exports.init = init;
