import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import genColor from './color';
import TextureManager from './textureManager';

const scene = new THREE.Scene();
const textureManager = new TextureManager(scene);

// 加载模型
const loader = new GLTFLoader();
loader.load('./assets/scene.gltf', (gltf) => {
    scene.add(gltf.scene);
    
    // 优化材质设置
    gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
                if (child.material.isMeshStandardMaterial) {
                    child.material.roughness = 0.3;
                    child.material.metalness = 0.7;
                }
            }
        }
    });
    
    genColor(scene);
});

// 光照设置
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.4);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

// 背景和地面
scene.background = new THREE.Color(0xf0f0f0);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({ color: 0xcccccc, transparent: true, opacity: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true; //
ground.name = 'ground';
scene.add(ground);

// 相机设置
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 1, 2);
camera.lookAt(0, 0, 0);
scene.add(camera);

// 渲染器设置
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas') as HTMLCanvasElement,
    antialias: true,
    // alpha: true,
    // powerPreference: "high-performance"
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// 控制器设置
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.5;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;

// 事件监听
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const frontViewBtn = document.getElementById('front-view');
if (frontViewBtn) {
    frontViewBtn.addEventListener('click', () => {
        camera.position.set(0, 0, 2);
        camera.lookAt(0, 0, 0);
        controls.update();
    });
}

const clearTexturesBtn = document.getElementById('clear-textures');
if (clearTexturesBtn) {
    clearTexturesBtn.addEventListener('click', () => {
        textureManager.clearAll();
        // 隐藏贴图控制面板
        const controlsPanel = document.getElementById('texture-controls');
        if (controlsPanel) controlsPanel.style.display = 'none';
    });
}

// 贴图控制事件
const applyScaleBtn = document.getElementById('apply-scale');
if (applyScaleBtn) {
    applyScaleBtn.addEventListener('click', () => {
        const scaleX = parseFloat((document.getElementById('scale-x') as HTMLInputElement).value);
        const scaleY = parseFloat((document.getElementById('scale-y') as HTMLInputElement).value);
        textureManager.setTextureScale(scaleX, scaleY);
    });
}

const applyOffsetBtn = document.getElementById('apply-offset');
if (applyOffsetBtn) {
    applyOffsetBtn.addEventListener('click', () => {
        const offsetX = parseFloat((document.getElementById('offset-x') as HTMLInputElement).value);
        const offsetY = parseFloat((document.getElementById('offset-y') as HTMLInputElement).value);
        textureManager.setTextureOffset(offsetX, offsetY);
    });
}

const applyRotationBtn = document.getElementById('apply-rotation');
if (applyRotationBtn) {
    applyRotationBtn.addEventListener('click', () => {
        const rotation = parseFloat((document.getElementById('rotation') as HTMLInputElement).value);
        textureManager.setTextureRotation(rotation);
    });
}

const resetTransformBtn = document.getElementById('reset-transform');
if (resetTransformBtn) {
    resetTransformBtn.addEventListener('click', () => {
        textureManager.resetTextureTransform();
        // 重置输入框
        (document.getElementById('scale-x') as HTMLInputElement).value = '1';
        (document.getElementById('scale-y') as HTMLInputElement).value = '1';
        (document.getElementById('offset-x') as HTMLInputElement).value = '0';
        (document.getElementById('offset-y') as HTMLInputElement).value = '0';
        (document.getElementById('rotation') as HTMLInputElement).value = '0';
    });
}

// 监听贴图上传，显示控制面板
const fileInput = document.getElementById('file-input');
if (fileInput) {
    fileInput.addEventListener('change', () => {
        const controlsPanel = document.getElementById('texture-controls');
        if (controlsPanel) controlsPanel.style.display = 'block';
    });
}

// 渲染循环
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

