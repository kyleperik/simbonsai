var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 20;

// create an AudioListener and add it to the camera
var listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
var sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load( 'music/growth.ogg', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.setVolume( 0.5 );
    sound.play();
});

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );

var structure = {
    length: 7,
    anglex: Math.PI * 3 / 2,
    angley: 0,
    nodes: [
        {
            length: 3,
            anglex: Math.PI / 2 + Math.PI / 16,
            angley: Math.PI,
            nodes: [
                {
                    length: 3,
                    anglex: Math.PI / 32,
                    angley: 0,
                    nodes: []
                },
                {
                    length: 3,
                    anglex: Math.PI / 2,
                    angley: Math.PI / 2,
                    nodes: []
                },
            ]
        },
        {
            length: 3,
            anglex: Math.PI / 32,
            angley: 0,
            nodes: [
                {
                    length: 5,
                    anglex: Math.PI / 2,
                    angley: 0,
                    nodes: [
                        {
                            length: 3,
                            anglex: Math.PI / 32,
                            angley: 0,
                            nodes: []
                        },
                        {
                            length: 3,
                            anglex: -Math.PI / 5,
                            angley: Math.PI / 4,
                            nodes: []
                        },
                    ]
                },
                {
                    length: 2,
                    anglex: Math.PI / 32,
                    angley: 0,
                    nodes: [
                        {
                            length: 3,
                            anglex: Math.PI / 32,
                            angley: Math.PI / 32,
                            nodes: []
                        },
                        {
                            length: 2,
                            anglex: -Math.PI / 2,
                            angley: -Math.PI * 7 / 4,
                            nodes: []
                        }
                    ]
                }
            ]
        }
    ]
};

function renderStructure(node, baseVector, baseAnglex, baseAngley) {
    var newBaseAnglex = baseAnglex + node.anglex;
    var newBaseAngley = baseAngley + node.angley;
    var newBaseVector = new THREE.Vector3(0, 0, node.length);
    newBaseVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), newBaseAngley);
    newBaseVector.applyAxisAngle(new THREE.Vector3(1, 0, 0), newBaseAnglex);
    newBaseVector.add(baseVector);
    var geometry = new THREE.Geometry();
    geometry.vertices.push(baseVector, newBaseVector);
    var segment = new THREE.Line(geometry, material);
    return [segment].concat([].concat.apply([], node.nodes.map(
        n => renderStructure(n, newBaseVector, newBaseAnglex, newBaseAngley)
    )));
}

var lines = renderStructure(structure, new THREE.Vector3(0, -5, 0), 0, 0);
var tree = new THREE.Object3D();
lines.forEach(l => tree.add(l));
scene.add(tree);

function animate() {
    requestAnimationFrame( animate );
    tree.rotation.y += 0.002;
    renderer.render( scene, camera );
}
animate();
