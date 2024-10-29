// Initialize the Three.js renderer with full screen size
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Attach renderer to the root div
const threeJsRoot = document.getElementById("threejs-root");
threeJsRoot.appendChild(renderer.domElement);

// Create a Three.js scene and camera
const scene = new THREE.Scene();
const camera = new THREE.Camera();
scene.add(camera);

// Add lighting to the scene
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

// AR.js controls
const arToolkitSource = new THREEx.ArToolkitSource({ sourceType: "webcam" });
arToolkitSource.init(() => onResize());

const arToolkitContext = new THREEx.ArToolkitContext({
  cameraParametersUrl:
    "https://cdn.rawgit.com/AR-js-org/AR.js/master/data/data/camera_para.dat",
  detectionMode: "mono",
});
arToolkitContext.init(() =>
  camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix())
);

// Resize handler
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  arToolkitSource.onResize();
  arToolkitSource.copyElementSizeTo(renderer.domElement);
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
  }
}
window.addEventListener("resize", onResize);

// Marker Controls
const markerRoot = new THREE.Group();
scene.add(markerRoot);
new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
  type: "pattern",
  patternUrl:
    "https://cdn.rawgit.com/AR-js-org/AR.js/master/three.js/examples/marker-training/examples/pattern-files/pattern-arjs.patt",
});
scene.visible = false;

// Ensure to import the necessary Three.js classes if using ES modules
const fontLoader = new THREE.FontLoader();

// Load the font and create 3D text
function create3DText(text) {
  return new Promise((resolve, reject) => {
    fontLoader.load(
      "fonts/Share_Tech_Mono_Regular.json",
      (font) => {
        const geometry = new THREE.TextGeometry(text, {
          font: font,
          size: 0.5, // Size of the text
          height: 0.1, // Depth of the text
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        // Compute the bounding box to center the text
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;

        // Center the text based on its bounding box
        const centerOffset = new THREE.Vector3();
        centerOffset.x = (boundingBox.max.x - boundingBox.min.x) / 2;
        centerOffset.y = (boundingBox.max.y - boundingBox.min.y) / 2;
        centerOffset.z = (boundingBox.max.z - boundingBox.min.z) / 2;

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
        });
        const textMesh = new THREE.Mesh(geometry, material);

        // Apply the center offset to the text position
        textMesh.position.set(-centerOffset.x, -centerOffset.y, 0); // Center it on X and Y axes, Z remains at 0
        resolve(textMesh);
      },
      undefined,
      reject
    );
  });
}

// Create and add the 3D text
create3DText("My Skillsets").then((textMesh) => {
  textMesh.position.set(-2, 0, 2.5); // Position it above the marker
  markerRoot.add(textMesh);
});

// Plane geometry for the intro board
const introTexture = new THREE.TextureLoader().load("images/intro.png");
const introMaterial = new THREE.MeshBasicMaterial({ map: introTexture });
const introBoard = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 1.5),
  introMaterial
);

introBoard.position.set(0, 2.5, -2); // Position behind models
introBoard.scale.set(2, 2.5, 2);
markerRoot.add(introBoard);

// Load models
const models = [];
const loader = new THREE.GLTFLoader();
loader.load("3d_model/lost_programmer.glb", (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 1.5, 0);
  model.scale.set(1, 1, 1);
  model.rotation.z = -Math.PI;
  markerRoot.add(model);
  models.push(model);
});

// Create hexagon medal with reused texture loader
const textureLoader = new THREE.TextureLoader();
function createMedalHexagon(textureUrl) {
  const outerHexagonGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);
  const innerHexagonGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 6);

  const texture = textureLoader.load(textureUrl);
  const outerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const innerMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
  });

  const outerHexagon = new THREE.Mesh(outerHexagonGeometry, outerMaterial);
  const innerHexagonFront = new THREE.Mesh(innerHexagonGeometry, innerMaterial);
  const innerHexagonBack = new THREE.Mesh(
    innerHexagonGeometry,
    innerMaterial.clone()
  );

  innerHexagonFront.position.y = 0.15;
  innerHexagonBack.position.y = -0.15;
  innerHexagonFront.rotation.y = Math.PI / 2;
  innerHexagonBack.rotation.y = -Math.PI / 2;

  const hexagonMedal = new THREE.Group();
  hexagonMedal.add(outerHexagon, innerHexagonFront, innerHexagonBack);
  hexagonMedal.rotation.x = Math.PI / 2;

  return hexagonMedal;
}

// Create hexagons and add to scene
const hexagons = [];
const logoUrls = [
  "tech/opencv.png",
  "tech/arduino.jpg",
  "tech/git.png",
  "tech/tensorflow.png",
  "tech/java.png",
  "tech/unity.png",
  "tech/reactjs.png",
  "tech/nodejs.png",
  "tech/mongodb.png",
  "tech/express.png",
  "tech/firebase.png",
  "tech/flutter.png",
];
const radius = 2;
const halfLength = logoUrls.length / 2;

logoUrls.forEach((logo, index) => {
  const hexagon = createMedalHexagon(logo);
  const angle = ((index % halfLength) / halfLength) * Math.PI * 2;
  const elevation = index < halfLength ? 0.5 : 2.5;
  hexagon.position.set(
    Math.cos(angle) * radius,
    elevation,
    Math.sin(angle) * radius
  );
  hexagon.scale.set(0.5, 0.5, 0.5);
  markerRoot.add(hexagon);
  hexagons.push(hexagon);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (arToolkitSource.ready) {
    arToolkitContext.update(arToolkitSource.domElement);
    scene.visible = markerRoot.visible;
  }

  const time = Date.now();
  const angleOffset = Math.PI * 2;
  const floatAmplitude = 0.1;
  const floatSpeed = 0.002;

  // Update models
  models.forEach((model, index) => {
    model.position.y = Math.sin(time * floatSpeed) * floatAmplitude + 1.5;
    model.rotation.y += 0.01 * (index + 1);
  });

  // Update hexagons
  hexagons.forEach((hexagon, index) => {
    const indexNew = index % halfLength;
    const offset = index >= halfLength ? Math.PI / 2 : 0;
    const elevationOffset = index >= halfLength ? 2 : 0;
    const angle =
      time * 0.0001 + (indexNew / halfLength) * angleOffset + offset;

    hexagon.position.x = Math.cos(angle) * radius;
    hexagon.position.y =
      Math.sin(time * floatSpeed + index * 0.5) * floatAmplitude +
      0.5 +
      elevationOffset;
    hexagon.position.z = Math.sin(angle) * radius;

    hexagon.rotation.z += 0.01;
  });

  if (scene.visible) {
    renderer.render(scene, camera);
  }
}

animate();
