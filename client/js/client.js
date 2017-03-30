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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

var startHandler = void 0;
var actionHandler = void 0;
var listUsersHandler = void 0;

var user = void 0,
    room = void 0; // Ugly, but


//  --  --  --  Misc methods  --  --  --

var displayRoomInfo = function displayRoomInfo(e) {
  var joinGameDialogue = document.querySelector('#joinGameWrapper');
  joinGameDialogue.style.display = "block";

  var joinRoomname = document.querySelector('#room');
  joinRoomname.value = e.target.innerHTML;

  document.querySelector('#user').focus();
};

//  --  --  --  onReceive methods --  --  --

var onRoomCreated = function onRoomCreated(data) {
  var createRoomDialogue = document.querySelector('#createRoomWrapper');
  createRoomDialogue.style.display = "none";
  document.querySelector('#roomname').value = '';
};

var onJoined = function onJoined(socket, data) {
  var joinDialogue = document.querySelector('#joinGameWrapper');
  joinDialogue.style.display = "none";
  if (data.joined) {
    document.querySelector('#btnAction').disabled = false;
    socket.emit('list-users', { name: user, roomname: room });
  } else {
    var _log = document.querySelector('#log');
    _log.innerHTML += "Could not join room.\n";
  }
};

var onConfirm = function onConfirm(data) {
  // console.log('Server says action confirmed: ' + data.confirm);
  // Disable turn controls
  if (data.confirm) {
    document.querySelector('#btnAction').disabled = true;
  } else {
    var _log2 = document.querySelector('#log');
    _log2.innerHTML += "Invalid action!\n";
  }
};

var onTurnCount = function onTurnCount(socket, data) {
  // Allow new action
  document.querySelector('#btnAction').disabled = false;
  document.querySelector('#btnStart').disabled = true;

  log.innerHTML += 'It is now turn ' + data.turnNum + '\n';
  socket.emit('list-users', { name: user, roomname: room });
};

var onStats = function onStats(data) {
  // Display current acquittal count & user info
  var guilt = document.querySelector('#guilt');
  var innocence = document.querySelector('#innocence');
  var status = document.querySelector('#status');
  var acquittal = document.querySelector('#acquittal');
  var persuation = document.querySelector('#persuasion');

  guilt.value = data.guilt + '/' + data.maxGuilt;
  innocence.value = '' + data.innocence;
  status.value = '' + data.status;
  acquittal.value = '' + data.acquittal;
  persuasion.value = '' + data.persuasion;
};

var onRoomList = function onRoomList(data) {
  // List current game rooms
  var roomList = document.querySelector('#roomList');

  while (roomList.firstChild) {
    roomList.removeChild(roomList.firstChild);
  }

  data.rooms.forEach(function (_room) {
    var listItem = document.createElement('li');
    var anchor = document.createElement('a');
    anchor.addEventListener('click', displayRoomInfo);
    anchor.innerHTML = _room.roomname;
    anchor.className = 'roomAnchor';
    listItem.className = 'roomListItem';
    listItem.appendChild(anchor);
    roomList.appendChild(listItem);
  });
};

var onPlayerList = function onPlayerList(data) {
  // List current game players

  // Probably a more efficient way of doing this. . .
  var target = document.querySelector('#target');
  for (var i = target.length - 1; i >= 0; i--) {
    target.remove(i); // Remove old user list
  }

  for (var j = 0; j < data.list.length; j++) {
    var opt = document.createElement("option");
    opt.text = data.list[j];
    target.add(opt);
  }
};

var onResults = function onResults(data) {
  var users = data.users;
  users.forEach(function (_user) {
    var state = "won";
    if (_user.lost) {
      state = "lost";
    }

    log.innerHTML += _user.name + ', who was a ' + _user.role + ', ' + state;
  });
};

//  --  --  --  Send methods  --  --  --

var createRoom = function createRoom(socket) {
  var newRoom = document.querySelector('#roomname').value;

  document.querySelector('#btnCreate').disabled = true;
  socket.emit('create-room', { roomname: newRoom });
};

