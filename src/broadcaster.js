const _io = require('./io.js');

const roomEmit = (roomname, emitname, dataobj) => {
  const io = _io.io();
  io.sockets.in(roomname).emit(emitname, dataobj);
};

const socketEmit = (socketid, emitname, dataobj) => {
  const sockets = _io.sockets();
  sockets[socketid].emit(emitname, dataobj);
};

module.exports.roomEmit = roomEmit;
module.exports.socketEmit = socketEmit;
