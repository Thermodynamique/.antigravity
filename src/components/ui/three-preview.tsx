"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface ThreePreviewProps {
  type: "3d-model" | "physics-sim" | "molecule" | "neural-graph";
  isKilled?: boolean;
}

export function ThreePreview({ type, isKilled = false }: ThreePreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || isKilled) return;

    // Track resources for memory cleanup
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // --- 1. SETUP DE SCÈNE ---
    const scene = new THREE.Scene();

    // Rendre le fond transparent pour correspondre au design existant
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 400; // Hauteur par défaut si flex
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimisation performance

    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- 2. LUMIÈRES ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 2);
    scene.add(directionalLight);

    // --- 3. OBJETS SELON LE TYPE ---
    const group = new THREE.Group();
    scene.add(group);

    if (type === "molecule") {
      const sphereGeo = new THREE.SphereGeometry(0.4, 32, 32);
      const material1 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });
      const material2 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      geometries.push(sphereGeo);
      materials.push(material1, material2);

      const center = new THREE.Mesh(sphereGeo, material1);
      group.add(center);

      const nodeGeo = new THREE.SphereGeometry(0.2, 16, 16);
      geometries.push(nodeGeo);

      const positions = [[1.2, 0, 0], [-0.6, 1, 0.5], [-0.6, -1, -0.5]];
      positions.forEach(pos => {
        const node = new THREE.Mesh(nodeGeo, material2);
        node.position.set(pos[0], pos[1], pos[2]);
        group.add(node);

        const distance = center.position.distanceTo(node.position);
        const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
        const cylMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        geometries.push(cylGeo);
        materials.push(cylMat);

        const cylinder = new THREE.Mesh(cylGeo, cylMat);
        const midpoint = new THREE.Vector3().addVectors(center.position, node.position).multiplyScalar(0.5);
        cylinder.position.copy(midpoint);
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), node.position.clone().normalize());
        group.add(cylinder);
      });

    } else if (type === "neural-graph" || type === "physics-sim") {
      const geo = new THREE.IcosahedronGeometry(1.5, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: type === "neural-graph" ? 0xa855f7 : 0xf97316,
        wireframe: true
      });
      geometries.push(geo);
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
    } else {
      const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const mat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 });
      geometries.push(geo);
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
    }

    // --- 4. ANIMATION & OBSERVER ---
    let animationId: number;
    let isVisible = false;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (isVisible) {
          group.rotation.x += 0.005;
          group.rotation.y += 0.005;
          controls.update();
          renderer.render(scene, camera);
      }
    };
    animate();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
        });
    }, { threshold: 0.1 });

    if (mountRef.current) {
        observer.observe(mountRef.current);
    }

    // --- 5. RESIZE HANDLER ---
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 400;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // --- 6. CLEANUP COMPLET (VRAM & RAM) ---
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);

      controls.dispose();

      // Libération explicite des géométries et matériaux de la mémoire GPU
      geometries.forEach(g => g.dispose());
      materials.forEach(m => {
        m.dispose();
        if ('map' in m && (m as any).map) (m as any).map.dispose();
      });

      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        observer.unobserve(mountRef.current);
        observer.disconnect();
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
      group.clear();
    };
  }, [type, isKilled]);

  if (isKilled) return null;

  return <div ref={mountRef} className="w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing" />;
}
