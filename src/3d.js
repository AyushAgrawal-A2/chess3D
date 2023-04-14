import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let scene, camera, renderer, raycaster, pointer, orbitControls;
const assets = {
  BLACK_KING: {},
  BLACK_QUEEN: {},
  BLACK_BISHOP: {},
  BLACK_KNIGHT: {},
  BLACK_ROOK: {},
  BLACK_PAWN: {},
  WHITE_KING: {},
  WHITE_QUEEN: {},
  WHITE_BISHOP: {},
  WHITE_KNIGHT: {},
  WHITE_ROOK: {},
  WHITE_PAWN: {},
  BASE: {},
};

window.addEventListener("resize", onWindowResize);

init();
renderer.setAnimationLoop(animate);

function init() {
  //scene
  scene = new THREE.Scene();
  scene.backgroundBlurriness = 0.3;

  //camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(10, 15, 0);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.appendChild(renderer.domElement);

  // orbit controls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  // orbitControls.enableZoom = false;
  orbitControls.enablePan = false;
  orbitControls.update();

  // for pointer tracking
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
}

function animate() {
  renderer.render(scene, camera);
  orbitControls.update();
}

export function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function getClickedPosition(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersect = raycaster
    .intersectObjects(scene.children)
    .filter(
      (intersect) =>
        intersect.object.name === "board-piece" ||
        intersect.object.name === "chess-square"
    )[0];
  if (intersect) {
    const clickedVector = new THREE.Vector3()
      .copy(intersect.point)
      .floor()
      .addScalar(0.5);
    if (
      clickedVector.x <= 3.5 &&
      clickedVector.x >= -3.5 &&
      clickedVector.z <= 3.5 &&
      clickedVector.z >= -3.5
    )
      return {
        x: clickedVector.x + 3.5,
        y: 3.5 - clickedVector.z,
      };
  }
  return null;
}

function loadAssets() {
  const promises = [];
  const gltfLoader = new GLTFLoader();
  for (const asset in assets) {
    promises.push(
      new Promise((res, rej) => {
        gltfLoader.load(
          `/assets/${asset}.glb`,
          (object) => {
            assets[asset] = object.scene;
            assets[asset].name =
              asset === "BASE" ? "chess-board" : "board-piece";
            assets[asset].traverse((child) => {
              child.name = asset === "BASE" ? "chess-board" : "board-piece";
              if (child.isMesh) {
                child.material.roughness = 0;
                child.material.metalness = 0.25;
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            res(increaseProgress());
          },
          // (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
          undefined,
          (error) => rej(error)
        );
      })
    );
  }
  const rgbeLoader = new RGBELoader();
  promises.push(
    new Promise((res, rej) => {
      rgbeLoader.load(
        `/assets/blouberg_sunrise_2_1k.hdr`,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.background = texture;
          scene.environment = texture;
          res(increaseProgress());
        },
        //(xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
        undefined,
        (error) => rej(error)
      );
    })
  );
  return Promise.all(promises);
}

export async function create3DBoard(board) {
  displayProgressBar();
  await loadAssets();
  const base = assets.BASE.clone();
  scene.add(base);
  const board3D = [];
  board.forEach((row, x) => {
    const row3D = [];
    row.forEach((cell, z) => {
      if (!cell.type) {
        row3D.push(null);
      } else {
        const piece = assets[cell.name].clone();
        piece.position.set(x - 3.5, 0, 3.5 - z);
        scene.add(piece);
        row3D.push(piece);
      }
    });
    board3D.push(row3D);
  });
  removeProgressBar();
  return board3D;
}

export function create3DPlane(board) {
  const plane3D = [];
  board.forEach((row, x) => {
    const row3D = [];
    row.forEach((_, z) => {
      const square = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.025, 1),
        new THREE.MeshBasicMaterial({
          opacity: 0.35,
          transparent: true,
        })
      );
      square.name = "chess-square";
      square.visible = false;
      square.position.set(x - 3.5, 0, 3.5 - z);
      scene.add(square);
      row3D.push(square);
    });
    plane3D.push(row3D);
  });
  console.log(plane3D[0][0].material);
  return plane3D;
}

function displayProgressBar() {
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  const progress = document.createElement("div");
  progress.className = "progress";
  progress.dataset.loaded = 0;
  progress.dataset.total = 14;
  progressBar.appendChild(progress);
  document.body.appendChild(progressBar);
}

function removeProgressBar() {
  const progressBox = document.querySelector(".progress-bar");
  progressBox.remove();
}

function increaseProgress() {
  const progress = document.querySelector(".progress");
  progress.dataset.loaded++;
  progress.dataset.percent =
    Math.floor((progress.dataset.loaded / progress.dataset.total) * 100) + "%";
  progress.style.width = progress.dataset.percent;
  return progress.dataset.percent;
}
