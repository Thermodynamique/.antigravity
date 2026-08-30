"use client";

/**
 * ThreeDGraph — Composant d'exploration 3D du graphe de pensées.
 * Utilise react-force-graph-3d (WebGL / Three.js) pour créer un univers
 * où les nœuds flottent librement dans l'espace et sont reliés par des lignes lumineuses.
 *
 * Quand l'utilisateur double-clique sur un nœud en 3D, on repasse en mode 2D
 * et on zoome directement sur ce nœud dans ReactFlow.
 */

import { useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useCanvas } from "@/contexts/CanvasContext";
import * as THREE from "three";

// Import dynamique sans SSR (Three.js ne peut pas tourner côté serveur)
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-neutral-500 text-sm animate-pulse">Chargement de l'univers 3D...</div>
        </div>
    ),
});

// Couleurs par catégorie de nœud
const CATEGORY_COLORS: Record<string, string> = {
    root: "#3b82f6",       // Bleu vif
    exploration: "#a3a3a3", // Gris neutre
    hypothesis: "#a855f7",  // Violet
    decision: "#22c55e",    // Vert
    action: "#f97316",      // Orange
    note: "#eab308",        // Jaune
    document: "#06b6d4",    // Cyan
};

interface ThreeDGraphProps {
    onNodeFocus: (nodeId: string) => void;
}

export function ThreeDGraph({ onNodeFocus }: ThreeDGraphProps) {
    const { nodes, edges } = useCanvas();
    const fgRef = useRef<any>(null);

    // Convertir les nœuds ReactFlow en format ForceGraph3D
    const graphData = useMemo(() => {
        const fgNodes = nodes.map((node) => {
            const category = node.id === "root" ? "root"
                           : node.data?.isDocument ? "document"
                           : (node.data?.category as string) || "exploration";

            return {
                id: node.id,
                name: (node.data?.label as string) || "Sans titre",
                category,
                color: CATEGORY_COLORS[category] || CATEGORY_COLORS.exploration,
                messageCount: (node.data?.messages as any[])?.length || 0,
            };
        });

        const fgLinks = edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
        }));

        return { nodes: fgNodes, links: fgLinks };
    }, [nodes, edges]);

    // Gérer le double-clic : repasser en 2D et centrer sur le nœud
    const handleNodeClick = useCallback((node: any) => {
        if (node?.id) {
            // Petit zoom caméra vers le nœud avant de basculer
            const distance = 120;
            const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);

            if (fgRef.current) {
                fgRef.current.cameraPosition(
                    { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
                    node,
                    800
                );
            }

            // Après l'animation caméra, basculer vers le mode 2D
            setTimeout(() => {
                onNodeFocus(node.id);
            }, 900);
        }
    }, [onNodeFocus]);

    // Rendu personnalisé des nœuds : sphères lumineuses avec halo
    const nodeThreeObject = useCallback((node: any) => {
        const group = new THREE.Group();

        // Sphère principale
        const sphereGeometry = new THREE.SphereGeometry(
            node.id === "root" ? 8 : (node.category === "document" ? 6 : 4),
            32, 32
        );
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: node.color,
            emissive: node.color,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);

        // Halo lumineux autour du nœud
        const haloGeometry = new THREE.SphereGeometry(
            node.id === "root" ? 12 : (node.category === "document" ? 9 : 6),
            16, 16
        );
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: node.color,
            transparent: true,
            opacity: 0.08,
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        group.add(halo);

        // Label texte (sprite 2D)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = 256;
        canvas.height = 64;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fond semi-transparent
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.roundRect(0, 8, canvas.width, 48, 12);
        ctx.fill();

        // Texte
        ctx.font = "bold 22px Inter, Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = (node.name as string).length > 20
            ? (node.name as string).slice(0, 18) + "…"
            : node.name;
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.85
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 7.5, 1);
        sprite.position.set(0, node.id === "root" ? 14 : 10, 0);
        group.add(sprite);

        return group;
    }, []);

    return (
        <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            backgroundColor="#000000"
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.id === "root" ? 12 : (node.category === "document" ? 8 : 5)}
            nodeLabel={(node: any) => `${node.name} [${node.category}]`}
            nodeOpacity={0.95}
            nodeResolution={16}
            linkColor={() => "rgba(255, 255, 255, 0.2)"}
            linkWidth={1.5}
            linkOpacity={0.4}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={() => "#ffffff"}
            onNodeClick={handleNodeClick}
            enableNodeDrag={true}
            enableNavigationControls={true}
            showNavInfo={false}
            warmupTicks={50}
            cooldownTime={3000}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
        />
    );
}