var joinRoom = function joinRoom(e, socket) {
  var roomname = document.querySelector('#room').value;
  var username = document.querySelector('#user').value;

  if (roomname !== '' && username !== '') {
    room = roomname;
    user = username;

    socket.emit('join', { roomname: room, name: user });
  }

  e.preventDefault();
  e.stopPropagation();

  return false;
};

var startGame = function startGame(e, socket) {
  document.querySelector('#btnAction').disabled = false;
  socket.emit('start', { roomname: room });
  socket.emit('list-users', { name: user, roomname: room });
};

var sendAction = function sendAction(e, socket, action) {
  var target = document.querySelector('#target').value;
  if (action.value === 'confess' || action.value === 'absolve') {
    // Make sure that for certain actions user can only target themselves
    target = user;
  }
  socket.emit('action', { name: user, roomname: room, target: target, action: action.value });
};

var listUsers = function listUsers(socket) {
  socket.emit('list-users', { name: user, roomname: room });
};

var connectSocket = function connectSocket(e) {
  var socket = io.connect();

  var log = document.querySelector('#log');
  var action = document.querySelector('#action');

  log.innerHTML = '';

  socket.on('connect', function () {
    // socket.emit('join', { name: user, roomname: room });
  });

  socket.on('branded', function () {
    // Display loss message
    log.innerHTML += "You have been branded guilty! Your actions will be ignored by the game from here on.\n";
  });

  socket.on('notification', function (data) {
    // Display notifications from server
    log.innerHTML += data.msg + '\n';
  });

  socket.on('room-created', onRoomCreated);
  socket.on('joined', function (data) {
    onJoined(socket, data);
  });
  socket.on('confirm', onConfirm);
  socket.on('turn-count', function (data) {
    onTurnCount(socket, data);
  });
  socket.on('stats', onStats);
  socket.on('room-list', onRoomList);
  socket.on('player-list', onPlayerList);
  socket.on('results', onResults);

  startHandler = function startHandler(e) {
    return startGame(e, socket);
  };
  var start = document.querySelector('#btnStart');
  start.addEventListener('click', startHandler);
  start.disabled = false;

  joinHandler = function joinHandler(e) {
    return joinRoom(e, socket);
  };
  var join = document.querySelector('#btnJoin');
  join.addEventListener('click', joinHandler);

  actionHandler = function actionHandler(e) {
    return sendAction(e, socket, action);
  };
  document.querySelector('#btnAction').addEventListener('click', actionHandler);

  listUsersHandler = function listUsersHandler(e) {
    return listUsers(e, socket);
  };

  document.querySelector('#btnCreate').addEventListener('click', function (e) {
    createRoom(socket);
  });
};

module.exports.connectSocket = connectSocket;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var socketHandler = __webpack_require__(0);

var toggleTarget = function toggleTarget(e) {
  var action = document.querySelector('#action');
  var target = document.querySelector('#target');
  if (action.value === 'absolve' || action.value === 'confess') {
    target.disabled = true;
  } else {
    target.disabled = false;
  }
};

var allowCreation = function allowCreation(e) {
  var roomname = document.querySelector('#roomname').value;
  var buttonCreate = document.querySelector('#btnCreate');

  if (roomname !== '') {
    buttonCreate.disabled = false;
  } else {
    buttonCreate.disabled = true;
  }
};

var allowJoin = function allowJoin(e) {
  var username = document.querySelector('#user').value;
  var buttonJoin = document.querySelector('#btnJoin');

  if (username !== '') {
    buttonJoin.disabled = false;
  } else {
    buttonJoin.disabled = true;
  }
};

var showCreateScreen = function showCreateScreen(e) {
  var createRoomDialogue = document.querySelector('#createRoomWrapper');
  createRoomDialogue.style.display = "block";

  document.querySelector('#roomname').focus();
};

var showRules = function showRules(e) {
  var rulesDiv = document.querySelector('#rulesWrapper');
  rulesDiv.style.display = "block";
};

