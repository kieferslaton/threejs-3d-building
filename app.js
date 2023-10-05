import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { EdgesGeometry } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff);
renderer.toneMappingExposure = 1;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up camera position
camera.position.x = 0;
camera.position.z = 15;
const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.3;

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onWindowResize, false);
onWindowResize();

const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 2.7); // soft white light
scene.add(ambientLight);

console.log(pointLight);

function splitMultiMaterialMesh(mesh) {
  const singleMaterialMeshes = [];

  mesh.geometry.groups.forEach((group, i) => {
    const groupGeometry = mesh.geometry.clone();

    // Only include the vertices for this group
    groupGeometry.setDrawRange(group.start, group.count);
    groupGeometry.groups = [group];

    // Create a new mesh with the single-material geometry
    const singleMaterialMesh = new THREE.Mesh(groupGeometry, mesh.material[i]);

    singleMaterialMeshes.push(singleMaterialMesh);
  });

  return singleMaterialMeshes;
}

const iridescentMaterial = new THREE.MeshPhysicalMaterial({
  color: "white",
  iridescence: 0.8,
  iridescenceIOR: 1.6,
  iridescenceThicknessRange: [0, 200],
  clearcoat: 0.8,
  reflectivity: 1,
  toneMapped: false,
});

const loader = new OBJLoader();
loader.load(
  "./house.obj", // Replace with your OBJ file path
  (object) => {
    let singleMaterialMeshes;
    console.log(object);
    const edgesGroup = new THREE.Group();
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.name.includes("Cube")) {
          singleMaterialMeshes = splitMultiMaterialMesh(child);
          singleMaterialMeshes[1].material = iridescentMaterial;
          scene.add(singleMaterialMeshes[1]);
          singleMaterialMeshes[0].material = iridescentMaterial;
          scene.add(singleMaterialMeshes[0]);
        }
        const edges = new EdgesGeometry(child.geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xbbbbbb })
        );
        edgesGroup.add(line);
      }
    });

    // Calculate bounding box to set the object's position to the center
    const box = new THREE.Box3().setFromObject(edgesGroup);
    box.getCenter(edgesGroup.position);
    edgesGroup.position.multiplyScalar(-1);
    singleMaterialMeshes[0].position.copy(edgesGroup.position);
    singleMaterialMeshes[1].position.copy(edgesGroup.position);

    scene.add(edgesGroup);
  }
);

let mouse = new THREE.Vector2();

controls.enabled = false;

document.addEventListener("mousemove", (event) => {
  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;

  const sens = 0.1;

  // Calculate the angles based on mouse position
  const theta = ((event.clientX - halfWidth) / halfWidth) * Math.PI * sens;
  const phi =
    ((halfHeight - event.clientY) / halfHeight) * Math.PI * sens - Math.PI / 2;

  // Calculate the radius (distance from the center of the object to the camera)
  const radius = 20;

  // Convert spherical coordinates to Cartesian coordinates
  camera.position.x = radius * Math.sin(-phi) * Math.sin(theta);
  camera.position.y = radius * Math.cos(-phi);
  //camera.position.z = radius * Math.sin(-phi) * Math.cos(theta);

  camera.lookAt(0, 0, 0); // Make sure the camera is always looking at the center
  controls.update();
});

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  //controls.update();
  renderer.render(scene, camera);
};

animate();
