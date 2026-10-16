import { 
  Component, 
  ElementRef, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  NgZone, 
  OnChanges, 
  SimpleChanges,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { Governorate } from '@models/governorate.model';

@Component({
  selector: 'app-tunisia-map-3d',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tunisia-map-wrapper" #container>
      <canvas #canvas3d class="webgl-canvas"></canvas>

      <div class="map-controls">
        <button class="btn-ctrl" (click)="resetCamera()" title="Réinitialiser la vue">
          <span class="material-symbols-rounded">center_focus_strong</span>
        </button>
        <button class="btn-ctrl" (click)="toggleAutoRotate()" [class.active]="isAutoRotating" title="Rotation automatique">
          <span class="material-symbols-rounded">sync</span>
        </button>
      </div>

      <div class="map-legend">
        <div class="legend-item">
          <span class="legend-bullet bg-normal"></span>
          <span>Normal (&lt; 75%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-bullet bg-elevee"></span>
          <span>Élevée (75-90%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-bullet bg-surcharge"></span>
          <span>Surcharge (&gt; 90%)</span>
        </div>
      </div>

      @if (hoveredGov()) {
        <div 
          class="gov-tooltip glass-card animate-float"
          [style.left.px]="tooltipPos().x"
          [style.top.px]="tooltipPos().y"
        >
          <div class="tooltip-header">
            <div>
              <div class="tooltip-title">{{ hoveredGov()?.name }}</div>
              <div class="tooltip-ar">{{ hoveredGov()?.nameAr }}</div>
            </div>
            <span class="badge" [ngClass]="'badge-' + hoveredGov()?.status?.toLowerCase()">
              {{ hoveredGov()?.status }}
            </span>
          </div>
          <div class="tooltip-body">
            <div class="tooltip-row">
              <span class="label">Charge actuelle :</span>
              <span class="val">{{ hoveredGov()?.currentLoadMw }} MW</span>
            </div>
            <div class="tooltip-row">
              <span class="label">Capacité max :</span>
              <span class="val">{{ hoveredGov()?.capacityMw }} MW</span>
            </div>
            <div class="tooltip-row">
              <span class="label">Taux d'utilisation :</span>
              <span class="val highlight">
                {{ getLoadPercent(hoveredGov()!) }}%
              </span>
            </div>
            <div class="tooltip-row">
              <span class="label">Température :</span>
              <span class="val">{{ hoveredGov()?.temperatureC }} °C</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tunisia-map-wrapper {
      position: relative;
      width: 100%;
      height: 480px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.7) 100%);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-glass);
    }

    .webgl-canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
      outline: none;
      &:active {
        cursor: grabbing;
      }
    }

    .map-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 5;
    }

    .btn-ctrl {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(29, 53, 87, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-main);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-fast);

      &:hover {
        background: #FFFFFF;
        color: var(--sun-amber);
        transform: scale(1.08);
      }
      &.active {
        background: var(--sun-gold);
        color: #FFFFFF;
      }
    }

    .map-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: var(--shadow-sm);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-main);
      z-index: 5;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      &.bg-normal { background: var(--nature-green); }
      &.bg-elevee { background: var(--sun-gold); }
      &.bg-surcharge { background: var(--alert-coral); }
    }

    .gov-tooltip {
      position: absolute;
      pointer-events: none;
      width: 220px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(255, 183, 3, 0.4);
      box-shadow: 0 12px 28px rgba(29, 53, 87, 0.14);
      transform: translate(-50%, -115%);
      z-index: 10;
      transition: opacity 0.15s ease-out;
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      border-bottom: 1px solid rgba(29, 53, 87, 0.08);
      padding-bottom: 6px;
    }

    .tooltip-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text-main);
    }

    .tooltip-ar {
      font-size: 12px;
      color: var(--text-muted);
      direction: rtl;
    }

    .badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      &.badge-normal { background: var(--nature-light); color: var(--nature-green); }
      &.badge-elevee { background: var(--sun-light); color: #B36800; }
      &.badge-surcharge { background: var(--alert-coral-light); color: var(--alert-coral); }
    }

    .tooltip-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      .val {
        font-weight: 700;
        color: var(--text-main);
        &.highlight { color: var(--sun-amber); }
      }
    }
  `]
})
export class TunisiaMap3dComponent implements OnInit, OnDestroy, OnChanges {
  @Input() governorates: Governorate[] = [];
  @Output() governorateSelected = new EventEmitter<Governorate>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  hoveredGov = signal<Governorate | null>(null);
  tooltipPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  isAutoRotating = true;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private mapGroup = new THREE.Group();
  private meshMap = new Map<THREE.Mesh, Governorate>();
  private highlightedMesh: THREE.Mesh | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraRotation = { x: 0.65, y: -0.2 };
  private cameraDistance = 11.5;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['governorates'] && this.scene) {
      this.rebuildGovernorates();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  getLoadPercent(gov: Governorate): number {
    return Math.round((gov.currentLoadMw / gov.capacityMw) * 100);
  }

  resetCamera(): void {
    this.cameraRotation = { x: 0.65, y: -0.2 };
    this.cameraDistance = 11.5;
  }

  toggleAutoRotate(): void {
    this.isAutoRotating = !this.isAutoRotating;
  }

  private initThree(): void {
    try {
      const width = this.containerRef.nativeElement.clientWidth || 600;
      const height = this.containerRef.nativeElement.clientHeight || 480;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.updateCameraTransform();

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvasRef.nativeElement,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ambientLight = new THREE.AmbientLight(0xFFF9EE, 1.4);
      this.scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xFFB703, 1.9);
      sunLight.position.set(5, 12, 8);
      this.scene.add(sunLight);

      const seaReflection = new THREE.DirectionalLight(0x4CC9F0, 1.2);
      seaReflection.position.set(-6, -4, -6);
      this.scene.add(seaReflection);

      this.buildPedestal();

      this.scene.add(this.mapGroup);
      this.rebuildGovernorates();

      this.setupEventListeners();

      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });
    } catch (e) {
      console.error('Erreur initialisation Three.js carte 3D Tunisie:', e);
    }
  }

  private buildPedestal(): void {
    const pedestalGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.2, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xFFFCF5,
      roughness: 0.35,
      metalness: 0.05
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.15;
    this.scene.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(5.4, 0.04, 16, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x4CC9F0,
      emissive: 0x4CC9F0,
      emissiveIntensity: 0.4
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.12;
    this.scene.add(ring);
  }

  private rebuildGovernorates(): void {
    while (this.mapGroup.children.length > 0) {
      const obj = this.mapGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      this.mapGroup.remove(obj);
    }
    this.meshMap.clear();

    if (!this.governorates || this.governorates.length === 0) return;
    const centerLat = 35.3;
    const centerLng = 9.8;
    const scale = 1.35; 

    this.governorates.forEach(gov => {
      const x = (gov.lng - centerLng) * scale;
      const z = -(gov.lat - centerLat) * scale * 1.15; 

      const usageRatio = gov.currentLoadMw / gov.capacityMw;
      const height = Math.max(0.35, usageRatio * 1.8);


      let colorHex = 0x52B788; 
      if (gov.status === 'ELEVEE' || usageRatio > 0.78) {
        colorHex = 0xFFB703; 
      }
      if (gov.status === 'SURCHARGE' || usageRatio > 0.90) {
        colorHex = 0xFF6B6B; 
      }

      const columnGeo = new THREE.CylinderGeometry(0.24, 0.28, height, 7);
      columnGeo.translate(0, height / 2, 0);

      const columnMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(columnGeo, columnMat);
      mesh.position.set(x, 0, z);

      (mesh as any).userData = { 
        gov, 
        baseY: 0, 
        height, 
        originalColor: colorHex 
      };
      this.meshMap.set(mesh, gov);
      this.mapGroup.add(mesh);
    });
  }

  private setupEventListeners(): void {
    const el = this.containerRef.nativeElement;

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this.tooltipPos.set({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.cameraRotation.y += deltaX * 0.008;
        this.cameraRotation.x = Math.max(0.2, Math.min(1.3, this.cameraRotation.x + deltaY * 0.008));
        this.updateCameraTransform();
      }
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    el.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.cameraDistance = Math.max(6, Math.min(18, this.cameraDistance + e.deltaY * 0.01));
      this.updateCameraTransform();
    }, { passive: false });

    el.addEventListener('click', () => {
      if (this.highlightedMesh) {
        const gov = this.meshMap.get(this.highlightedMesh);
        if (gov) {
          this.governorateSelected.emit(gov);
        }
      }
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private updateCameraTransform(): void {
    const cosX = Math.cos(this.cameraRotation.x);
    const sinX = Math.sin(this.cameraRotation.x);
    const cosY = Math.cos(this.cameraRotation.y);
    const sinY = Math.sin(this.cameraRotation.y);

    this.camera.position.x = this.cameraDistance * sinY * cosX;
    this.camera.position.y = this.cameraDistance * sinX;
    this.camera.position.z = this.cameraDistance * cosY * cosX;
    this.camera.lookAt(0, 0.4, 0);
  }

  private onResize(): void {
    if (!this.renderer || !this.camera || !this.containerRef) return;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  private animate(): void {
    // Rotation automatique douce si activée et non en glissement manuel
    if (this.isAutoRotating && !this.isDragging) {
      this.cameraRotation.y += 0.0025;
      this.updateCameraTransform();
    }

    // Raycasting pour détecter le gouvernorat survolé
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.mapGroup.children);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      if (this.highlightedMesh !== mesh) {
        this.resetHighlight();
        this.highlightMesh(mesh);
      }
    } else {
      if (this.highlightedMesh) {
        this.resetHighlight();
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  private highlightMesh(mesh: THREE.Mesh): void {
    this.highlightedMesh = mesh;
    const gov = this.meshMap.get(mesh);
    if (gov) {
      this.hoveredGov.set(gov);
    }
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = 0.75;
      mesh.scale.set(1.22, 1.15, 1.22);
    }
  }

  private resetHighlight(): void {
    if (this.highlightedMesh) {
      const mat = this.highlightedMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.2;
      }
      this.highlightedMesh.scale.set(1, 1, 1);
      this.highlightedMesh = null;
      this.hoveredGov.set(null);
    }
  }

  private cleanup(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.onResize.bind(this));

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