var closeRules = function closeRules(e) {
  var rulesDiv = document.querySelector('#rulesWrapper');
  rulesDiv.style.display = "none";
};

var init = function init() {
  socketHandler.connectSocket();

  var createRoomName = document.querySelector('#roomname');
  createRoomName.addEventListener('change', allowCreation);

  var joinUserName = document.querySelector('#user');
  joinUserName.addEventListener('change', allowJoin);

  var createRoom = document.querySelector('#btnNewRoom');
  createRoom.addEventListener('click', showCreateScreen);

  var action = document.querySelector('#action');
  action.addEventListener('change', toggleTarget);

  var rules = document.querySelector('#btnRules');
  rules.addEventListener('click', showRules);

  var closeRulesBtn = document.querySelector('#btnCloseRules');
  closeRulesBtn.addEventListener('click', closeRules);
};

window.onload = init;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(3);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(5)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./branded.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./branded.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(4)();
// imports


// module
exports.push([module.i, "body {\r\n    background-color: #262626;\r\n    color: #DCDCDC;\r\n    /*font-family: 'Montserrat', sans-serif;*/\r\n}\r\n\r\nbutton, input, select {\r\n    /*font-family: 'Montserrat', sans-serif;*/\r\n}\r\n\r\n@keyframes fadeIn {\r\n    from {\r\n        opacity: 0;\r\n    }\r\n    to {\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n@keyframes fadeInSlide {\r\n    from {\r\n        top: 9999px;\r\n        opacity: 0;\r\n    }\r\n    to {\r\n        top: 0px;\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n#joinGame, #createRoom {\r\n    background-color: #262626;\r\n    width: 100%;\r\n    height: 100%;\r\n    text-align: center;\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n}\r\n\r\n#joinGame input[type=\"text\"], #createRoom input[type=\"text\"] {\r\n    opacity: 0;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DCDCDC;\r\n    display: block;\r\n    height: 80px;\r\n    width: 500px;\r\n    font-size: 20pt;\r\n    text-indent: 15px;\r\n    vertical-align: center;\r\n    margin: auto;\r\n    margin-top: 50px;\r\n    border: 1px solid transparent;\r\n    border-radius: 4px;\r\n    animation-duration: 1s;\r\n    animation-fill-mode: forwards;\r\n    animation-name: fadeIn;\r\n}\r\n\r\n#joinGame input[type=\"text\"]:focus, #createRoom input[type=\"text\"]:focus {\r\n    border: 1px solid skyblue;\r\n}\r\n\r\n#joinGame input[type=\"submit\"], #createRoom input[type=\"submit\"] {\r\n    opacity: 0;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    height: 80px;\r\n    width: 340px;\r\n    font-size: 20pt;\r\n    margin: auto;\r\n    margin-top: 70px;\r\n    border-radius: 4px;\r\n    animation-duration: 1s;\r\n    animation-fill-mode: forwards;\r\n    animation-delay: 0s;\r\n    animation-name: fadeIn;\r\n}\r\n\r\n#joinGame input[type=\"submit\"]:hover, #createRoom input[type=\"submit\"]:hover {\r\n    background-color: #686868;\r\n    color: #DEDEDE;\r\n    cursor: pointer;\r\n}\r\n\r\n#joinGameWrapper, #createRoomWrapper {\r\n    width: 100%;\r\n    height: 100%;\r\n    overflow: hidden;\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    display: none;\r\n    z-index: 1;\r\n}\r\n\r\n#gameWrapper {\r\n    overflow: auto;\r\n    z-index: 0;\r\n    margin-left: auto;\r\n    margin-right: auto;\r\n    width: 90%;\r\n}\r\n\r\n#roomControls {\r\n    float: left;\r\n    width: 25%;\r\n    height: 700px;\r\n    border-top-left-radius: 2px;\r\n    border-bottom-left-radius: 2px;\r\n    background-color: #353535;\r\n    padding-top: 10px;\r\n}\r\n\r\nspan {\r\n    margin: 10px;\r\n}\r\n\r\n#roomList {\r\n    height: 500px;\r\n    margin: 10px 10px 10px 10px;\r\n    list-style-type: none;\r\n    padding-left:0;\r\n}\r\n\r\n.roomAnchor {\r\n    width: 100%;\r\n    cursor: pointer;\r\n    margin: 3px;\r\n    display: inline-block;\r\n}\r\n\r\n.roomListItem {\r\n    opacity: 0;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    width: 90%;\r\n    border-radius: 1px;\r\n    animation-duration: 1s;\r\n    animation-fill-mode: forwards;\r\n    animation-delay: 0s;\r\n    animation-name: fadeIn;\r\n    text-align: center;\r\n    margin: auto;\r\n    margin-top: 10px;\r\n}\r\n\r\n.roomListItem:hover {\r\n    border: 0px solid #585858;\r\n    background-color: #585858;\r\n}\r\n\r\n#btnNewRoom {\r\n    display: block;\r\n    margin: 10px;\r\n    margin-left: auto;\r\n    margin-right: auto;\r\n    width: 90%;\r\n    height: 30px;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n}\r\n\r\n#btnNewRoom:hover {\r\n    border: 0px solid #585858;\r\n    background-color: #585858;\r\n    cursor: pointer;\r\n}\r\n\r\n#gameControls {\r\n    float: left;\r\n    margin-left: 20px;\r\n    width: 70%;\r\n    height: 700px;\r\n    padding-top: 10px;\r\n    border-top-right-radius: 2px;\r\n    border-bottom-right-radius: 2px;\r\n    background-color: #353535;\r\n}\r\n\r\n#btnStart {\r\n    margin: 10px;\r\n    width: 170px;\r\n    height: 30px;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    cursor: pointer;\r\n}\r\n\r\n#btnStart:hover:enabled {\r\n    border: 0px solid #585858;\r\n    background-color: #585858;\r\n}\r\n\r\n#statDisplay, #actionControls, #log {\r\n    margin-left: 10px;\r\n}\r\n\r\n#statDisplay {\r\n    margin-top: 10px;\r\n}\r\n\r\n.statbox {\r\n    width: 30px;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    text-align: center;\r\n}\r\n\r\n#btnAction {\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    height: 27px;\r\n}\r\n\r\n#btnAction:hover:enabled {\r\n    border: 0px solid #585858;\r\n    background-color: #585858;\r\n}\r\n\r\n#log {\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n}\r\n\r\n#rulesWrapper {\r\n    display: none;\r\n    width: 100%;\r\n    height: 100%;\r\n    top: 0;\r\n    left: 0;\r\n    position: absolute;\r\n    background-color: #353535;\r\n}\r\n\r\n#btnCloseRules {\r\n    top: 0;\r\n    right: 0;\r\n    background-color: #484848;\r\n    position: absolute;\r\n    cursor: pointer;\r\n}\r\n\r\n#btnRules {\r\n    margin: 10px;\r\n    width: 170px;\r\n    height: 30px;\r\n    border: 0px solid #484848;\r\n    background-color: #484848;\r\n    color: #DDDDDD;\r\n    cursor: pointer;\r\n}\r\n\r\n#btnRules:hover:enabled {\r\n    border: 0px solid #585858;\r\n    background-color: #585858;\r\n}", ""]);

// exports


/***/ }),
/* 4 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		return /msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase());
	}),
	getHeadElement = memoize(function () {
		return document.head || document.getElementsByTagName("head")[0];
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [];

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the bottom of <head>.
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
}

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var head = getHeadElement();
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			head.insertBefore(styleElement, head.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			head.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		head.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	styleElement.type = "text/css";
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	insertStyleElement(options, linkElement);
	return linkElement;
}

function addStyle(obj, options) {
	var styleElement, update, remove;

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);
__webpack_require__(1);
__webpack_require__(2);

/***/ })
/******/ ]);