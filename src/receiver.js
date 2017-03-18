const _io = require('./io.js');
const broadcaster = require('./broadcaster.js');
const game = require('./state.js');

const onCreateRoom = (_socket) => {
  const socket = _socket;

  socket.on('create-room', (data) => {
    const sessions = game.sessions();

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

    // While we're here, check if there are any rooms that needs to be cleaned up
    const roomids = Object.keys(sessions);
    const rooms = roomids.map((id) => sessions[id]);

    // NOTE: This might cause issues. . .
    rooms.forEach((_room) => {
      if (_room.gameOver) {
        delete sessions[_room.roomname];
      }
    });
  });
};

const onJoin = (_socket) => {
  const socket = _socket;

  socket.on('join', (data) => {
    const sessions = game.sessions();
    const roles = game.roles();

    // Initialize session if necessary
    if (sessions[data.roomname]) {
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

      broadcaster.socketEmit(socket.id, 'notification', {
        msg: `You are a ${sessions[data.roomname].users[data.name].role}.`,
      });
    } else {
      broadcaster.socketEmit(socket.id, 'notification', {
        msg: `Could not find requested room!`,
      });
    }
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
      switch (action) {
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

        // Double check to make sure user still exists
        if (currRoom.users[targetedUser]) {
          currRoom.users[targetedUser].effects.push(action);
        }
      }
    }

    // Tell the user if their action was successfully received
    broadcaster.socketEmit(socket.id, 'confirm', { confirm: validAction });

    // If that was the last user to go, resolve the turn
    if (user.hasGone) {
      game.processAction(currRoom);
    }
  });
};

const onGetStats = (_socket) => {
  const socket = _socket;

  socket.on('get-stats', (data) => {
    const sessions = game.sessions();
    const room = sessions[data.roomname];
    const user = room.users[data.name];

    broadcaster.socketEmit(socket.id, 'stats', {
      acquittal: room.acquittal,
      innocence: user.innocence,
      status: user.status,
      guilt: user.guilt,
    });
  });
};

const onList = (_socket) => {
  const socket = _socket;

  socket.on('list-users', (data) => {
    const sessions = game.sessions();
    const room = sessions[data.roomname];
    const usersInGame = Object.keys(room.users);

    // Remove requesting usser from list
    const index = usersInGame.indexOf(data.name);
    if (index > -1) {
      usersInGame.splice(index, 1);
    }

    broadcaster.socketEmit(socket.id, 'player-list', { list: usersInGame });
  });
};

const leaveGame = (_roomname, _name) => {
  // delete room.users[_name];
  game.removeUser(_roomname, _name);

  broadcaster.roomEmit(_roomname, 'user-left', { name: _name });
};

const leaveRoom = (_socket, _roomname) => {
  _socket.leave(_roomname);
};

const onLeave = (_socket) => {
  const socket = _socket;

  socket.on('leave', (data) => {
    leaveGame(data.roomname, data.name);
    leaveRoom(socket, data.roomname);
    broadcaster.socketEmit(socket.id, 'player-list', { list: usersInGame });
  });
};

const onDisconnect = (_socket) => {
  const socket = _socket;

  socket.on('disconnect', () => {
    // Need to find "data", since clients don't nicely provide info when disconnecting
    const sessions = game.sessions();

    // First, find user in question - this is a little nasty
    let user = null;
    let roomname;
    const rooms = Object.keys(sessions);
    let i = 0;
    while (i < rooms.length && user === null) {
      roomname = rooms[i];
      const roomUsers = sessions[rooms[i]].users;
      const uids = Object.keys(roomUsers);
      for (let j = 0; j < uids.length; j++) {
        // If socket ids match
        if (roomUsers[uids[j]].socketid === socket.id) {
          user = roomUsers[uids[j]];
          break;
        }
      }
      i++;
    }

    if (user !== null) {
      leaveGame(roomname, user.name);
      leaveRoom(socket, roomname);
      broadcaster.socketEmit(socket.id, 'player-list', { list: usersInGame });
    }

    // Kill connection
    socket.disconnect();
  });
};

const init = (server) => {
  const io = _io.init(server);

  io.on('connection', (_socket) => {
    onCreateRoom(_socket);
    onJoin(_socket);
    onLeave(_socket);
    onDisconnect(_socket);
    onStart(_socket);
    onAction(_socket);
    onGetStats(_socket);
    onList(_socket);
  });
};


module.exports.init = init;
