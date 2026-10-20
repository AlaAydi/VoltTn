import { 
  Component, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  NgZone, 
  OnChanges, 
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-solar-3d',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="solar-3d-wrapper" #container>
      <canvas #canvas class="solar-canvas"></canvas>
      <div class="solar-badge-overlay">
        <span class="material-symbols-rounded">solar_power</span>
        <span>Simulation 3D Toiture & Ensoleillement</span>
      </div>
      <div class="solar-hint">
        Orientation : <strong>{{ orientation }}</strong> • Inclinaison : <strong>30° (Optimale Tunisie)</strong>
      </div>
    </div>
  `,
  styles: [`
    .solar-3d-wrapper {
      position: relative;
      width: 100%;
      height: 260px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: radial-gradient(circle at 60% 20%, #FFFDF5 0%, #E8F4F8 100%);
      box-shadow: inset 0 2px 8px rgba(29, 53, 87, 0.05);
      border: 1px solid var(--border-glass);
    }

    .solar-canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
      &:active { cursor: grabbing; }
    }

    .solar-badge-overlay {
      position: absolute;
      top: 12px;
      left: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(8px);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 800;
      color: var(--text-main);
      box-shadow: var(--shadow-sm);
      .material-symbols-rounded { font-size: 15px; color: var(--sun-amber); }
    }

    .solar-hint {
      position: absolute;
      bottom: 10px;
      right: 14px;
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.88);
      border-radius: var(--radius-full);
      font-size: 11px;
      color: var(--text-muted);
      pointer-events: none;
      strong { color: var(--sun-amber); }
    }
  `]
})
export class Solar3dComponent implements OnInit, OnDestroy, OnChanges {
  @Input() surfaceM2 = 36;
  @Input() orientation = 'SUD';

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animId: number | null = null;
  private panelsGroup = new THREE.Group();
  private sunLight!: THREE.DirectionalLight;
  private particlesMesh!: THREE.Points;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.scene && (changes['surfaceM2'] || changes['orientation'])) {
      this.rebuildPanels();
    }
  }

  ngOnDestroy(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  private initThree(): void {
    const width = this.containerRef.nativeElement.clientWidth || 400;
    const height = this.containerRef.nativeElement.clientHeight || 260;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 3.8, 6.2);
    this.camera.lookAt(0, 0.4, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xFFFBF2, 1.2);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xFFB703, 2.2);
    this.sunLight.position.set(4, 8, 4);
    this.scene.add(this.sunLight);

    // Toiture maison tunisienne
    const roofGeo = new THREE.BoxGeometry(4.8, 0.3, 3.4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xECE5D8,
      roughness: 0.6
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = -0.15;
    this.scene.add(roof);

    this.scene.add(this.panelsGroup);
    this.rebuildPanels();
    this.buildEnergyParticles();

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private rebuildPanels(): void {
    while (this.panelsGroup.children.length > 0) {
      const obj = this.panelsGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      this.panelsGroup.remove(obj);
    }

    // Nombre de panneaux proportionnel à la surface
    const panelCount = Math.max(2, Math.min(18, Math.round(this.surfaceM2 / 6)));
    const cols = Math.min(6, Math.ceil(Math.sqrt(panelCount * 1.5)));
    const rows = Math.ceil(panelCount / cols);

    const panelGeo = new THREE.BoxGeometry(0.68, 0.04, 1.05);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1A365D,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0A2540,
      emissiveIntensity: 0.3
    });

    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.9,
      roughness: 0.3
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r * cols + c >= panelCount) break;

        const pMesh = new THREE.Mesh(panelGeo, panelMat);
        const x = (c - (cols - 1) / 2) * 0.74;
        const z = (r - (rows - 1) / 2) * 1.15;

        pMesh.position.set(x, 0.3, z);
        pMesh.rotation.x = -Math.PI / 6; // Inclinaison 30° idéale en Tunisie

        if (this.orientation === 'EST') pMesh.rotation.y = Math.PI / 8;
        else if (this.orientation === 'OUEST') pMesh.rotation.y = -Math.PI / 8;
        else pMesh.rotation.y = 0;

        this.panelsGroup.add(pMesh);
      }
    }
  }

  private buildEnergyParticles(): void {
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = Math.random() * 2 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xFFB703,
      size: 0.08,
      transparent: true,
      opacity: 0.75
    });

    this.particlesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.particlesMesh);
  }

  private animate(): void {
    if (this.panelsGroup) {
      this.panelsGroup.rotation.y += 0.003;
    }

    if (this.particlesMesh) {
      const positions = this.particlesMesh.geometry.attributes['position'].array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.015;
        if (positions[i] < 0.2) {
          positions[i] = 2.4;
        }
      }
      this.particlesMesh.geometry.attributes['position'].needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.animate.bind(this));
  }
}
