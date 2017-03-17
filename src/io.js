const Socketio = require('socket.io');

let io;

const init = (server) => {
  io = new Socketio(server);
  return io;
};

const getIO = () => io;

const getSockets = () => io.sockets.sockets;

module.exports.init = init;
module.exports.io = getIO;
module.exports.sockets = getSockets;
