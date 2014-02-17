
// Alternative to requestAnimationFrame that does some nice things,
// particularly giving us a global in which the current animation time is
// stored instead of having to pass it down through function calls. In the
// future, I'm also planning to expand it to continue to run certain functions
// under setTimeout when requestAnimationFrame wouldn't otherwise run them
// (like when the window isn't focused) to, for example, continue to simulate
// physics and collisions appropriately (although I'm still holding out hope
// that I can move them to the server at some point).
// 
// We use two separate global dicts for old animators (those about to be run
// during the current animation loop) and new animators (those scheduled to be
// run since the beginning of the last/current animation loop) to allow
// animations to be cancelled whether they were newly scheduled during this
// loop or scheduled during the last loop but haven't yet been run.
_oldAnimators = {};
_newAnimators = {};
_hasNewAnimators = false;
_nextAnimatorId = 1;
animationTime = window.performance.now() / 1000;
function animate(f) {
	if(!_hasNewAnimators) {
		_hasNewAnimators = true;
		requestAnimationFrame(function(newTime) {
			animationTime = newTime / 1000;
			_oldAnimators = _newAnimators;
			_newAnimators = {};
			_hasNewAnimators = false;
			var totalSeen = 0;
			for(var key in _oldAnimators) {
				totalSeen++;
				// BIG HUGE NOTE: If an animator that hasn't yet been fired is
				// removed during the course of this animator, we'll end up
				// removing a property from _oldAnimators that we haven't yet
				// visited. This /seems/ to be ok (and will result in the
				// property not being visited) according to
				// https://developer.mozilla.org/en/JavaScript/Reference/Statements/for...in,
				// but if strange issues start happening, it might be
				// worthwhile to cache the list of keys in a temporary array
				// and then skip over ones that don't actually exist when we
				// try to run them.
				_oldAnimators[key]();
			}
			// Don't make the old animators hang around until the next
			// animation loop
			_oldAnimators = {};
			// debugger;
		});
	}
	var id = (_nextAnimatorId++).toString();
	_newAnimators[id] = f;
	return id;
}
function cancelAnimate(id) {
	if(_oldAnimators[id]) {
		delete _oldAnimators[id];
	}
	if(_newAnimators[id]) {
		delete _newAnimators[id];
	}
}

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

// MUST call shutdown() on any Player object once you're done with it to stop
// its internal animation loop that updates its real position from its known
// position
function Player(name) {
	this.objectId = (Player._nextId++).toString();
	this.name = name;
	this._realX = 0;
	this._realY = 0;
	this._realZ = 0;
	this._realA = 0;
	this._realRecomputedAt = 0;
	this._knownTime = animationTime;
	this._knownX = 0;
	this._knownY = 0;
	this._knownZ = 0;
	this._knownA = 0;
	this._knownVelocityX = 0;
	this._knownVelocityY = 0;
	this._knownVelocityZ = 0;
	this._knownVelocityA = 0;
	this.onKnownUpdated = new Event();
}

