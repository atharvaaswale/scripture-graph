import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Verse, Edge, RelationType, NodePosition } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, X, Trash2, Check } from 'lucide-react';

interface GraphVisualizationProps {
  verses: Verse[];
  edges: Edge[];
  onSelectVerse: (verse: Verse) => void;
  selectedVerseId: string | null;
  activeChainVerseIds?: string[];
  isCuratorMode?: boolean;
  onAddEdge?: (edge: Edge) => void;
  onUpdateEdge?: (from: string, to: string, updatedWhy: string) => void;
  onDeleteEdge?: (from: string, to: string) => void;
  activeScriptures: Set<string>;
  activeRelations?: Set<RelationType>;
  numeralMode?: 'devanagari' | 'latin';
  nodePositions?: Record<string, NodePosition>;
  onSaveNodePosition?: (id: string, position: NodePosition) => void;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  verse: Verse;
  radius: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  relation: RelationType;
  why: string;
}

// Sophisticated celestial themes
export const SCRIPTURE_THEMES: Record<string, { core: string; halo: string; label: string }> = {
  MS: { core: '#f43f5e', halo: 'rgba(244, 63, 94, 0.3)', label: 'Manache Shlok' },
  DB: { core: '#f59e0b', halo: 'rgba(245, 158, 11, 0.3)', label: 'Dasbodh' },
  BG: { core: '#818cf8', halo: 'rgba(129, 140, 248, 0.3)', label: 'Bhagavad Gita' },
  BP: { core: '#eab308', halo: 'rgba(234, 179, 8, 0.3)', label: 'Bhagavata' },
};

// Relation curves & colors matching the user screenshot
export const RELATION_STYLES: Record<
  RelationType,
  { color: string; dash: string; width: number; label: string }
> = {
  extends: { color: '#fb923c', dash: 'none', width: 1.6, label: 'extends' },     // Warm amber curve
  supports: { color: '#fef08a', dash: 'none', width: 1.8, label: 'supports' },    // Luminous cream curve
  contrasts: { color: '#fb7185', dash: '4,4', width: 1.6, label: 'contrasts' },   // Dashed rose curve
  restates: { color: '#c084fc', dash: '2,2', width: 1.4, label: 'restates' },
  requires: { color: '#fbbf24', dash: 'none', width: 1.8, label: 'requires' },
  exemplifies: { color: '#f472b6', dash: '5,3', width: 1.4, label: 'exemplifies' },
};

const ALL_RELATIONS: RelationType[] = [
  'extends',
  'supports',
  'contrasts',
  'restates',
  'requires',
  'exemplifies',
];

// Helper: Get node label matching image UI (Devanagari or English numbers)
export function getNodeDisplay(
  verse: Verse,
  mode: 'devanagari' | 'latin' | string = 'devanagari'
): { label: string; isDevanagari: boolean; subtitle: string } {
  const shortId = verse.id.replace(/^[A-Z]+-/, '');

  if (mode === 'devanagari') {
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const dev = shortId.replace(/\d/g, (d) => devanagariDigits[parseInt(d, 10)]);
    return { label: dev, isDevanagari: true, subtitle: verse.display_ref };
  }

  // English / Latin numbers:
  return { label: shortId, isDevanagari: false, subtitle: verse.display_ref };
}

