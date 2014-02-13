
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
		return this._realX;
	},
	get realY() {
		return this._realY;
	},
	get realZ() {
		return this._realZ;
	},
	get realA() {
		return this._realA;
	},
	get knownTime() {
		return this._knownTime;
	},
	get knownX() {
		return this._knownX;
	},
	get knownY() {
		return this._knownY;
	},
	get knownZ() {
		return this._knownZ;
	},
	get knownA() {
		return this._knownA;
	},
	get knownVelocityX() {
		return this._knownVelocityX;
	},
	get knownVelocityY() {
		return this._knownVelocityY;
	},
	get knownVelocityZ() {
		return this._knownVelocityZ;
	},
	get knownVelocityA() {
		return this._knownVelocityA;
	},
	updateReal: function(x, y, z, a) {
		oldX = this._realX;
		oldY = this._realY;
		oldZ = this._realZ;
		oldA = this._realA;
		this._realX = x;
		this._realY = y;
		this._realZ = z;
		this._realA = a;
		this.onRealUpdated.fire(this, oldX, oldY, oldZ, oldA, x, y, z, a);
	},
	updateKnown: function(time, x, y, z, a, velocityX, velocityY, velocityZ, velocityA) {
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
		this._knownVelocityX = velocityX;
		this._knownVelocityY = velocityY;
		this._knownVelocityZ = velocityZ;
		this._knownVelocityA = velocityA;
		this.onKnownUpdated.fire(this, oldTime, oldX, oldY, oldZ, oldA, oldVelocityX, oldVelocityY, oldVelocityZ, oldVelocityA,
					              time, x, y, z, a, velocityX, velocityY, velocityZ, velocityA)
	},
	recomputeReal: function(time) {
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
	this.onPlayerAdded = new Event();
	this.onPlayerRemoved = new Event();
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
	this._playerRenderers = {};
	var worldRenderer = this;
	this._playerAddedListener = world.onPlayerAdded.listen(function(world, player) {
		var renderer = new PlayerRenderer(player);
		worldRenderer._playerRenderers[player.objectId] = renderer;
		worldRenderer.add(renderer);
	});
	this._playerRemovedListener = world.onPlayerRemoved.listen(function(world, player) {
		var renderer = worldRenderer._playerRenderers[player.objectId];
		worldRenderer.remove(renderer);
		renderer.shutdown();
		delete worldRenderer._playerRenderers[player.objectId];
	});
}

WorldRenderer.prototype = Object.create(THREE.Object3D.prototype);
WorldRenderer.prototype.constructor = WorldRenderer;

WorldRenderer.prototype.shutdown = function() {
	this._playerAddedListener.remove();
	this._playerRemovedListener.remove();
	for(key in this._playerRenderers) {
		this._playerRenderers[key].shutdown();
	}
}

function PlayerRenderer(player) {
	THREE.Object3D.call(this);
	var playerRenderer = this;
	this.avatar = new THREE.Object3D();
	var mesh = new THREE.Mesh(new THREE.CubeGeometry(2, 1, 6), new THREE.MeshBasicMaterial({color: 0x0099ff, emissive: 0x0099ff}));
	mesh.position.y = 0.5;
	this.avatar.add(mesh);
	this.add(this.avatar);
	this._realUpdatedListener = player.onRealUpdated.listen(function(player, oldX, oldY, oldZ, oldA, x, y, z, a) {
		console.log("New Z: " + z);
	    playerRenderer.avatar.position.x = x;
		playerRenderer.avatar.position.y = y;
		playerRenderer.avatar.position.z = z;
		playerRenderer.avatar.rotation.y = a;
	})
}

PlayerRenderer.prototype = Object.create(THREE.Object3D.prototype);
PlayerRenderer.prototype.constructor = PlayerRenderer;

PlayerRenderer.prototype.shutdown = function() {
	this._realUpdatedListener.remove();
}


var scene = new THREE.Scene()

var width = window.innerWidth;
var height = window.innerHeight;
var horizontalFieldOfView = 60;
var verticalFieldOfView = horizontalFieldOfView / width * height;

var camera = new THREE.PerspectiveCamera(verticalFieldOfView, width / height, 0.1, 1000);
camera.position.y = 1.57;
camera.position.z = 25;
scene.add(camera);

var floorTexture = new THREE.ImageUtils.loadTexture('data/std_ground.png');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(40, 40);
var floorMaterial = new THREE.MeshPhongMaterial({map: floorTexture, side: THREE.DoubleSide});
var floorGeometry = new THREE.PlaneGeometry(320, 320, 20, 20);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

var light = new THREE.AmbientLight(0xf0f0f0);
//light.position.x = 0;
//light.position.y = 100;
//light.position.z = 0;
scene.add(light);

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xaaccff, 1);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

var world = new World();
var worldRenderer = new WorldRenderer(world);
scene.add(worldRenderer);

var lastDrawTime = window.performance.now();

var player = new Player();
player.updateKnown(window.performance.now() / 1000, 0, 0, 0, 0, 0, 0, -5, Math.PI / 4)
world.addPlayer(player);

function drawOneFrame(currentTime) {
 requestAnimationFrame(drawOneFrame);
 for(playerId in world._players) {
	 world._players[playerId].recomputeReal(currentTime / 1000);
 }
 renderer.render(scene, camera);
// light.position.y = Math.sin(Date.now() / 1000 * Math.PI * 2 / 4) * 50;
// box.rotation.y = Date.now() / 1000 * Math.PI * 2 / 9;
}

drawOneFrame();








