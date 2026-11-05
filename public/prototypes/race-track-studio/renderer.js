import * as T from "../../assets/vendor/three-0.162.0/three.module.js";
import { OrbitControls } from "../../assets/vendor/three-0.162.0/OrbitControls.js";
export class StudioScene {
  constructor(container) {
    this.container = container;
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#d3e6e1");
    this.scene.fog = new T.Fog("#d3e6e1", 110, 260);
    this.camera = new T.PerspectiveCamera(43, 1, 0.1, 500);
    this.camera.position.set(52, 58, 70);
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 200;
    this.controls.addEventListener("start", () => {
      this.viewTarget = null;
      this.viewPosition = null;
    });
    this.controls.target.set(0, 0, -15);
    this.controls.update();
    this.scene.add(new T.HemisphereLight("#e7fff7", "#6a8e88", 2.7));
    let sun = new T.DirectionalLight("#fff2d8", 3);
    sun.position.set(-30, 60, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -65,
      right: 65,
      top: 65,
      bottom: -65,
      far: 160,
    });
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.sun = sun;
    const ground = new T.Mesh(
      new T.PlaneGeometry(800, 800),
      new T.MeshStandardMaterial({ color: "#b7d3c0", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const stage = new T.Mesh(
      new T.BoxGeometry(150, 0.5, 150),
      new T.MeshStandardMaterial({ color: "#d9e5d8", roughness: 0.94 }),
    );
    stage.position.y = -0.35;
    stage.receiveShadow = true;
    this.scene.add(stage);
    this.grid = new T.GridHelper(150, 75, "#91b3a5", "#b9cec1");
    this.grid.position.y = -0.085;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.4;
    this.scene.add(this.grid);
    // Repeated low-poly foliage outside the build area; shared geometry and materials.
    const trunks = new T.InstancedMesh(
        new T.CylinderGeometry(0.2, 0.3, 2, 5),
        new T.MeshStandardMaterial({ color: "#8e8d6d" }),
        38,
      ),
      crowns = new T.InstancedMesh(
        new T.IcosahedronGeometry(2.1, 0),
        new T.MeshStandardMaterial({ color: "#629e84", roughness: 1 }),
        38,
      );
    let dummy = new T.Object3D();
    for (let i = 0; i < 38; i++) {
      let angle = i * 2.39996,
        r = 82 + (i % 5) * 4,
        x = Math.cos(angle) * r,
        z = Math.sin(angle) * r;
      dummy.position.set(x, 1, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 3;
      dummy.scale.set(1, 1.3, 1);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(trunks, crowns);
    this.root = new T.Group();
    this.scene.add(this.root);
    this.raycaster = new T.Raycaster();
    this.pointer = new T.Vector2();
    this.resize = new ResizeObserver(() => {
      let w = container.clientWidth,
        h = container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    this.resize.observe(container);
  }
  pick(ev, objects = this.root.children) {
    let r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((ev.clientX - r.left) / r.width) * 2 - 1,
      (-(ev.clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }
  groundPoint(ev, height = 0) {
    this.pick(ev, []);
    let point = new T.Vector3();
    return this.raycaster.ray.intersectPlane(
      new T.Plane(new T.Vector3(0, 1, 0), -height),
      point,
    );
  }
  view(mode, point) {
    const t = point
      ? new T.Vector3(point.x, point.y, point.z)
      : new T.Vector3(0, 0, -15);
    this.viewTarget = t;
    this.viewPosition = t
      .clone()
      .add(
        mode === "top"
          ? new T.Vector3(0, 85, 0.01)
          : mode === "ground"
            ? new T.Vector3(22, 7, 22)
            : new T.Vector3(52, 58, 70),
      );
  }
  render() {
    if (this.viewTarget) {
      this.controls.target.lerp(this.viewTarget, 0.14);
      this.camera.position.lerp(this.viewPosition, 0.14);
      if (this.camera.position.distanceTo(this.viewPosition) < 0.03) {
        this.viewTarget = null;
        this.viewPosition = null;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
