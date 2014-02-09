
Tank = function() {
    THREE.Object3D.call(this);
}

Tank.prototype = Object.create(THREE.Object3D.prototype);
Tank.prototype.constructor = Tank;





var scene = new THREE.Scene()

var width = window.innerWidth;
var height = window.innerHeight;
var horizontalFieldOfView = 75;
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

boltTexture = new THREE.ImageUtils.loadTexture('data/red_bolt.png');

function fire(origin, termination, start, stop) {
    var relativeTermination = new THREE.Vector3(termination.x - origin.x, termination.y - origin.y, termination.z - origin.z);
    var originToTermination = new THREE.Ray(origin, relativeTermination.normalize());
    var shotLength = origin.distanceTo(termination);
    distancePerMs = shotLength / (stop - start);
    
    var boltMaterial = new THREE.SpriteMaterial({map: boltTexture});
    var boltSprite = new THREE.Sprite(boltMaterial);
    scene.add(boltSprite);
    var boltLight = new THREE.PointLight(0xffffff, 1, 5);
    scene.add(boltLight);
    boltLight.position = boltSprite.position;
    
    originToTermination.at((window.performance.now - start) * distancePerMs, boltSprite.position);
    console.log("Initiated shot");
    console.log("Start: " + start);
    console.log("Stop: " + stop);
    console.log("Shot at " + boltSprite.position);
    function nextFrame(theTime) {
        if(theTime >= stop) {
            scene.remove(boltSprite);
            scene.remove(boltLight);
            console.log("Shot stopped at " + boltSprite.position);
            return;
        }
//        console.log("Frame: " + theTime);
        originToTermination.at((theTime - start) * distancePerMs, boltSprite.position);
        requestAnimationFrame(nextFrame);
    }
    requestAnimationFrame(nextFrame);
}

var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.x = 0;
light.position.y = 100;
light.position.z = 0;
scene.add(light);

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xaaccff, 1);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

fire(new THREE.Vector3(5, 1.57, 20), new THREE.Vector3(-70, 1.57, -140), window.performance.now() + 1000, window.performance.now() + 5000);

function drawOneFrame() {
    requestAnimationFrame(drawOneFrame);
    renderer.render(scene, camera);
//    light.position.y = Math.sin(Date.now() / 1000 * Math.PI * 2 / 4) * 50;
//    box.rotation.y = Date.now() / 1000 * Math.PI * 2 / 9;
}

drawOneFrame();

