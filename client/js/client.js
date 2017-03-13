/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// const io = require('socket.io-client');

var startHandler = void 0;
var actionHandler = void 0;
var listUsersHandler = void 0;

var startRoom = function startRoom(e, socket, user, room) {
  document.querySelector('#btnAction').disabled = false;
  socket.emit('start', { roomname: room });
};

var sendAction = function sendAction(e, socket, user, room, action) {
  var target = document.querySelector('#target').value;
  if (action.value === 'confess' || action.value === 'absolve') {
    // Make sure that for certain actions user can only target themselves
    target = user;
  }
  socket.emit('action', { name: user, roomname: room, target: target, action: action.value });
};

var listUsers = function listUsers(e, socket, user, room) {
  socket.emit('listUsers', { name: user, roomname: room });
};

var connectSocket = function connectSocket(e) {
  var socket = io.connect();

  var user = document.querySelector('#user').value;
  var room = document.querySelector('#room').value;

  var log = document.querySelector('#log');
  var action = document.querySelector('#action');

  log.innerHTML = '';

  socket.on('connect', function () {
    socket.emit('join', { name: user, roomname: room });
  });

  socket.on('win', function () {
    // Display win message
    log.innerHTML += "You have won!\n";
  });

  socket.on('loss', function () {
    // Display loss message
    log.innerHTML += "You have been branded guilty!\n";
  });

  socket.on('notification', function (data) {
    // Display notifications from server
    log.innerHTML += data.msg + '\n';
  });

  socket.on('confirm', function (data) {
    console.log('Server says action confirmed: ' + data.confirm);
    // Disable turn controls
    if (data.confirm) {
      action.disabled = true;
    }
  });

  socket.on('turnCount', function (data) {
    // Allow new action
    log.innerHTML += 'It is now turn ' + data.turnNum + '\n';
    action.disabled = false;
  });

  socket.on('acquittalCount', function (data) {
    // Display current acquittal count
  });

  socket.on('persuasionCount', function (data) {});

  socket.on('playerList', function () {
    // List current game players
  });

  socket.on('gameStarted', function () {
    // Enable turn controls
  });

  startHandler = function startHandler() {
    return startRoom(e, socket, user, room);
  };
  document.querySelector('#btnStart').addEventListener('click', startHandler);

  actionHandler = function actionHandler() {
    return sendAction(e, socket, user, room, action);
  };
  document.querySelector('#btnAction').addEventListener('click', actionHandler);

  listUsersHandler = function listUsersHandler() {
    return listUsers(e, socket, user, room);
  };
};

module.exports.connectSocket = connectSocket;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var socketHandler = __webpack_require__(0);

var init = function init() {
	var connect = document.querySelector('#btnConnect');
	connect.addEventListener('click', socketHandler.connectSocket);
};

window.onload = init;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);
__webpack_require__(1);

/***/ })
/******/ ]);