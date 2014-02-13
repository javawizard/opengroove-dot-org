
//function Coordinates(x, y, z, a) {
//	this._x = x;
//	this._y = y;
//	this._z = z;
//	this._a = a;
//	this.onUpdate = [];
//}
//Coordinates.prototype = {
//	get x() {
//		return this._x;
//	}
//	get y() {
//		return this._y;
//	}
//	get z() {
//		return this._z;
//	}
//	get a() {
//		return this._a;
//	}
//	function update(x, y, z, a) {
//		this._x = x;
//		this._y = y;
//		this._z = z;
//		this._a = a;
//	}
//}

function Event() {
	this._listeners = {};
}

Event.prototype = {
	listen: function(listenerFunction) {
		listener = new Listener(listenerFunction, this);
		this._listeners[listener.objectId] = listener;
		return listener;
	},
	fire: function() {
		for (id in this._listeners) {
			this._listeners[id]._listenerFunction.apply(null, arguments);
		}
	}
}

function Listener(listenerFunction, event, id) {
	this._listenerFunction = listenerFunction;
	this._event = event;
	this.objectId = (Listener._nextId++).toString();
}

Listener._nextId = 1;
Listener.prototype = {
	remove: function() {
		delete this._event._listeners[this.objectId];
	},
	reinstate: function() {
		this._event._listeners[this.objectId] = this;
	} 
}

function Player(name) {
	this.objectId = (Player._nextId++).toString();
	this.name = name;
	this._realX = 0;
	this._realY = 0;
	this._realZ = 0;
	this._realA = 0;
	this._knownTime = window.performance.now();
	this._knownX = 0;
	this._knownY = 0;
	this._knownZ = 0;
	this._knownA = 0;
	this._knownVelocityX = 0;
	this._knownVelocityY = 0;
	this._knownVelocityZ = 0;
	this._knownVelocityA = 0;
	this.onRealUpdated = new Event();
	this.onKnownUpdated = new Event();
}

Player._nextId = 1;
Player.prototype = {
	get realX() {
		return self._realX;
	}
	get realY() {
		return self._realY;
	}
	get realZ() {
		return self._realZ;
	}
	get realA() {
		return self._realA;
	}
	get knownTime() {
		return self._knownTime;
	}
	get knownX() {
		return self._knownX;
	}
	get knownY() {
		return self._knownY;
	}
	get knownZ() {
		return self._knownZ;
	}
	get knownA() {
		return self._knownA;
	}
	get knownVelocityX() {
		return self._knownVelocityX;
	}
	get knownVelocityY() {
		return self._knownVelocityY;
	}
	get knownVelocityZ() {
		return self._knownVelocityZ;
	}
	get knownVelocityA() {
		return self._knownVelocityA;
	}
	function updateReal(x, y, z, a) {
		oldX = this._realX;
		oldY = this._realY;
		oldZ = this._realZ;
		oldA = this._realA;
		this._realX = x;
		this._realY = y;
		this._realZ = z;
		this._realA = a;
		this.onRealUpdated.fire(this, oldX, oldY, oldZ, oldA, x, y, z, a);
	}
	function updateKnown(time, x, y, z, a, velocityX, velocityY, velocityZ, velocityA) {
		oldTime = this._knownTime;
		oldX = this._knownX;
		oldY = this._knownY;
		oldZ = this._knownZ;
		oldA = this._knownA;
		oldVelocityX = this._knownVelocityX;
		oldVelocityY = this._knownVelocityY;
		oldVelocityZ = this._knownVelocityZ;
		oldVelocityA = this._knownVelocityA;
		this._knownTime = time;
		this._knownX = x;
		this._knownY = y;
		this._knownZ = z;
		this._knownA = a;
		this._knownVelocityX = x;
		this._knownVelocityY = y;
		this._knownVelocityZ = z;
		this._knownVelocityA = a;
		this.onKnownUpdated.fire(this, oldTime, oldX, oldY, oldZ, oldA, oldVelocityX, oldVelocityY, oldVelocityZ, oldVelocityA,
					              newTime, newX, newY, newZ, newA, newVelocityX, newVelocityY, newVelocityZ, newVelocityA)
	}
	function recomputeReal(time) {
		delta = time - this.knownTime;
		// Doesn't compute turns properly yet
		newX = this.knownX + (this.knownVelocityX * delta);
		newY = this.knownY + (this.knownVelocityY * delta);
		newZ = this.knownZ + (this.knownVelocityZ * delta);
		newA = this.knownA + (this.knownVelocityA * delta);
		this.updateReal(newX, newY, newZ, newA);
	}
}


function World() {
	this._players = {};
	this.onPlayerAdded = Event();
	this.onPlayerRemoved = Event();
}

World.prototype = {
	addPlayer: function(player) {
		this._players[player.objectId] = player;
		this.onPlayerAdded.fire(this, player);
	},
	removePlayer: function(player) {
		delete this._players[player.objectId];
		this.onPlayerRemoved.fire(this, player);
	}
}

function WorldRenderer(world) {
	THREE.Object3D.call(this);
	this._playerRemovedFunctions = {};
	this._playerAddedListener = world.onPlayerAdded.listen(function(world, player) {
		var playerObject = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshPhongMaterial({color: 0x0099ff}));
		var updateRealListener = player.onRealUpdated.listen(function(player, oldX, oldY, oldZ, oldA, x, y, z, a) {
			playerObject.position.x = x;
			playerObject.position.y = y;
			playerObject.position.z = z;
			playerObject.rotation.y = a;
		});
		this._playerRemovedFunctions[player.objectId] = function() {
			updateRealListener.remove();
		};
	});
	this._playerRemovedListener = world.onPlayerRemoved.push(function(world, player) {
		this._playerRemovedFunctions[player.objectId]();
		delete this._playerRemovedFunctions[player.objectId];
	});
}

WorldRenderer.prototype = Object.create(THREE.Object3D);
WorldRenderer.prototype.constructor = WorldRenderer;

WorldRenderer.prototype.shutdown = function() {
	this._playerAddedListener.remove();
	this._playerRemovedListener.remove();
	for(key in this._playerRemovedFunctions) {
		this._playerRemovedFunctions[key]();
	}
}







