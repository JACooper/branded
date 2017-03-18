const broadcaster = require('./broadcaster.js');

const serverActions = ['slander', 'indict', 'vindicate', 'condemn', 'confess'];

const isTurnDone = (room) => {
  // returns false if any users have not yet gone
  const remainingUsers = Object.keys(room.users).filter((userid) => {
    const user = room.users[userid];
    return !(user.hasGone || user.lost);
  });

  const turnDone = !(remainingUsers.length > 0);
  return turnDone;
};

const addServerAction = (_users) => {
  const users = _users;

  const randomUser = users[Math.floor(Math.random() * users.length)];
  randomUser.effects.push(serverActions[Math.floor(Math.random() * serverActions.length)]);
};

/**
 * [description]
 * @param  {Session} _room [description]
 * @param  {User} _user [description]
 */
const processUser = (_room, _user) => {
  const room = _room;
  const user = _user;

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
      break;
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
    room.notifications.push(`${user.name} has been branded guilty! Their pleas for mercy go unheeded.`);
  }
};

/**
 * Processes end of game for a session
 * @param  {Session} _room  The session object (_room.active should be false)
 * @param  {User[]} _users A User object array of the rooms users
 */
const processEndGame = (_room, _users) => {
  // List all winners/losers & their roles, etc.
  const room = _room;
  const users = _users;

  const cleanUsers = users.map(_user => ({
    lost: _user.lost,
    name: _user.name,
    role: _user.role,
  }));

  room.gameOver = true;
  broadcaster.roomEmit(room.roomname, 'results', { users: cleanUsers });
};

const processTurn = (_room) => {
  const room = _room;

  const users = Object.keys(room.users).map(userid => room.users[userid]);

  // Insert random server action
  addServerAction(users);

  users.forEach(user => processUser(user, room));

  room.notifications.forEach((notification) => {
    broadcaster.roomEmit(room.roomname, 'notification', { msg: notification });
  });

  // Check if all players lost, and send loss messages as appropriate regardless
  const branded = users.filter(user => user.lost);

  const comrades = users.filter(user => (user.role.toLowerCase() === 'comrade' && !user.lost));
  const traitors = users.filter(user => (user.role.toLowerCase() === 'traitor' && !user.lost));

  const groupWin = room.acquittal <= 0;
  const losingTraitors = traitors.filter(user => (user.persuasion > 0));

  if (branded.length >= users.length) {
    room.active = false;
    processEndGame(room, users);
  } else if (groupWin) {
    if (comrades.length > 0) {
      comrades.forEach((_user) => {
        const user = _user;
        user.lost = false;
      });
    }

    if (traitors.length > 0) {
      traitors.forEach((_user) => {
        const user = _user;
        user.lost = true;
      });
    }

    room.active = false;
    processEndGame(room, users);
  } else if (losingTraitors.length < traitors.length) {
    if (comrades.length > 0) {
      comrades.forEach((_user) => {
        const user = _user;
        user.lost = true;
      });
    }

    if (losingTraitors.length > 0) {
      losingTraitors.forEach((_user) => {
        const user = _user;
        user.lost = true;
      });
    }

    room.active = false;
    processEndGame(room, users);
  } else {
    room.turnNum += 1;
    users.forEach((_user) => {
      const user = _user;
      user.hasGone = false; // Reset turn track
    });

    branded.forEach((_user) => {
      const user = _user;
      broadcaster.socketEmit(user.socketid, 'branded', { });
    });

    broadcaster.roomEmit(room.roomname, 'turnCount', { turnNum: room.turnNum });
  }
};

/**
 * Makes sure the game is in a valid state after user disconnect
 * @param  {Session} _room The session object to be checked
 */
const handleUserRemoval = (_room) => {
  const room = _room;

  // Get active users in room
  const uids = Object.keys(room.users);
  const users = uids.map(userid => room.users[userid]);
  const activeUsers = users.filter(user => (!user.lost));

  // If only one player is left
  if (users.length <= 1 || activeUsers.length <= 1) {
    processEndGame(room, users);
  }
};

module.exports.isTurnDone = isTurnDone;
module.exports.processTurn = processTurn;
module.exports.handleUserRemoval = handleUserRemoval;
