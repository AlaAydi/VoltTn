import { 
  Component, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  NgZone, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-hero-3d',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hero-3d-container" #container>
      <canvas #canvas3d class="webgl-canvas"></canvas>
    </div>
  `,
  styles: [`
    .hero-3d-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: auto;
    }
    .webgl-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class Hero3dComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private mainGroup = new THREE.Group();
  private turbines: THREE.Group[] = [];
  private sunMesh!: THREE.Mesh;

  private mouseX = 0;
  private mouseY = 0;
  private targetRotX = 0;
  private targetRotY = 0;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initThree();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initThree(): void {
    try {
      const width = this.containerRef.nativeElement.clientWidth || window.innerWidth;
      const height = this.containerRef.nativeElement.clientHeight || 550;

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      this.camera.position.set(0, 3.8, 10.5);
      this.camera.lookAt(0, 0.8, 0);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvasRef.nativeElement,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Éclairage aube chaleureux
      const ambientLight = new THREE.AmbientLight(0xFFF6E8, 1.3);
      this.scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xFFB703, 2.2);
      sunLight.position.set(6, 9, 6);
      this.scene.add(sunLight);

      const skySoftLight = new THREE.DirectionalLight(0x4CC9F0, 1.2);
      skySoftLight.position.set(-6, -2, -4);
      this.scene.add(skySoftLight);

      // Construction de la scène low-poly
      this.buildScene();
      this.scene.add(this.mainGroup);

      // Parallaxe
      window.addEventListener('mousemove', this.onMouseMove.bind(this));
      window.addEventListener('resize', this.onResize.bind(this));

      this.ngZone.runOutsideAngular(() => {
        this.animate();
      });
    } catch (e) {
      console.warn('Erreur Three.js Hero:', e);
    }
  }

  private buildScene(): void {
    // 1. Soleil doré lumineux en arrière-plan
    const sunGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xFFB703,
      emissive: 0xFB8500,
      emissiveIntensity: 0.85,
      roughness: 0.1
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(3.8, 4.2, -4.5);
    this.mainGroup.add(this.sunMesh);

    // Halo autour du soleil
    const glowGeo = new THREE.RingGeometry(1.45, 2.8, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFD166,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(this.sunMesh.position);
    glowMesh.position.z += 0.05;
    this.mainGroup.add(glowMesh);

    // 2. Collines douces pastel (lever de soleil)
    const hillMat1 = new THREE.MeshStandardMaterial({ color: 0xB7E4C7, roughness: 0.7 });
    const hillGeo1 = new THREE.CylinderGeometry(4.2, 5.0, 1.2, 32);
    const hill1 = new THREE.Mesh(hillGeo1, hillMat1);
    hill1.position.set(-1.8, -0.6, -1);
    this.mainGroup.add(hill1);

    const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x95D5B2, roughness: 0.7 });
    const hillGeo2 = new THREE.CylinderGeometry(3.5, 4.2, 1.0, 32);
    const hill2 = new THREE.Mesh(hillGeo2, hillMat2);
    hill2.position.set(2.4, -0.7, 0.5);
    this.mainGroup.add(hill2);

    // 3. Éoliennes qui tournent
    this.createTurbine(-2.2, 0, -0.5, 0.9);
    this.createTurbine(-0.8, 0, -1.8, 0.75);
    this.createTurbine(-3.5, -0.2, 0.8, 1.05);

    // 4. Panneaux Solaires inclinés
    this.createSolarField(1.6, 0.15, 0.8);
    this.createSolarField(2.6, 0.12, 1.4);

    // 5. Petite ville moderne pastel (Low-poly)
    this.createBuilding(0.2, 0, -0.4, 0.7, 1.6, 0.7, 0xFFFAF0, 0x4CC9F0);
    this.createBuilding(1.1, 0, -0.7, 0.8, 2.1, 0.8, 0xFFF8E7, 0xFFB703);
    this.createBuilding(-0.5, 0, 0.6, 0.6, 1.2, 0.6, 0xEBF7FA, 0x52B788);
    this.createBuilding(0.5, 0, 1.1, 0.7, 1.4, 0.7, 0xFFFCF5, 0x2A9DF4);
  }

  private createTurbine(x: number, y: number, z: number, scale: number): void {
    const turbine = new THREE.Group();
    turbine.position.set(x, y, z);
    turbine.scale.set(scale, scale, scale);

    // Mât blanc
    const mastGeo = new THREE.CylinderGeometry(0.04, 0.08, 2.4, 16);
    mastGeo.translate(0, 1.2, 0);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    turbine.add(mast);

    // Rotor & 3 Pales
    const rotor = new THREE.Group();
    rotor.position.set(0, 2.38, 0.08);

    const hubGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xFB8500 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    rotor.add(hub);

    for (let i = 0; i < 3; i++) {
      const bladeAngle = (i * Math.PI * 2) / 3;
      const bladeGeo = new THREE.ConeGeometry(0.065, 1.2, 8);
      bladeGeo.translate(0, 0.6, 0);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = bladeAngle;
      rotor.add(blade);
    }

    turbine.add(rotor);
    (turbine as any).userData = { rotor };
    this.turbines.push(turbine);
    this.mainGroup.add(turbine);
  }

  private createSolarField(x: number, y: number, z: number): void {
    const field = new THREE.Group();
    field.position.set(x, y, z);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const panelGeo = new THREE.BoxGeometry(0.48, 0.03, 0.32);
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x1F487E,
          metalness: 0.6,
          roughness: 0.2
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(col * 0.55, 0.12, row * 0.42);
        panel.rotation.x = -0.38; // Inclinaison optimale Tunisie ~30°
        field.add(panel);
      }
    }
    this.mainGroup.add(field);
  }

  private createBuilding(x: number, y: number, z: number, w: number, h: number, d: number, wallColor: number, roofColor: number): void {
    const bldg = new THREE.Group();
    bldg.position.set(x, y, z);

    // Corps du bâtiment
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    bodyGeo.translate(0, h / 2, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    bldg.add(body);

    // Toit terrasse coloré ou panneau
    const roofGeo = new THREE.BoxGeometry(w * 0.95, 0.08, d * 0.95);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, h + 0.04, 0);
    bldg.add(roof);

    // Petites fenêtres lumineuses stylisées
    for (let floor = 1; floor <= 3; floor++) {
      const winGeo = new THREE.BoxGeometry(w * 0.75, 0.12, d + 0.02);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x4CC9F0 });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, (h / 4) * floor, 0);
      bldg.add(win);
    }

    this.mainGroup.add(bldg);
  }

  private onMouseMove(e: MouseEvent): void {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetRotY = x * 0.18;
    this.targetRotX = -y * 0.12;
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
    // Rotation continue des pales d'éoliennes
    this.turbines.forEach(t => {
      const rotor = (t as any).userData?.rotor;
      if (rotor) {
        rotor.rotation.z += 0.035;
      }
    });

    // Légère pulsation du soleil
    if (this.sunMesh) {
      this.sunMesh.rotation.y += 0.003;
    }

    // Parallaxe souris douce
    this.mainGroup.rotation.y += (this.targetRotY - this.mainGroup.rotation.y) * 0.05;
    this.mainGroup.rotation.x += (this.targetRotX - this.mainGroup.rotation.x) * 0.05;

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  private cleanup(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
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