Player._nextId = 1;
Player.prototype = {
	get realX() {
		this._recomputeRealIfNeeded();
		return this._realX;
	},
	get realY() {
		this._recomputeRealIfNeeded();
		return this._realY;
	},
	get realZ() {
		this._recomputeRealIfNeeded();
		return this._realZ;
	},
	get realA() {
		this._recomputeRealIfNeeded();
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
	// Don't actually call this. It's automatically called by an internal
	// animation loop that updates the player's current real position based on
	// its last known position.
	setReal: function(x, y, z, a) {
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
	_recomputeRealIfNeeded: function() {
		if(this._realRecomputedAt != animationTime) {
			this._realComputedAt = animationTime;
			timeSinceKnown = animationTime - this.knownTime;
			// Doesn't compute turns properly yet
			this._realX = this.knownX + (this.knownVelocityX * timeSinceKnown);
			this._realY = this.knownY + (this.knownVelocityY * timeSinceKnown);
			this._realZ = this.knownZ + (this.knownVelocityZ * timeSinceKnown);
			this._realA = this.knownA + (this.knownVelocityA * timeSinceKnown);
		}
	},
	setKnown: function(time, x, y, z, a, velocityX, velocityY, velocityZ, velocityA) {
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
					              time, x, y, z, a, velocityX, velocityY, velocityZ, velocityA);
	},
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
	var thisWorldRenderer = this;
	this._playerAddedListener = world.onPlayerAdded.listen(function(world, player) {
		var renderer = new PlayerRenderer(player);
		thisWorldRenderer._playerRenderers[player.objectId] = renderer;
		thisWorldRenderer.add(renderer);
	});
	this._playerRemovedListener = world.onPlayerRemoved.listen(function(world, player) {
		var renderer = thisWorldRenderer._playerRenderers[player.objectId];
		thisWorldRenderer.remove(renderer);
		renderer.shutdown();
		delete thisWorldRenderer._playerRenderers[player.objectId];
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

// PlayerRenderers are always placed at the world's center. They move the
// actual player about within themselves, so the user of a PlayerRenderer
// object is free to set its location and rotation as desired (so for example,
// if it's rendering multiple "worlds" in the same scene, it can place the
// PlayerRenderer objects for one world at the center of one playing field and
// the others at the center of another playing field). The object that gets
// moved and rotated about is (at present) accessible via player.avatar.
function PlayerRenderer(player) {
	THREE.Object3D.call(this);
	var thisPlayerRenderer = this;
	this.avatar = new THREE.Object3D();
	var tankTexture = new THREE.ImageUtils.loadTexture('data/red_tank.png');
	var mesh = new THREE.Mesh(new THREE.CubeGeometry(2.8, 6, 2.05), new THREE.MeshPhongMaterial({map: tankTexture, side: THREE.DoubleSide}));
	mesh.position.z = 0.5;
	this.avatar.add(mesh);
	this.add(this.avatar);
	// Start an animation loop to update the avatar's position with the
	// player's real position as computed by Player's dead reckoning algorithm.
	var animator = function() {
		thisPlayerRenderer.avatar.position.x = player.realX;
		thisPlayerRenderer.avatar.position.y = player.realY;
		thisPlayerRenderer.avatar.position.z = player.realZ;
		thisPlayerRenderer.avatar.rotation.z = player.realA;
		thisPlayerRenderer._animatorId = animate(animator);
	};
	animator();
}

PlayerRenderer.prototype = Object.create(THREE.Object3D.prototype);
PlayerRenderer.prototype.constructor = PlayerRenderer;

PlayerRenderer.prototype.shutdown = function() {
	this._realUpdatedListener.remove();
	cancelAnimate(this._animatorId);
}


var scene = new THREE.Scene()

var width = window.innerWidth;
var height = window.innerHeight;
var horizontalFieldOfView = 60;
var verticalFieldOfView = horizontalFieldOfView / width * height;

var camera = new THREE.PerspectiveCamera(verticalFieldOfView, width / height, 0.1, 1000);
camera.position.z = 1.57;
camera.position.y = -25;
camera.rotation.x = Math.PI / 2;
scene.add(camera);

var floorTexture = new THREE.ImageUtils.loadTexture('data/std_ground.png');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(40, 40);
var floorMaterial = new THREE.MeshPhongMaterial({map: floorTexture, side: THREE.DoubleSide});
var floorGeometry = new THREE.PlaneGeometry(320, 320, 20, 20);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
// floor.rotation.x = Math.PI / 2;
scene.add(floor);

var light = new THREE.AmbientLight(0x888888);
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


var lastDrawTime = animationTime;

var player = new Player();
player.setKnown(animationTime, 0, 0, 0, 0, 0, 5, 0, Math.PI / 4)
world.addPlayer(player);

function drawOneFrame() {
 renderer.render(scene, camera);
 animate(drawOneFrame);
// light.position.y = Math.sin(Date.now() / 1000 * Math.PI * 2 / 4) * 50;
// box.rotation.y = Date.now() / 1000 * Math.PI * 2 / 9;
}

drawOneFrame();








