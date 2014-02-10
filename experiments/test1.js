
var currentSpeed = 0;
var currentRotation = 0;
var fireSpeed = 50;
var fireDistance = 100;

window.addEventListener('keyup', function(event) {
    if(event.keyCode == KEY_CODES.UP || event.keyCode == KEY_CODES.DOWN) {
        currentSpeed = 0;
    }
    if(event.keyCode == KEY_CODES.LEFT || event.keyCode == KEY_CODES.RIGHT) {
        currentRotation = 0;
    }
}, false);
window.addEventListener('keydown', function(event) {
    if(event.keyCode == KEY_CODES.UP) {
        currentSpeed = 25;
    }
    if(event.keyCode == KEY_CODES.DOWN) {
        currentSpeed = -25;
    }
    if(event.keyCode == KEY_CODES.LEFT) {
        currentRotation = 0.7;
    }
    if(event.keyCode == KEY_CODES.RIGHT) {
        currentRotation = -0.7;
    }
    if(event.keyCode == 32) {
        var start = window.performance.now();
        var stop = start + (fireDistance / fireSpeed * 1000);
        var v = new THREE.Vector3(0, 0, -1);
        v.applyEuler(camera.rotation);
        var cameraRay = new THREE.Ray(camera.position.clone(), v);
        var origin = cameraRay.at(5);
        var termination = cameraRay.at(5 + fireDistance);
        fire(origin, termination, start, stop);
    }
}, false);

var KEY_CODES = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40
}






Tank = function() {
    THREE.Object3D.call(this);
}

Tank.prototype = Object.create(THREE.Object3D.prototype);
Tank.prototype.constructor = Tank;





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
floor.rotation.x = -(Math.PI / 2);
scene.add(floor);

boltTexture = new THREE.ImageUtils.loadTexture('data/red_bolt.png');
explodeTexturePrototype = new THREE.ImageUtils.loadTexture('data/explode1.png');

function fire(origin, termination, start, stop) {
    var relativeTermination = new THREE.Vector3(termination.x - origin.x, termination.y - origin.y, termination.z - origin.z);
    var originToTermination = new THREE.Ray(origin, relativeTermination.normalize());
    var shotLength = origin.distanceTo(termination);
    var distancePerMs = shotLength / (stop - start);
    
    var boltMaterial = new THREE.SpriteMaterial({map: boltTexture});
    var boltSprite = new THREE.Sprite(boltMaterial);
    scene.add(boltSprite);
    var boltLight = new THREE.PointLight(0xffffff, 1, 5);
    boltLight.position = boltSprite.position;
    scene.add(boltLight);
    
    originToTermination.at((window.performance.now - start) * distancePerMs, boltSprite.position);
    console.log("Initiated shot");
    console.log("Start: " + start);
    console.log("Stop: " + stop);
    console.log("Shot at " + boltSprite.position);
    console.log("Scene.__lights on start: " + scene.__lights);
    function nextFrame(theTime) {
        if(theTime >= stop) {
            scene.remove(boltSprite);
            scene.remove(boltLight);
            console.log("Shot stopped at " + boltSprite.position);
            console.log("Scene.__lights on stop: " + scene.__lights);
            explode(termination);
            return;
        }
//        console.log("Frame: " + theTime);
        originToTermination.at((theTime - start) * distancePerMs, boltSprite.position);
        requestAnimationFrame(nextFrame);
    }
    requestAnimationFrame(nextFrame);
}

function explode(position) {
    var texture = explodeTexturePrototype.clone();
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1/8, 1/8);
    var material = new THREE.SpriteMaterial({map: texture});
    var sprite = new THREE.Sprite(material);
    sprite.scale.x = 3;
    sprite.scale.y = 3;
    sprite.position.copy(position);
    scene.add(sprite);
    console.log("start explosion");
    var frame = 0;
    function nextFrame() {
        if(frame >= 64) {
            console.log("stop explosion");
            scene.remove(sprite);
            return;
        }
        
        var one = Math.floor(frame / 8);
        var two = Math.floor(frame % 8);
        
        texture.offset.y = one / 8;
        texture.offset.x = two / 8;
        
        frame += 1.5;
        requestAnimationFrame(nextFrame);
    }
    requestAnimationFrame(nextFrame);
}

var light = new THREE.AmbientLight(0xf0f0f0);
// light.position.x = 0;
// light.position.y = 100;
// light.position.z = 0;
scene.add(light);
for(var n = 0; n <= 16; n++) {
    var light2 = new THREE.PointLight(0xffffff, 1, 5);
    light2.position = new THREE.Vector3((n * 10) - 80, 2, 0);
    scene.add(light2);
}

var renderer = new THREE.WebGLDeferredRenderer({width: width, height: height, scale: 1});
// renderer.setClearColor(0xaaccff, 1);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// fire(new THREE.Vector3(5, 1.57, 20), new THREE.Vector3(-10, 1.57, -20), window.performance.now() + 1000, window.performance.now() + 2500);

var lastDrawTime = window.performance.now();

function drawOneFrame(currentTime) {
    var delta = currentTime - lastDrawTime;
    lastDrawTime = currentTime;
    if(delta > 0) {  
        // Rotate camera
        camera.rotation.y += currentRotation / 1000 * delta;
        // Create ray pointing in camera's direction
        var v = new THREE.Vector3(0, 0, -1);
        v.applyEuler(camera.rotation);
        var cameraRay = new THREE.Ray(camera.position.clone(), v);
        cameraRay.at(currentSpeed / 1000 * delta, camera.position);
    }
    
    requestAnimationFrame(drawOneFrame);
    renderer.render(scene, camera);
    console.log("Just rendered.");
//    light.position.y = Math.sin(Date.now() / 1000 * Math.PI * 2 / 4) * 50;
//    box.rotation.y = Date.now() / 1000 * Math.PI * 2 / 9;
}

drawOneFrame();

