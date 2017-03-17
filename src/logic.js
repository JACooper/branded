const broadcaster = require('./broadcaster.js');

const isTurnDone = (room) => {
  // returns false if any users have not yet gone
  const remainingUsers = Object.keys(room.users).filter((userid) => {
    const user = room.users[userid];
    return !(user.hasGone || user.lost);
  });

  const turnDone = !(remainingUsers.length > 0);
  return turnDone;
};

const processUser = (_user, _room) => {
  const user = _user;
  const room = _room;

  // Process user's own action
  switch (user.action.actionName) {
    case 'slander':
      user.guilt += 1;
      break;
    case 'indict':
      user.guilt += 1;
      break;
    case 'vindicate':
      user.innocence += 1;
      break;
    case 'condemn':
      user.innocence -= 1;
      break;
    case 'confess':
      user.innocence -= 1;
      break;
    case 'backstab':
      user.status -= 1;
      user.persuasion -= 1;
      room.notifications.push('Someone has backstabbed the group.');
    case 'absolve':
      user.innocence -= 1;
      room.acquittal -= 1;
      room.notifications.push('Someone has absolved the group.');
      break;
    default:
      break;
  }

  // Process actions that targeted user
  for (let i = 0; i < user.effects.length; i++) {
    switch (user.effects[i]) {
      case 'slander':
        user.status -= 1;
        room.notifications.push(`${user.name} has been slandered.`);
        break;
      case 'indict':
        user.innocence -= 1;
        room.notifications.push(`${user.name} has been indicted.`);
        break;
      case 'vindicate':
        user.guilt -= 1;
        room.notifications.push(`${user.name} has been vindicated.`);
        break;
      case 'condemn':
        user.guilt += 1;
        room.notifications.push(`${user.name} has been condemned.`);
        break;
      case 'confess':
        user.status += 1;
        room.notifications.push('Someone has confessed.');
        break;
      default:
        break;
    }
  }
  user.effects = [];   // Empty out array to prepare for next turn

  if (user.guilt >= room.lossThreshold && user.lost === false) {
    user.lost = true;
    room.notifications.push(`${user.name} has been branded guilty!`);
  }
};

// Note that this will also need to change the way "_traitors" works, since not all traitors win
const processEndGame = (_room, _comrades, _traitors, _winner) => {
  // List all winners/losers & their roles, etc.
  console.dir(_winner);  // Deal with this later
  const players = [];

  // WILL NOT WORK B/c users indexed on name, not an array
  for (let i = 0; i < _room.users.length; i++) {
    players[i] = {
      role: _room.users[i].role,
      name: _room.users[i].name,
    };
  }

  broadcaster.roomEmit(_room.roomname, 'results', { players });
  // io.sockets.in(room.roomname).emit('results', { players });
};

const processTurn = (_room) => {
  const room = _room;

  // Insert random server action

  // Process (and randomize order of) all actions
  const users = Object.keys(room.users).map(userid => room.users[userid]);

  users.forEach(user => processUser(user, room));

  room.notifications.forEach((notification) => {
    broadcaster.roomEmit(room.roomname, 'notification', { msg: notification });
    // io.sockets.in(room.roomname).emit('notification', { msg: notification });
  });

  // Check if all players lost, and send loss messages as appropriate regardless
  // NOTE: Not currently sending individual loss messages
  // const clients = io.sockets;
  const allGuilty = users.every(user => user.lost);

  const comrades = users.filter(user => (user.role.toLowerCase() === 'comrade' && !user.lost));
  const groupWin = room.acquittal <= 0;

  const traitors = users.filter(user => (user.role.toLowerCase() === 'traitor' && !user.lost));
  const individualWin = !(traitors.every(user => (user.persuasion > 0)));

  if (allGuilty) {
    // users.forEach((_user) => {
    //   const user = room.users[_user.name];
    //   clients[user.socketid].emit('loss', { });
    // });

    processEndGame(room, comrades, traitors, 'none');
  } else if (groupWin) {
    // if (comrades.length > 0) {
    //   comrades.forEach((_user) => {
    //     const user = room.users[_user.name];
    //     clients[user.socketid].emit('win', { });
    //   });
    // }

    // if (traitors.length > 0) {
    //   traitors.forEach((_user) => {
    //     const user = room.users[_user.name];
    //     clients[user.socketid].emit('loss', { });
    //   });
    // }

    processEndGame(room, comrades, traitors, 'comrades');
  } else if (individualWin) {
    // if (traitors.length > 0) {
    //   traitors.forEach((_user) => {
    //     const user = room.users[_user.name];
    //     clients[user.socketid].emit('win', { });
    //   });
    // }

    // if (comrades.length > 0) {
    //   comrades.forEach((_user) => {
    //     const user = room.users[_user.name];
    //     clients[user.socketid].emit('loss', { });
    //   });
    // }

    processEndGame(room, comrades, traitors, 'traitors');
  } else {
    room.turnNum += 1;
    users.forEach((_user) => {
      const user = _user;
      user.hasGone = false; // Reset turn track
    });

    broadcaster.roomEmit(room.roomname, 'turnCount', { turnNum: room.turnNum });
    // io.sockets.in(room.roomname).emit('turnCount', { turnNum: room.turnNum });
  }
};

module.exports.isTurnDone = isTurnDone;
module.exports.processTurn = processTurn;
