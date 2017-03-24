const _io = require('./io.js');

const roomEmit = (roomname, emitname, dataobj) => {
  const io = _io.io();
  io.sockets.in(roomname).emit(emitname, dataobj);
};

const socketEmit = (socketid, emitname, dataobj) => {
  const sockets = _io.sockets();
  if (Object.keys(sockets).length > 0) {
    sockets[socketid].emit(emitname, dataobj);
  }
};

const ioEmit = (emitname, dataobj) => {
  const sockets = _io.sockets();
  const socketids = Object.keys(sockets);
  socketids.forEach((socketid) => {
    sockets[socketid].emit(emitname, dataobj);
  });
};

module.exports.roomEmit = roomEmit;
module.exports.socketEmit = socketEmit;
module.exports.ioEmit = ioEmit;
