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

// SIMPLE STRUCTURE FOR TESTING
var simple_structure = {
    length: 5,
    width: .5,
    anglex: Math.PI * 3 / 2,
    angley: Math.PI / 2,
    nodes: [
        {
            length: 5,
            width: .05,
            anglex: Math.PI / 2 - Math.PI / 10,
            angley: Math.PI * 3 / 2,
            nodes: [],
        }
    ],
};

var tree_structure = {
    length: 7,
    width: .6,
    anglex: Math.PI * 3 / 2,
    angley: Math.PI / 5,
    nodes: [
        {
            length: 2,
            width: .3,
            anglex: Math.PI / 2 + Math.PI / 16,
            angley: Math.PI,
            nodes: [
                {
                    length: 2,
                    width: .1,
                    anglex: -Math.PI / 16,
                    angley: 0,
                    nodes: [
                        {
                            length: 3,
                            width: 0.05,
                            anglex: -Math.PI / 32,
                            angley: 0,
                            nodes: []
                        },
                        {
                            length: 3,
                            width: 0.05,
                            anglex: -Math.PI / 6,
                            angley: Math.PI / 2,
                            nodes: []
                        },
                    ]
                }
            ]
        },
        {
            length: 3,
            width: .4,
            anglex: 0,
            angley: 0,
            nodes: [
                {
                    length: 4,
                    width: .2,
                    anglex: Math.PI / 2,
                    angley: 0,
                    nodes: [
                        {
                            length: 3,
                            width: 0.05,
                            anglex: -Math.PI / 32,
                            angley: 0,
                            nodes: []
                        },
                        {
                            length: 3,
                            width: 0.05,
                            anglex: -Math.PI / 3,
                            angley: Math.PI / 3,
                            nodes: []
                        },
                    ]
                },
                {
                    length: 3,
                    width: .2,
                    anglex: -Math.PI / 32,
                    angley: 0,
                    nodes: [
                        {
                            length: 3,
                            width: 0.05,
                            anglex: Math.PI / 32,
                            angley: Math.PI / 32,
                            nodes: []
                        },
                        {
                            length: 2,
                            width: 0.05,
                            anglex: -Math.PI / 3,
                            angley: -Math.PI * 7 / 4,
                            nodes: []
                        }
                    ]
                }
            ]
        }
    ]
};
var structure = tree_structure;

function flat(l) {
    return [].concat.apply([], l);
}

function range(n) {
    return [...Array(n).keys()];
}

var resolution = 5;

function extendedVector(relref, base, anglex, angley) {
    var rel = relref.clone();
    rel.applyAxisAngle(new THREE.Vector3(1, 0, 0), anglex);
    rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), angley);
    rel.add(base);
    return rel;
}

function renderStructure(node, baseWidth, baseVector, baseAnglex, baseAngley) {
    var newBaseAnglex = baseAnglex + node.anglex;
    var newBaseAngley = baseAngley + node.angley;
    var newBaseVector = extendedVector(
        new THREE.Vector3(0, 0, node.length),
        baseVector, newBaseAnglex, newBaseAngley
    );
    var geometry = new THREE.Geometry();
    var capPoint = extendedVector(
        new THREE.Vector3(0, 0, node.length + node.width),
        baseVector, newBaseAnglex, newBaseAngley
    );
    var endbranch = node.nodes.length === 0;
    // Needs one level to exist on the end,
    //   and possibly another to have a round cap off
    var vertexLevels = node.length + 1 + (endbranch ? 0 : 1);
    var points = flat(range(vertexLevels).map(
        i => {
            var isCap = i === node.length + 1 && !endbranch;
            var l = isCap ? node.length + node.width * 0.5 : i;
            var w = (
                isCap
                    ? node.width * 0.86
                    : (
                        baseWidth * ((node.length) - l) / node.length
                            + node.width * l / node.length
                    )
            );
            return range(resolution).map(
                r => {
                    var rel = new THREE.Vector3(w, 0, l);
                    rel.applyAxisAngle(new THREE.Vector3(0, 0, 1), r * Math.PI * 2 / resolution);
                    return extendedVector(
                        rel, baseVector, newBaseAnglex, newBaseAngley
                    );
                }
            )
        }
    )).concat([capPoint]);
    // Now triangulate!
    var faces = flat(range(vertexLevels - 1).map(l => {
        var base = l * resolution;
        return flat(range(resolution).map(r => [
            new THREE.Face3(
                base + r,
                base + (r + 1) % resolution,
                base + r + resolution
            ), new THREE.Face3(
                base + (r + 1) % resolution,
                base + (r + 1) % resolution + resolution,
                base + r + resolution
            )
        ]));
    })).concat(range(resolution).map(r => new THREE.Face3(
        (vertexLevels - 1) * resolution + r,
        (vertexLevels - 1) * resolution + (r + 1) % resolution,
        vertexLevels * resolution
    )));
    geometry.vertices = points;
    geometry.faces = faces;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var segment = new THREE.Mesh(geometry, material);
    return [segment].concat([].concat.apply([], node.nodes.map(
        n => renderStructure(n, node.width, newBaseVector, newBaseAnglex, newBaseAngley)
    )));
}

var lines = renderStructure(structure, 1.5, new THREE.Vector3(0, -5, 0), 0, 0);
var tree = new THREE.Object3D();
lines.forEach(l => tree.add(l));
scene.add(tree);

function animate() {
    requestAnimationFrame( animate );
    tree.rotation.y += 0.008;
    renderer.render( scene, camera );
}
animate();
