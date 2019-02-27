var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x1111111 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
camera.position.set( -300, 300, 200 );

controls = new THREE.OrbitControls( camera, renderer.domElement );

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

var pointLights = [
    new THREE.PointLight( 0xffffaa, .6, 500 ),
    new THREE.PointLight( 0xffffaa, .6, 500 ),
    new THREE.PointLight( 0xffffaa, .6, 500 ),
];
pointLights[0].position.set( 0, 100, 100 );
pointLights[1].position.set( 0, 100, -100 );
pointLights[2].position.set( 100, 100, -100 );
pointLights.map(pl => scene.add( pl ));

var material = new THREE.MeshLambertMaterial({
    color: 0xdddddd,
    flatShading: true,
});

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

var resolution = 10;

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
    geometry.computeFaceNormals();
    var segment = new THREE.Mesh(geometry, material);
    return [segment].concat([].concat.apply([], node.nodes.map(
        n => renderStructure(n, node.width, newBaseVector, newBaseAnglex, newBaseAngley)
    )));
}

var lines = renderStructure(structure, 1.5, new THREE.Vector3(0, -5, 0), 0, 0);
var tree = new THREE.Object3D();
lines.forEach(l => tree.add(l));
tree.scale.set(7, 7, 7);
scene.add(tree);

var size = 25;
var oldSize = size;
var effect = new THREE.MarchingCubes( size, material, true, true );
effect.position.set( 0, 0, 0 );
effect.scale.set( 200, 200, 200 );
effect.isolation = 80;

var subtract = 12;

effect.addBall(.5, .7, .5, .5, subtract);
effect.addBall(.55, .62, .57, .1, subtract);
effect.addBall(.56, .58, .6, .1, subtract);
effect.addBall(.40, .54, .48, .2, subtract);
effect.addBall(.44, .53, .38, .3, subtract);

var numblobs = 1;

var planea = 2, planeb = 12;

var time = 0;

scene.add( effect );

function animate() {
    requestAnimationFrame( animate );
    effect.rotation.y += 0.008;
    tree.rotation.y += 0.008;

    renderer.render( scene, camera );
}
animate();
