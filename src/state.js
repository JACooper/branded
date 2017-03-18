const logic = require('./logic.js');

//  --  Game Logic

/*
User object: {
  name: String  (what the object is keyed to)
  socketID: String  (id of the socket the user is connected with)
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


/*
Session object: {
  roomname: String (the roomname, as referred to in socket io, of this session)
  acquittal: int (the remaining amount of innocence all players need to win)
  users: Array of type user (see above) (the users in the session)
  active: bool (if the game has started)
  gameOver: bool (if an active game has finished) -- May be removed later
  turnNum: int (how many turns have passed)
  lossThreshold: int (how much guilt users need to lose)  -- May be removed
  notifications: Array of String (game state updates)
}
*/

const sessions = { };
const roles = ['comrade', 'traitor'];

const getSessions = () => sessions;

const getRoles = () => roles;

const processAction = (_room) => {
  if (logic.isTurnDone(_room)) {
    logic.processTurn(_room);
  }
};

const removeUser = (_roomname, _name) => {
  const room = sessions[_roomname];
  delete room.users[_name];

  logic.handleUserRemoved(room);
};

module.exports.sessions = getSessions;
module.exports.roles = getRoles;
module.exports.processAction = processAction;
module.exports.removeUser = removeUser;
