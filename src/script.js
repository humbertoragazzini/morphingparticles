import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import GUI from "lil-gui";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Materials
  particles.material.uniforms.uResolution.value.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 8 * 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = "#160920";
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});
renderer.setClearColor(debugObject.clearColor);

/**
 * load 3d models
 */
let particles = null;

gltfLoader.load("./models.glb", (gltf) => {
  /**
   * Particles
   */
  particles = {};

  particles.index = 0;

  // extracting positions from the gltf
  const positions = gltf.scene.children.map((child) => {
    return child.geometry.attributes.position;
  });

  particles.maxCount = 0;

  for (let i = 0; i < positions.length; i++) {
    if (particles.maxCount < positions[i].count) {
      particles.maxCount = positions[i].count;
    }
  }
  console.log(particles.maxCount);
  console.log(positions);

  // sizes oof the particles
  const sizesArray = new Float32Array(particles.maxCount);

  for (let i = 0; i < particles.maxCount; i++) {
    sizesArray[i] = Math.random();
  }

  particles.positions = [];

  for (const position of positions) {
    const originalArray = position.array;
    const newArray = new Float32Array(particles.maxCount * 3);

    for (let i = 0; i < particles.maxCount; i++) {
      const i3 = i * 3;
      const i31 = i3 + 1;
      const i32 = i31 + 1;
      if (i3 < originalArray.length) {
        newArray[i3] = originalArray[i3];
        newArray[i31] = originalArray[i31];
        newArray[i32] = originalArray[i32];
      } else {
        const randomePosition = Math.floor(position.count * Math.random()) * 3;
        // newArray[i3] = originalArray[i3 + randomePosition];
        // newArray[i31] = originalArray[i31 + randomePosition];
        // newArray[i32] = originalArray[i32 + randomePosition];
        newArray[i3] = originalArray[randomePosition];
        newArray[i31] = originalArray[randomePosition + 1];
        newArray[i32] = originalArray[randomePosition + 2];
      }
    }
    particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
  }

  console.log(particles.positions);

  // Geometry
  particles.geometry = new THREE.BufferGeometry();
  particles.geometry.setAttribute(
    "position",
    particles.positions[particles.index]
  );
  particles.geometry.setAttribute("aPositionTarget", particles.positions[3]);
  particles.geometry.setAttribute(
    "aSizes",
    new THREE.BufferAttribute(sizesArray, 1)
  );

  // Material
  particles.colorA = "#ffff55";
  particles.colorB = "#5500ff";
  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(0.2),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        )
      ),
      uMixFactor: new THREE.Uniform(0),
      uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
      uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Points
  particles.points = new THREE.Points(particles.geometry, particles.material);
  particles.points.frustumCulled = false;
  scene.add(particles.points);

  // method
  particles.morph = (index) => {
    // update attributes
    particles.geometry.attributes.position =
      particles.positions[particles.index];
    particles.geometry.attributes.aPositionTarget = particles.positions[index];

    // animate mixFactor
    gsap.fromTo(
      particles.material.uniforms.uMixFactor,
      { value: 0 },
      { value: 1, duration: 3, ease: "lineal" }
    );

    // particles index
    particles.index = index;
  };

  particles.morph0 = () => {
    particles.morph(0);
  };
  particles.morph1 = () => {
    particles.morph(1);
  };
  particles.morph2 = () => {
    particles.morph(2);
  };
  particles.morph3 = () => {
    particles.morph(3);
  };

  // tweaks
  gui
    .add(particles.material.uniforms.uMixFactor, "value")
    .min(0)
    .max(1)
    .step(0.001)
    .name("mixFactor");

  gui.add(particles, "morph0");
  gui.add(particles, "morph1");
  gui.add(particles, "morph2");
  gui.add(particles, "morph3");
  gui.addColor(particles, "colorA").onChange(() => {
    particles.material.uniforms.uColorA.values.set(
      new THREE.Color(particles.colorA)
    );
  });
  gui.addColor(particles, "colorB").onChange(() => {
    particles.material.uniforms.uColorA.values.set(
      new THREE.Color(particles.colorB)
    );
  });
});
/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update();

  // Render normal scene
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