// Helper: Determine node 3D sphere style matching image UI
export function getNodeSphereStyle(verse: Verse, isSelected: boolean) {
  // DB-6.1.16 or Selected: Large golden luminous sphere with pale cream center and bright golden ring
  if (verse.id === 'DB-6.1.16' || isSelected) {
    return {
      gradientId: 'sphere-db-featured',
      haloId: 'halo-db-featured',
      ringColor: '#fde047',
      ringWidth: 2.2,
      textColor: '#1c1917',
      radius: 23,
    };
  }

  // MS-189: Dark crimson ruby orb with crisp white text as shown in image.png
  if (verse.id === 'MS-189' || verse.theme_tags?.includes('moksha')) {
    return {
      gradientId: 'sphere-ms-crimson',
      haloId: 'halo-ms-crimson',
      ringColor: '#e11d48',
      ringWidth: 1.6,
      textColor: '#ffffff',
      radius: 20,
    };
  }

  // Manache Shlok (MS-178, MS-179): Soft pink pearl sphere
  if (verse.scripture === 'MS') {
    return {
      gradientId: 'sphere-ms-rose',
      haloId: 'halo-ms-rose',
      ringColor: '#fb7185',
      ringWidth: 1.5,
      textColor: '#1e1b4b',
      radius: 20,
    };
  }

  // Dasbodh (DB-5.1.40, DB-4.4.5, DB-6.2.13): Warm golden amber sphere
  if (verse.scripture === 'DB') {
    return {
      gradientId: 'sphere-db-amber',
      haloId: 'halo-db-amber',
      ringColor: '#d97706',
      ringWidth: 1.5,
      textColor: '#1c1917',
      radius: 20,
    };
  }

  // Bhagavad Gita (BG): Celestial indigo sphere
  if (verse.scripture === 'BG') {
    return {
      gradientId: 'sphere-bg-indigo',
      haloId: 'halo-bg-indigo',
      ringColor: '#818cf8',
      ringWidth: 1.5,
      textColor: '#ffffff',
      radius: 20,
    };
  }

  // Bhagavata (BP): Subtle gold sphere
  return {
    gradientId: 'sphere-bp-gold',
    haloId: 'halo-bp-gold',
    ringColor: '#eab308',
    ringWidth: 1.5,
    textColor: '#1c1917',
    radius: 20,
  };
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  verses,
  edges,
  onSelectVerse,
  selectedVerseId,
  activeChainVerseIds,
  isCuratorMode = true,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  activeScriptures,
  activeRelations,
  numeralMode = 'devanagari',
  nodePositions,
  onSaveNodePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const isInitializedRef = useRef(false);
  const dragJustEndedRef = useRef(false);
  const onSaveNodePositionRef = useRef(onSaveNodePosition);
  onSaveNodePositionRef.current = onSaveNodePosition;

  // Screen-space cursor tracking & spotlight (Google Stitch style)
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 430,
    y: 390,
    visible: true,
  });

  // Relation picker popup on connection release
  const [relationPicker, setRelationPicker] = useState<{
    fromId: string;
    toId: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Edge annotation / inspect popup
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [editingWhy, setEditingWhy] = useState('');

  // Hovered edge for subtle tooltip
  const [hoveredEdge, setHoveredEdge] = useState<{
    edge: Edge;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Filtered dataset
  const filteredVerses = useMemo(() => {
    return verses.filter((v) => activeScriptures.has(v.scripture));
  }, [verses, activeScriptures]);

  const filteredVerseIdSet = useMemo(() => {
    return new Set(filteredVerses.map((v) => v.id));
  }, [filteredVerses]);

  const filteredEdges = useMemo(() => {
    return edges.filter(
      (e) =>
        (!activeRelations || activeRelations.has(e.relation)) &&
        filteredVerseIdSet.has(e.from) &&
        filteredVerseIdSet.has(e.to)
    );
  }, [edges, activeRelations, filteredVerseIdSet]);

  // Stable key: only changes when actual verses or edges are added/removed/filtered
  const structureKey = useMemo(() => {
    const vKey = filteredVerses.map((v) => v.id).sort().join(',');
    const eKey = filteredEdges.map((e) => `${e.from}->${e.to}:${e.relation}`).sort().join(',');
    return `${vKey}::${eKey}`;
  }, [filteredVerses, filteredEdges]);

  // Keep simulation nodes cache
  const nodesRef = useRef<GraphNode[]>([]);
  const targetPosMapRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Selection refs to allow event listeners without restarting force simulation
  const selectedVerseIdRef = useRef(selectedVerseId);
  selectedVerseIdRef.current = selectedVerseId;

  const activeChainVerseIdsRef = useRef(activeChainVerseIds);
  activeChainVerseIdsRef.current = activeChainVerseIds;

  // Track mouse coordinates for Google Stitch flashlight effect (DESKTOP ONLY)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Disable highlighted cursor on mobile/touch screens
    if (
      e.pointerType === 'touch' ||
      (typeof window !== 'undefined' && (
        window.innerWidth < 768 ||
        window.matchMedia('(pointer: coarse)').matches
      ))
    ) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Zero-lag direct DOM update for mask circle & cursor tracker
    const maskCircle = document.getElementById('spotlight-mask-circle');
    if (maskCircle) {
      maskCircle.setAttribute('cx', String(x));
      maskCircle.setAttribute('cy', String(y));
    }
    const tracker = document.getElementById('starlight-cursor-tracker');
    if (tracker) {
      tracker.setAttribute('transform', `translate(${x}, ${y})`);
      tracker.setAttribute('opacity', '1');
    }

    setPointerPos({
      x,
      y,
      visible: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    const tracker = document.getElementById('starlight-cursor-tracker');
    if (tracker) {
      tracker.setAttribute('opacity', '0.45');
    }
    setPointerPos((prev) => ({ ...prev, visible: false }));
  }, []);

  // Helper: calculate curved bezier path between node coordinates
  const getCurvedPath = useCallback((d: any) => {
    const sx = typeof d.source === 'object' ? (d.source.x ?? 0) : 0;
    const sy = typeof d.source === 'object' ? (d.source.y ?? 0) : 0;
    const tx = typeof d.target === 'object' ? (d.target.x ?? 0) : 0;
    const ty = typeof d.target === 'object' ? (d.target.y ?? 0) : 0;

    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return `M${sx},${sy} L${tx},${ty}`;

    const curvature = 0.12;
    const mx = (sx + tx) / 2 - (dy / dist) * (dist * curvature);
    const my = (sy + ty) / 2 + (dx / dist) * (dist * curvature);

    return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
  }, []);

  // 1. MAIN GRAPH INITIALIZATION
  // Runs only when verses/edges change, NOT on node click selection!
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // --- 1. DENSE STATIC GRID PATTERNS (Screen-Space, 2px dots separated by 10px) ---
    // A. Dim Charcoal-Gray Dots (Uniform dense static background matrix across viewport)
    const dimPattern = defs
      .append('pattern')
      .attr('id', 'static-dim-dots')
      .attr('width', 10)
      .attr('height', 10)
      .attr('patternUnits', 'userSpaceOnUse');

    dimPattern
      .append('circle')
      .attr('cx', 5)
      .attr('cy', 5)
      .attr('r', 1)
      .attr('fill', '#384152')
      .attr('opacity', 0.65);

    // B. Warm Starlight-Gold Dots (Illuminated dots under cursor spotlight)
    const goldPattern = defs
      .append('pattern')
      .attr('id', 'static-gold-dots')
      .attr('width', 10)
      .attr('height', 10)
      .attr('patternUnits', 'userSpaceOnUse');

    goldPattern
      .append('circle')
      .attr('cx', 5)
      .attr('cy', 5)
      .attr('r', 1.25)
      .attr('fill', '#fde047')
      .attr('opacity', 0.95);

    // C. Radial Gradient for Cursor Spotlight Mask (within defined 80px radius)
    const spotlightGrad = defs
      .append('radialGradient')
      .attr('id', 'cursor-spotlight-radial')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    spotlightGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', 1);
    spotlightGrad.append('stop').attr('offset', '45%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.88);
    spotlightGrad.append('stop').attr('offset', '75%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.3);
    spotlightGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ffffff').attr('stop-opacity', 0);

    // D. Cursor Spotlight Mask (Reveals gold dots within 80px of cursor; void stays dark)
    const mask = defs
      .append('mask')
      .attr('id', 'cursor-spotlight-mask')
      .attr('maskUnits', 'userSpaceOnUse');

    mask
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#000000');

    const initialCursorX = pointerPos.x || Math.round(width * 0.42);
    const initialCursorY = pointerPos.y || Math.round(height * 0.54);

    mask
      .append('circle')
      .attr('id', 'spotlight-mask-circle')
      .attr('cx', initialCursorX)
      .attr('cy', initialCursorY)
      .attr('r', 80)
      .attr('fill', 'url(#cursor-spotlight-radial)');

    // --- 2. 3D SPHERE RADIAL GRADIENTS (IMAGE.PNG EXACT REPLICA) ---
    // A. DB Featured (६.१.१६): Pale creamy yellow center with golden rim
    const gradDbFeatured = defs
      .append('radialGradient')
      .attr('id', 'sphere-db-featured')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradDbFeatured.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    gradDbFeatured.append('stop').attr('offset', '25%').attr('stop-color', '#fef9c3');
    gradDbFeatured.append('stop').attr('offset', '65%').attr('stop-color', '#fef08a');
    gradDbFeatured.append('stop').attr('offset', '90%').attr('stop-color', '#fde047');
    gradDbFeatured.append('stop').attr('offset', '100%').attr('stop-color', '#eab308');

    const haloDbFeatured = defs
      .append('radialGradient')
      .attr('id', 'halo-db-featured')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloDbFeatured.append('stop').attr('offset', '0%').attr('stop-color', '#fef08a').attr('stop-opacity', 0.65);
    haloDbFeatured.append('stop').attr('offset', '45%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.3);
    haloDbFeatured.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0);

    // B. MS Rose (178, 179): Soft pink pearl sphere
    const gradMsRose = defs
      .append('radialGradient')
      .attr('id', 'sphere-ms-rose')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradMsRose.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    gradMsRose.append('stop').attr('offset', '20%').attr('stop-color', '#fff1f2');
    gradMsRose.append('stop').attr('offset', '60%').attr('stop-color', '#fbcfe8');
    gradMsRose.append('stop').attr('offset', '90%').attr('stop-color', '#f472b6');
    gradMsRose.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48');

    const haloMsRose = defs
      .append('radialGradient')
      .attr('id', 'halo-ms-rose')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloMsRose.append('stop').attr('offset', '0%').attr('stop-color', '#fda4af').attr('stop-opacity', 0.55);
    haloMsRose.append('stop').attr('offset', '50%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.22);
    haloMsRose.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0);

    // C. MS Crimson (189): Dark crimson ruby orb
    const gradMsCrimson = defs
      .append('radialGradient')
      .attr('id', 'sphere-ms-crimson')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradMsCrimson.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e');
    gradMsCrimson.append('stop').attr('offset', '30%').attr('stop-color', '#be123c');
    gradMsCrimson.append('stop').attr('offset', '70%').attr('stop-color', '#881337');
    gradMsCrimson.append('stop').attr('offset', '100%').attr('stop-color', '#4c0519');

    const haloMsCrimson = defs
      .append('radialGradient')
      .attr('id', 'halo-ms-crimson')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloMsCrimson.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.6);
    haloMsCrimson.append('stop').attr('offset', '50%').attr('stop-color', '#9f1239').attr('stop-opacity', 0.25);
    haloMsCrimson.append('stop').attr('offset', '100%').attr('stop-color', '#4c0519').attr('stop-opacity', 0);

    // D. DB Amber (5.1.40): Warm golden amber sphere
    const gradDbAmber = defs
      .append('radialGradient')
      .attr('id', 'sphere-db-amber')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradDbAmber.append('stop').attr('offset', '0%').attr('stop-color', '#fef9c3');
    gradDbAmber.append('stop').attr('offset', '30%').attr('stop-color', '#fef08a');
    gradDbAmber.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b');
    gradDbAmber.append('stop').attr('offset', '100%').attr('stop-color', '#b45309');

    const haloDbAmber = defs
      .append('radialGradient')
      .attr('id', 'halo-db-amber')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloDbAmber.append('stop').attr('offset', '0%').attr('stop-color', '#fde68a').attr('stop-opacity', 0.5);
    haloDbAmber.append('stop').attr('offset', '50%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.22);
    haloDbAmber.append('stop').attr('offset', '100%').attr('stop-color', '#b45309').attr('stop-opacity', 0);

    // E. BG Indigo: Celestial indigo sphere
    const gradBgIndigo = defs
      .append('radialGradient')
      .attr('id', 'sphere-bg-indigo')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradBgIndigo.append('stop').attr('offset', '0%').attr('stop-color', '#e0e7ff');
    gradBgIndigo.append('stop').attr('offset', '35%').attr('stop-color', '#a5b4fc');
    gradBgIndigo.append('stop').attr('offset', '75%').attr('stop-color', '#6366f1');
    gradBgIndigo.append('stop').attr('offset', '100%').attr('stop-color', '#3730a3');

    const haloBgIndigo = defs
      .append('radialGradient')
      .attr('id', 'halo-bg-indigo')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloBgIndigo.append('stop').attr('offset', '0%').attr('stop-color', '#c7d2fe').attr('stop-opacity', 0.5);
    haloBgIndigo.append('stop').attr('offset', '50%').attr('stop-color', '#818cf8').attr('stop-opacity', 0.25);
    haloBgIndigo.append('stop').attr('offset', '100%').attr('stop-color', '#3730a3').attr('stop-opacity', 0);

    // F. BP Gold: Topaz sphere
    const gradBpGold = defs
      .append('radialGradient')
      .attr('id', 'sphere-bp-gold')
      .attr('cx', '34%')
      .attr('cy', '30%')
      .attr('r', '66%');
    gradBpGold.append('stop').attr('offset', '0%').attr('stop-color', '#fefce8');
    gradBpGold.append('stop').attr('offset', '35%').attr('stop-color', '#fef08a');
    gradBpGold.append('stop').attr('offset', '75%').attr('stop-color', '#eab308');
    gradBpGold.append('stop').attr('offset', '100%').attr('stop-color', '#854d0e');

    const haloBpGold = defs
      .append('radialGradient')
      .attr('id', 'halo-bp-gold')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    haloBpGold.append('stop').attr('offset', '0%').attr('stop-color', '#fef08a').attr('stop-opacity', 0.5);
    haloBpGold.append('stop').attr('offset', '50%').attr('stop-color', '#eab308').attr('stop-opacity', 0.22);
    haloBpGold.append('stop').attr('offset', '100%').attr('stop-color', '#854d0e').attr('stop-opacity', 0);

    // --- 4. SHARP TRIANGULAR ARROWHEADS (Docking right at the node sphere edge) ---
    ALL_RELATIONS.forEach((rel) => {
      const style = RELATION_STYLES[rel];
      defs
        .append('marker')
        .attr('id', `arrow-${rel}`)
        .attr('viewBox', '0 -3.5 7 7')
        .attr('refX', 23) // Dock cleanly at r=20 sphere rim
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-3L6.5,0L0,3')
        .attr('fill', style.color)
        .attr('opacity', 0.95);
    });

    // --- 4. STATIC SCREEN-SPACE BACKGROUND LAYERS (FIXED TO SCREEN, NEVER PAN/ZOOM) ---
    // 1. Consistent deep dark nebula-black background field (#0e111a)
    svg
      .append('rect')
      .attr('class', 'static-void-background')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#0e111a');

    // 2. Dense static grid: uniformly distributed dim charcoal-gray dots (2px dots separated by 10px)
    svg
      .append('rect')
      .attr('class', 'static-dim-dots-layer pointer-events-none')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#static-dim-dots)');

    // 3. Cursor spotlight: illuminated warm starlight-gold dots within radius 80px (void stays dark on desktop)
    const isMobileDevice =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches);

    const goldSpotlight = svg
      .append('rect')
      .attr('class', 'static-gold-dots-spotlight pointer-events-none')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#static-gold-dots)')
      .attr('mask', 'url(#cursor-spotlight-mask)');

    if (isMobileDevice) {
      goldSpotlight.style('display', 'none');
    }

    // Main transformed world group
    const g = svg.append('g').attr('class', 'constellation-group');

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on('zoom', (event) => {
        currentTransformRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial positioning
    if (!isInitializedRef.current) {
      currentTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2).scale(1);
      svg.call(zoom.transform, currentTransformRef.current);
      isInitializedRef.current = true;
    } else {
      svg.call(zoom.transform, currentTransformRef.current);
    }

    // Position hints replicating the harmonious layout in image.png
    const INITIAL_COORDS: Record<string, { x: number; y: number }> = {
      'MS-178': { x: -140, y: -45 },
      'MS-179': { x: -35, y: 55 },
      'DB-6.1.16': { x: 35, y: -110 },
      'MS-189': { x: 145, y: -20 },
      'DB-5.1.40': { x: 135, y: 95 },
      'DB-6.2.13': { x: 190, y: -110 },
      'DB-4.4.5': { x: 45, y: 155 },
    };

    // Prepare simulation nodes with user-saved coordinates or defaults
    const savedPositions = nodePositions || {};
    const existingNodeMap = new Map<string, GraphNode>(nodesRef.current.map((n) => [n.id, n]));
    const targetPosMap = targetPosMapRef.current;
    targetPosMap.clear();

    const nodes: GraphNode[] = filteredVerses.map((v, i) => {
      const existing = existingNodeMap.get(v.id);
      const saved = savedPositions[v.id];
      const hint = INITIAL_COORDS[v.id];

      let posX: number;
      let posY: number;
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        posX = Math.round(saved.x);
        posY = Math.round(saved.y);
      } else if (existing && typeof existing.x === 'number' && typeof existing.y === 'number') {
        posX = Math.round(existing.x);
        posY = Math.round(existing.y);
      } else if (hint) {
        posX = hint.x;
        posY = hint.y;
      } else {
        // Deterministic, harmonious spiral constellation placement for any new nodes
        const angle = (i * 137.5 * Math.PI) / 180;
        const dist = 180 + Math.sqrt(i) * 45;
        posX = Math.round(Math.cos(angle) * dist);
        posY = Math.round(Math.sin(angle) * dist);
      }

      targetPosMap.set(v.id, { x: posX, y: posY });

      return {
        id: v.id,
        verse: v,
        radius: 20,
        x: posX,
        y: posY,
        fx: posX, // Pin node to user-arranged coordinates to prevent drift and glitchy snapbacks
        fy: posY,
        vx: 0,
        vy: 0,
      };
    });
    nodesRef.current = nodes;

    const links: GraphLink[] = filteredEdges.map((e) => ({
      source: e.from,
      target: e.to,
      relation: e.relation,
      why: e.why,
    }));

    // Bounded constellation simulation: nodes are firmly positioned at arranged coordinates,
    // simulation resolves links cleanly without overriding user placements
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(115)
          .strength(0)
      )
      .alphaDecay(0.05);

    simulationRef.current = simulation;

    // Groups for links, nodes, and live drag wire preview
    const linksGroup = g.append('g').attr('class', 'links');
    const nodesGroup = g.append('g').attr('class', 'nodes');
    const wirePreviewGroup = g.append('g').attr('class', 'wire-preview-layer pointer-events-none');

    const wirePreviewLine = wirePreviewGroup
      .append('line')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2.4)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.95)
      .style('display', 'none');

    const wirePreviewSnap = wirePreviewGroup
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'rgba(52, 211, 153, 0.25)')
      .attr('stroke', '#34d399')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    const wirePreviewTip = wirePreviewGroup
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', '#fde047')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('display', 'none');

    // Draw curved bezier links
    const link = linksGroup
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'constellation-link cursor-pointer transition-opacity')
      .attr('stroke', (d) => RELATION_STYLES[d.relation].color)
      .attr('stroke-width', (d) => {
        const selId = selectedVerseIdRef.current;
        const isConnected =
          d.source === selId ||
          d.target === selId ||
          (typeof d.source === 'object' && d.source.id === selId) ||
          (typeof d.target === 'object' && d.target.id === selId);
        return isConnected ? 2.4 : RELATION_STYLES[d.relation].width;
      })
      .attr('stroke-dasharray', (d) => RELATION_STYLES[d.relation].dash)
      .attr('stroke-opacity', (d) => {
        const selId = selectedVerseIdRef.current;
        const isConnected =
          !selId ||
          d.source === selId ||
          d.target === selId ||
          (typeof d.source === 'object' && d.source.id === selId) ||
          (typeof d.target === 'object' && d.target.id === selId);
        return isConnected ? 0.75 : 0.2;
      })
      .attr('fill', 'none')
      .attr('marker-end', (d) => `url(#arrow-${d.relation})`)
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).attr('stroke-opacity', 1).attr('stroke-width', 2.6);
        const sourceId = typeof d.source === 'object' ? d.source.id : (d.source as string);
        const targetId = typeof d.target === 'object' ? d.target.id : (d.target as string);
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredEdge({
          edge: { from: sourceId, to: targetId, relation: d.relation, why: d.why },
          screenX: mx,
          screenY: my,
        });
      })
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredEdge((prev) => (prev ? { ...prev, screenX: mx, screenY: my } : null));
      })
      .on('mouseleave', (event, d) => {
        const selId = selectedVerseIdRef.current;
        const isConnected =
          !selId ||
          d.source === selId ||
          d.target === selId ||
          (typeof d.source === 'object' && d.source.id === selId) ||
          (typeof d.target === 'object' && d.target.id === selId);
        d3.select(event.currentTarget)
          .attr('stroke-opacity', isConnected ? 0.75 : 0.2)
          .attr('stroke-width', RELATION_STYLES[d.relation].width);
        setHoveredEdge(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        const sourceId = typeof d.source === 'object' ? d.source.id : (d.source as string);
        const targetId = typeof d.target === 'object' ? d.target.id : (d.target as string);
        setSelectedEdge({
          from: sourceId,
          to: targetId,
          relation: d.relation,
          why: d.why,
        });
        setEditingWhy(d.why || '');
      });

    // --- 6. DRAW 3D SPHERICAL NODES (EXACT REPLICA OF IMAGE.PNG) ---
    const node = nodesGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'constellation-node cursor-pointer')
      .attr('id', (d) => `node-${d.id}`);

    // Layer A: Outer Radial Halo Glow
    node
      .append('circle')
      .attr('class', 'halo-glow')
      .attr('r', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.radius + 24;
      })
      .attr('fill', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return `url(#${style.haloId})`;
      })
      .attr('pointer-events', 'none');

    // Layer B: Highlight Ring (For Selection or Chain highlights)
    node
      .append('circle')
      .attr('class', 'ring-highlight')
      .attr('r', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.radius + 4;
      })
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const selId = selectedVerseIdRef.current;
        if (d.id === selId) return '#ffffff';
        if (activeChainVerseIdsRef.current?.includes(d.id)) return '#fbbf24';
        return 'transparent';
      })
      .attr('stroke-width', (d) => (d.id === selectedVerseIdRef.current ? 2.5 : 1.5))
      .attr('stroke-opacity', (d) => (d.id === selectedVerseIdRef.current ? 1 : 0.75));

    // Layer C: 3D Spherical Core (Disc with 3D radial shading & border ring)
    node
      .append('circle')
      .attr('class', 'sphere-core')
      .attr('r', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.radius;
      })
      .attr('fill', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return `url(#${style.gradientId})`;
      })
      .attr('stroke', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.ringColor;
      })
      .attr('stroke-width', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.ringWidth;
      });

    // Layer D: Numerals / Verse Short Code inside the Orb
    node
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', (d) => {
        const style = getNodeSphereStyle(d.verse, d.id === selectedVerseIdRef.current);
        return style.textColor;
      })
      .attr('font-size', (d) => {
        const disp = getNodeDisplay(d.verse, numeralMode);
        return disp.isDevanagari ? '11.5px' : '11px';
      })
      .attr('font-weight', '700')
      .attr('font-family', (d) => {
        const disp = getNodeDisplay(d.verse, numeralMode);
        return disp.isDevanagari
          ? "'Noto Serif Devanagari', serif"
          : "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
      })
      .attr('letter-spacing', '-0.02em')
      .attr('pointer-events', 'none')
      .text((d) => getNodeDisplay(d.verse, numeralMode).label);

    // Layer E: Devanagari Subtitle / Caption beneath the sphere (e.g. "मनाचे श्लोक १७८", "दासबोध ६.१.१६")
    node
      .append('text')
      .attr('class', 'node-subtitle')
      .attr('text-anchor', 'middle')
      .attr('dy', 36)
      .attr('fill', '#9ca3af')
      .attr('font-size', '9.5px')
      .attr('font-weight', '500')
      .attr('font-family', "'Noto Serif Devanagari', Georgia, serif")
      .attr('opacity', 0.88)
      .attr('pointer-events', 'none')
      .attr('letter-spacing', '0.01em')
      .text((d) => d.verse.display_ref);

    // Node drag & interaction behavior based on isCuratorMode
    if (isCuratorMode) {
      // CURATOR MODE: Drag-to-connect behavior
      let activeDragSource: GraphNode | null = null;
      let currentHoverTarget: GraphNode | null = null;
      let hasMoved = false;
      let dragStartPos = { x: 0, y: 0 };

      const curatorDrag = d3
        .drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          activeDragSource = d;
          currentHoverTarget = null;
          hasMoved = false;
          const [cx, cy] = d3.pointer(event, g.node());
          dragStartPos = { x: cx, y: cy };
        })
        .on('drag', (event) => {
          if (!activeDragSource) return;
          const [cx, cy] = d3.pointer(event, g.node());
          const distanceMoved = Math.hypot(cx - dragStartPos.x, cy - dragStartPos.y);
          if (distanceMoved > 5) {
            hasMoved = true;
          }
          if (!hasMoved) return;

          // Find candidate target node within snap radius (48px)
          let candidate: GraphNode | null = null;
          let minDistance = 48;
          for (const n of nodesRef.current) {
            if (n.id === activeDragSource.id) continue;
            const dist = Math.hypot((n.x ?? 0) - cx, (n.y ?? 0) - cy);
            if (dist < minDistance) {
              minDistance = dist;
              candidate = n;
            }
          }

          currentHoverTarget = candidate;
          const sx = activeDragSource.x ?? 0;
          const sy = activeDragSource.y ?? 0;

          wirePreviewLine
            .attr('x1', sx)
            .attr('y1', sy)
            .style('display', 'block');

          if (candidate) {
            wirePreviewLine
              .attr('x2', candidate.x ?? 0)
              .attr('y2', candidate.y ?? 0)
              .attr('stroke', '#34d399');

            wirePreviewSnap
              .attr('cx', candidate.x ?? 0)
              .attr('cy', candidate.y ?? 0)
              .style('display', 'block');

            wirePreviewTip.style('display', 'none');
          } else {
            wirePreviewLine
              .attr('x2', cx)
              .attr('y2', cy)
              .attr('stroke', '#fbbf24');

            wirePreviewSnap.style('display', 'none');

            wirePreviewTip
              .attr('cx', cx)
              .attr('cy', cy)
              .style('display', 'block');
          }
        })
        .on('end', () => {
          wirePreviewLine.style('display', 'none');
          wirePreviewSnap.style('display', 'none');
          wirePreviewTip.style('display', 'none');

          if (hasMoved && activeDragSource && currentHoverTarget) {
            dragJustEndedRef.current = true;
            setTimeout(() => {
              dragJustEndedRef.current = false;
            }, 250);

            const t = currentTransformRef.current;
            const screenX = (currentHoverTarget.x ?? 0) * t.k + t.x;
            const screenY = (currentHoverTarget.y ?? 0) * t.k + t.y;

            setRelationPicker({
              fromId: activeDragSource.id,
              toId: currentHoverTarget.id,
              screenX,
              screenY,
            });
          }

          activeDragSource = null;
          currentHoverTarget = null;
          hasMoved = false;
        });

      node.call(curatorDrag);
    } else {
      // MOVE / ARRANGE MODE: Move nodes freely as per user will!
      let hasDraggedNode = false;

      const moveDrag = d3
        .drag<SVGGElement, GraphNode>()
        .on('start', (_event, d) => {
          hasDraggedNode = false;
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', function (event, d) {
          hasDraggedNode = true;
          const newX = event.x;
          const newY = event.y;
          d.fx = newX;
          d.fy = newY;
          d.x = newX;
          d.y = newY;

          // Directly update the visual transform of the dragged node for instant smooth tracking
          d3.select(this).attr('transform', `translate(${newX},${newY})`);

          // Update connecting links to this node immediately
          link
            .filter((l: any) => {
              const sId = typeof l.source === 'object' ? l.source.id : l.source;
              const tId = typeof l.target === 'object' ? l.target.id : l.target;
              return sId === d.id || tId === d.id;
            })
            .attr('d', getCurvedPath);
        })
        .on('end', (event, d) => {
          if (hasDraggedNode) {
            dragJustEndedRef.current = true;
            setTimeout(() => {
              dragJustEndedRef.current = false;
            }, 250);

            const roundedX = Math.round(event.x);
            const roundedY = Math.round(event.y);
            d.x = roundedX;
            d.y = roundedY;
            d.fx = roundedX;
            d.fy = roundedY;
            targetPosMapRef.current.set(d.id, { x: roundedX, y: roundedY });

            // Persist arranged position to universal JSON database!
            onSaveNodePositionRef.current?.(d.id, {
              x: roundedX,
              y: roundedY,
              fx: roundedX,
              fy: roundedY,
            });

            link.attr('d', getCurvedPath);
          }
        });

      node.call(moveDrag);
    }

    node.on('click', (event, d) => {
      event.stopPropagation();
      if (!dragJustEndedRef.current) {
        onSelectVerse(d.verse);
      }
    });

    // Simulation Tick Updates
    simulation.on('tick', () => {
      link.attr('d', getCurvedPath);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Initial render tick to guarantee exact positioning instantly
    simulation.tick();
    link.attr('d', getCurvedPath);
    node.attr('transform', (d) => `translate(${d.x},${d.y})`);

    // --- 6. SOFT STARLIGHT-GOLD CURSOR TRACKER (SCREEN-SPACE, DESKTOP ONLY) ---
    const cursorTracker = svg
      .append('g')
      .attr('id', 'starlight-cursor-tracker')
      .attr('class', 'pointer-events-none')
      .attr('transform', `translate(${initialCursorX}, ${initialCursorY})`)
      .attr('opacity', pointerPos.visible ? 1 : 0.85);

    if (isMobileDevice) {
      cursorTracker.style('display', 'none');
    }

    // Subtle outer starlight ring (contrasting ring around the pointer)
    cursorTracker
      .append('circle')
      .attr('r', 13)
      .attr('fill', 'none')
      .attr('stroke', '#fde047')
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '2,2');

    // Focused warm gold aura
    cursorTracker
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', 'rgba(253, 224, 71, 0.22)')
      .attr('stroke', '#fde047')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.85);

    // Precise starlight-gold center pointer
    cursorTracker
      .append('circle')
      .attr('r', 2)
      .attr('fill', '#ffffff');

    return () => {
      simulation.stop();
    };
  }, [structureKey, isCuratorMode, numeralMode, getCurvedPath]);

  // 2. LIGHTWEIGHT SELECTION UPDATE EFFECT
  // Updates stroke highlights without rebuilding the SVG, restarting simulation, or moving nodes!
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Update node highlight rings
    svg.selectAll<SVGGElement, GraphNode>('g.constellation-node').each(function (d) {
      const isSelected = d.id === selectedVerseId;
      const inChain = activeChainVerseIds?.includes(d.id);
      d3.select(this)
        .select('.ring-highlight')
        .attr('stroke', isSelected ? '#ffffff' : inChain ? '#fbbf24' : 'transparent')
        .attr('stroke-width', isSelected ? 2.5 : 1.5)
        .attr('stroke-opacity', isSelected ? 1 : inChain ? 0.75 : 0);
    });

    // Update link highlight opacities and widths
    svg.selectAll<SVGPathElement, GraphLink>('path.constellation-link').each(function (d) {
      const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' ? d.target.id : d.target;
      const isConnected = sourceId === selectedVerseId || targetId === selectedVerseId;
      const style = RELATION_STYLES[d.relation];

      d3.select(this)
        .attr('stroke-width', isConnected ? 2.4 : style.width)
        .attr('stroke-opacity', !selectedVerseId || isConnected ? 0.75 : 0.2);
    });
  }, [selectedVerseId, activeChainVerseIds]);

  // 3. EXTERNAL POSITION SYNCHRONIZATION EFFECT
  // When nodePositions updates from server or another device, smoothly reposition nodes without rebuilding DOM or restarting simulation
  useEffect(() => {
    if (!svgRef.current || !nodePositions) return;
    const svg = d3.select(svgRef.current);
    let hasMoved = false;

    nodesRef.current.forEach((n) => {
      const saved = nodePositions[n.id];
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        const roundedSavedX = Math.round(saved.x);
        const roundedSavedY = Math.round(saved.y);
        const currentX = Math.round(n.x ?? 0);
        const currentY = Math.round(n.y ?? 0);

        // Only reposition if position actually changed by more than 3px (e.g. from another device)
        if (Math.abs(currentX - roundedSavedX) > 3 || Math.abs(currentY - roundedSavedY) > 3) {
          n.x = roundedSavedX;
          n.y = roundedSavedY;
          n.fx = roundedSavedX;
          n.fy = roundedSavedY;
          hasMoved = true;

          svg
            .select<SVGGElement>(`[id="node-${n.id}"]`)
            .attr('transform', `translate(${roundedSavedX},${roundedSavedY})`);
        }
      }
    });

    if (hasMoved) {
      svg.selectAll<SVGPathElement, GraphLink>('path.constellation-link').attr('d', getCurvedPath);
    }
  }, [nodePositions, getCurvedPath]);

  // Zoom control helpers
  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
      );
  };

  const handleZoom = (scaleMultiplier: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, scaleMultiplier);
  };

  const handlePickRelation = (relation: RelationType) => {
    if (!relationPicker || !onAddEdge) return;
    onAddEdge({
      from: relationPicker.fromId,
      to: relationPicker.toId,
      relation,
      why: '',
    });
    setRelationPicker(null);
  };

  const handleSaveWhy = () => {
    if (!selectedEdge || !onUpdateEdge) return;
    onUpdateEdge(selectedEdge.from, selectedEdge.to, editingWhy);
    setSelectedEdge((prev) => (prev ? { ...prev, why: editingWhy } : null));
  };

  const handleDeleteConnection = () => {
    if (!selectedEdge || !onDeleteEdge) return;
    if (confirm(`Remove connection ${selectedEdge.from} → ${selectedEdge.to}?`)) {
      onDeleteEdge(selectedEdge.from, selectedEdge.to);
      setSelectedEdge(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full bg-[#0e111a] overflow-hidden select-none"
    >
      {/* Main SVG Visualization with Screen-Space Dot Grid, Spotlight & Spheres */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={() => {
          if (dragJustEndedRef.current) return;
          setSelectedEdge(null);
          setRelationPicker(null);
        }}
      />

      {/* RELATION PICKER POPUP (Instant Contextual Tap Target on Release) */}
      {relationPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 transform -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.max(140, Math.min((containerRef.current?.clientWidth || 800) - 140, relationPicker.screenX))}px`,
            top: `${Math.max(60, relationPicker.screenY - 14)}px`,
          }}
        >
          <div className="bg-[#12141d]/95 border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 px-1.5 text-[10px] text-stone-400 font-mono">
              <span className="text-amber-300 font-semibold">
                Link: {relationPicker.fromId} → {relationPicker.toId}
              </span>
              <button
                onClick={() => setRelationPicker(null)}
                className="text-stone-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* 6 Compact Tap Pills */}
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {ALL_RELATIONS.map((rel) => {
                const style = RELATION_STYLES[rel];
                return (
                  <button
                    key={rel}
                    onClick={() => handlePickRelation(rel)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-transform active:scale-95 text-white/95 hover:brightness-110 shadow-xs flex items-center gap-1"
                    style={{ backgroundColor: style.color }}
                  >
                    {rel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDGE INSPECT / REASONING CARD */}
      {selectedEdge && (
        <div className="absolute top-6 left-6 z-30 max-w-sm w-full bg-[#12141e]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-stone-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: RELATION_STYLES[selectedEdge.relation].color }}
              >
                {selectedEdge.relation}
              </span>
              <span className="font-mono text-xs text-stone-300 font-medium">
                {selectedEdge.from} → {selectedEdge.to}
              </span>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-stone-500 hover:text-stone-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mt-3">
            <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">
              Scholarly Reasoning ("why"):
            </label>
            <textarea
              rows={3}
              value={editingWhy}
              onChange={(e) => setEditingWhy(e.target.value)}
              placeholder="State the substantive argumentative connection (optional)..."
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-2.5 text-xs text-stone-200 font-serif focus:ring-1 focus:ring-amber-500/50 outline-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              {onDeleteEdge && (
                <button
                  onClick={handleDeleteConnection}
                  className="text-stone-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
              <button
                onClick={handleSaveWhy}
                className="ml-auto px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOVER TOOLTIP ON EDGES */}
      {hoveredEdge && !selectedEdge && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: `${hoveredEdge.screenX}px`, top: `${hoveredEdge.screenY - 10}px` }}
        >
          <div className="bg-[#12141f]/95 border border-white/15 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-xs text-xs flex flex-col gap-0.5 max-w-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: RELATION_STYLES[hoveredEdge.edge.relation].color }}
              />
              <span className="font-semibold text-stone-100 uppercase text-[10px] tracking-wider">
                {hoveredEdge.edge.relation}
              </span>
              <span className="font-mono text-stone-400 text-[10px]">
                {hoveredEdge.edge.from} → {hoveredEdge.edge.to}
              </span>
            </div>
            {hoveredEdge.edge.why && (
              <p className="text-stone-300 font-serif text-[11px] leading-snug line-clamp-2">
                "{hoveredEdge.edge.why}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* CURATOR MODE DIRECT WIRE HINT */}
      {isCuratorMode && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-amber-500/10 border border-amber-500/30 text-amber-300/90 text-xs px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Curator Mode: Drag directly from one star to another to connect</span>
        </div>
      )}

      {/* QUIET CANVAS ZOOM CONTROLS (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5">
        <button
          onClick={() => handleZoom(1.25)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-stone-400 hover:text-stone-200 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-stone-400 hover:text-stone-200 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-stone-400 hover:text-stone-200 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
