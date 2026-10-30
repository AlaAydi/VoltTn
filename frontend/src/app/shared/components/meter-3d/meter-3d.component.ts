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
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

@Component({
  selector: 'app-meter-3d',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meter-3d-wrapper" #container>
      <canvas #canvas3d class="webgl-canvas"></canvas>
      
      @if (hasWebGlError) {
        <div class="meter-fallback">
          <div class="fallback-ring" [style.border-color]="getPowerColor()">
            <span class="fallback-kw">{{ powerKw | number:'1.2-2' }}</span>
            <span class="fallback-unit">kW</span>
          </div>
        </div>
      }

      <div class="meter-live-overlay">
        <div class="live-dot" [style.background-color]="getPowerColor()"></div>
        <span class="live-label">STEG Smart Meter</span>
        <span class="live-val">{{ powerKw | number:'1.2-2' }} kW</span>
      </div>
    </div>
  `,
  styles: [`
    .meter-3d-wrapper {
      position: relative;
      width: 100%;
      height: 320px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 235, 0.8) 100%);
      box-shadow: inset 0 2px 10px rgba(29, 53, 87, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .webgl-canvas {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
    }

    .meter-live-overlay {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 14px rgba(29, 53, 87, 0.08);
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      z-index: 2;
    }

    .live-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: pulseDot 2s infinite ease-in-out;
    }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }

    .live-val {
      color: var(--sun-amber);
      font-family: var(--font-title);
      font-weight: 800;
    }

    .meter-fallback {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fallback-ring {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 8px solid var(--sun-amber);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      box-shadow: var(--shadow-md);
    }

    .fallback-kw {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-main);
    }

    .fallback-unit {
      font-size: 14px;
      color: var(--text-muted);
    }
  `]
})
export class Meter3dComponent implements OnInit, OnDestroy, OnChanges {
  @Input() powerKw = 3.4;
  @Input() todayKwh = 14.8;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  hasWebGlError = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private animFrameId: number | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isVisible = true;

  private meterGroup = new THREE.Group();
  private needleMesh!: THREE.Mesh;
  private ringMesh!: THREE.Mesh;
  private particlesMesh!: THREE.Points;
  private targetNeedleAngle = 0;
  private currentNeedleAngle = 0;

  private mouseX = 0;
  private mouseY = 0;
  private targetRotX = 0;
  private targetRotY = 0;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.updateTargetAngle();
    this.initThree();
    this.setupIntersectionObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['powerKw']) {
      this.updateTargetAngle();
      this.updateColors();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  getPowerColor(): string {
    if (this.powerKw < 2.5) return '#52B788'; 
    if (this.powerKw < 4.8) return '#FFB703'; 
    return '#FF6B6B';
  }

  private updateTargetAngle(): void {
    const clamped = Math.max(0, Math.min(8, this.powerKw));
    const ratio = clamped / 8;
    this.targetNeedleAngle = -2.0 + (ratio * 4.0);
  }

  private updateColors(): void {
    if (!this.ringMesh) return;
    const colorHex = this.powerKw < 2.5 ? 0x52B788 : (this.powerKw < 4.8 ? 0xFFB703 : 0xFF6B6B);
    const ringMat = this.ringMesh.material as THREE.MeshStandardMaterial;
    if (ringMat) {
      ringMat.color.setHex(colorHex);
      ringMat.emissive.setHex(colorHex);
      ringMat.emissiveIntensity = 1.15; // Éclat néon électrique sous Bloom
    }
  }

  private initThree(): void {
    try {
      const width = this.containerRef.nativeElement.clientWidth || 320;
      const height = this.containerRef.nativeElement.clientHeight || 320;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 5.2);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvasRef.nativeElement,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;

      // Post-processing Bloom pour l'anneau néon connecté
      const renderScene = new RenderPass(this.scene, this.camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        1.1,  // Intensité de la lueur néon
        0.35, // Rayon
        0.65  // Seuil réactif
      );

      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderScene);
      this.composer.addPass(bloomPass);

      const ambientLight = new THREE.AmbientLight(0xFFF9F0, 1.4);
      this.scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xFFB703, 1.8);
      sunLight.position.set(4, 5, 4);
      this.scene.add(sunLight);

      const skyRimLight = new THREE.PointLight(0x4CC9F0, 2.0, 10);
      skyRimLight.position.set(-3, -2, 3);
      this.scene.add(skyRimLight);

      this.buildMeterMesh();
      this.scene.add(this.meterGroup);

      this.containerRef.nativeElement.addEventListener('mousemove', this.onMouseMove.bind(this));
      this.containerRef.nativeElement.addEventListener('mouseleave', this.onMouseLeave.bind(this));
      window.addEventListener('resize', this.onResize.bind(this));

      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });
    } catch (e) {
      console.warn('WebGL non supporté pour le compteur 3D, fallback actif.', e);
      this.hasWebGlError = true;
    }
  }

  private buildMeterMesh(): void {
    const baseGeo = new THREE.CylinderGeometry(1.7, 1.8, 0.35, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xFFFCF5,
      roughness: 0.25,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = Math.PI / 2;
    this.meterGroup.add(baseMesh);

    // Cadran intérieur en verre doux
    const dialGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 48);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0xFAFAFC,
      roughness: 0.3,
      metalness: 0.05
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.rotation.x = Math.PI / 2;
    dialMesh.position.z = 0.16;
    this.meterGroup.add(dialMesh);

    // Anneau néon lumineux (Torus) avec émissivité pour le bloom
    const ringGeo = new THREE.TorusGeometry(1.35, 0.065, 24, 64);
    const colorHex = this.powerKw < 2.5 ? 0x52B788 : (this.powerKw < 4.8 ? 0xFFB703 : 0xFF6B6B);
    const ringMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 1.15,
      roughness: 0.2
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.z = 0.22;
    this.meterGroup.add(this.ringMesh);

    // Graduation en arche
    for (let i = 0; i <= 8; i++) {
      const angle = -2.0 + (i / 8) * 4.0;
      const tickGeo = new THREE.BoxGeometry(0.04, i % 2 === 0 ? 0.16 : 0.09, 0.02);
      const tickMat = new THREE.MeshBasicMaterial({ color: 0x1D3557 });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.x = Math.sin(angle) * 1.15;
      tick.position.y = Math.cos(angle) * 1.15;
      tick.position.z = 0.23;
      tick.rotation.z = -angle;
      this.meterGroup.add(tick);
    }

    // Aiguille stylisée
    const needleGeo = new THREE.ConeGeometry(0.07, 1.05, 16);
    needleGeo.translate(0, 0.5, 0);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0x2A9DF4,
      emissive: 0x2A9DF4,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    this.needleMesh = new THREE.Mesh(needleGeo, needleMat);
    this.needleMesh.position.z = 0.25;
    this.meterGroup.add(this.needleMesh);

    // Pivot central doré
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 32);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xFB8500,
      metalness: 0.8,
      roughness: 0.2
    });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.z = 0.3;
    this.meterGroup.add(hubMesh);

    // Particules d'énergie flottantes douces
    const particleCount = 45;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const rad = 0.4 + Math.random() * 0.9;
      particlePositions[i] = Math.cos(theta) * rad;
      particlePositions[i + 1] = Math.sin(theta) * rad;
      particlePositions[i + 2] = 0.24 + Math.random() * 0.3;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xFFB703,
      size: 0.05,
      transparent: true,
      opacity: 0.75
    });
    this.particlesMesh = new THREE.Points(particleGeo, particleMat);
    this.meterGroup.add(this.particlesMesh);
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    this.targetRotY = x * 0.25;
    this.targetRotX = -y * 0.2;
  }

  private onMouseLeave(): void {
    this.targetRotX = 0;
    this.targetRotY = 0;
  }

  private onResize(): void {
    if (!this.renderer || !this.camera || !this.containerRef) return;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      if (this.composer) {
        this.composer.setSize(width, height);
      }
    }
  }

  private animate(): void {
    if (!this.isVisible) {
      this.animFrameId = requestAnimationFrame(this.animate.bind(this));
      return;
    }

    // Lissage de l'aiguille vers la puissance réelle
    this.currentNeedleAngle += (this.targetNeedleAngle - this.currentNeedleAngle) * 0.08;
    if (this.needleMesh) {
      this.needleMesh.rotation.z = -this.currentNeedleAngle;
    }

    // Rotation douce des particules d'énergie
    if (this.particlesMesh) {
      this.particlesMesh.rotation.z += 0.008;
    }

    // Parallaxe souris douce
    this.meterGroup.rotation.x += (this.targetRotX - this.meterGroup.rotation.x) * 0.08;
    this.meterGroup.rotation.y += (this.targetRotY - this.meterGroup.rotation.y) * 0.08;

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.animFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      this.intersectionObserver.observe(this.containerRef.nativeElement);
    }
  }

  private cleanup(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    window.removeEventListener('resize', this.onResize.bind(this));

    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }

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
