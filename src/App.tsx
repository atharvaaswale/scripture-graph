import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_SCRIPTURE_DB } from './data/initialData';
import { ScriptureDatabase, Verse, Edge, NodePosition, ScriptureDef } from './types';
import { GraphVisualization, SCRIPTURE_THEMES, getScriptureTheme } from './components/GraphVisualization';
import { VerseCatalog } from './components/VerseCatalog';
import { VerseDetailsModal } from './components/VerseDetailsModal';
import { BatchProposerModal } from './components/BatchProposerModal';
import { JsonManagerModal } from './components/JsonManagerModal';
import { ManualVerseModal } from './components/ManualVerseModal';
import { LoginModal } from './components/LoginModal';
import {
  Plus,
  MoreHorizontal,
  Sparkles,
  FileCode,
  BookOpen,
  CheckCircle,
  RotateCcw,
  X,
  Move,
  Link2,
  Lock,
  RefreshCw,
  AlertCircle,
  Save,
  Download,
  Upload,
} from 'lucide-react';

const STORAGE_KEY = 'scripture_graph_database_v1';

// Helper to ensure every verse has numerical coordinates and node_positions is populated
function sanitizeScriptureDatabase(raw: any): ScriptureDatabase | null {
  if (!raw || !Array.isArray(raw.verses) || raw.verses.length === 0 || !Array.isArray(raw.edges)) {
    return null;
  }

  const positions: Record<string, NodePosition> = { ...(raw.node_positions || {}) };

  const sanitizedVerses: Verse[] = raw.verses.map((v: any) => {
    const pos = positions[v.id];
    const posX = typeof pos?.x === 'number' ? Math.round(pos.x) : typeof v.x === 'number' ? Math.round(v.x) : 0;
    const posY = typeof pos?.y === 'number' ? Math.round(pos.y) : typeof v.y === 'number' ? Math.round(v.y) : 0;

    if (!positions[v.id]) {
      positions[v.id] = { x: posX, y: posY, fx: posX, fy: posY };
    }

    return {
      ...v,
      x: posX,
      y: posY,
    };
  });

  const mergedScriptures = {
    ...INITIAL_SCRIPTURE_DB.scriptures,
    ...(raw.scriptures || raw.scripture_definitions || {}),
  };

  return {
    ...raw,
    scriptures: mergedScriptures,
    verses: sanitizedVerses,
    edges: raw.edges,
    node_positions: positions,
  };
}

export default function App() {
  // Login Authentication State (admin / 10509)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('scripture_auth_authenticated') === 'true' ||
        sessionStorage.getItem('scripture_auth_authenticated') === 'true'
      );
    } catch {
      return false;
    }
  });

  const [database, setDatabase] = useState<ScriptureDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeScriptureDatabase(parsed);
        if (sanitized) {
          return sanitized;
        }
      }
    } catch {
      // ignore
    }
    return sanitizeScriptureDatabase(INITIAL_SCRIPTURE_DB) || INITIAL_SCRIPTURE_DB;
  });

  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);

  // Selected verse for the minimal 2-item overlay
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // Floating Modals / Overlays
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManualVerseOpen, setIsManualVerseOpen] = useState(false);
  const [isBatchProposerOpen, setIsBatchProposerOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Scripture Filters: default to all known scriptures active
  const [activeScriptures, setActiveScriptures] = useState<Set<string>>(
    () => new Set(Object.keys(INITIAL_SCRIPTURE_DB.scriptures || { MS: 1, DB: 1, BG: 1, BP: 1 }))
  );

  // Curator Mode vs Move Mode toggle
  const [isCuratorMode, setIsCuratorMode] = useState(false);

  // Orb Numerals Mode: Devanagari or English numbers
  const [numeralMode, setNumeralMode] = useState<'devanagari' | 'latin'>('devanagari');

  // Subtle toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const hasBackendServerRef = useRef<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to persist database to localStorage and non-blocking background server
  const persistUniversalDatabase = useCallback((newDb: ScriptureDatabase) => {
    const sanitized = sanitizeScriptureDatabase(newDb) || newDb;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    // Optional background server sync if backend exists
    if (hasBackendServerRef.current !== false) {
      fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(sanitized),
      })
        .then((res) => {
          if (res.ok) {
            hasBackendServerRef.current = true;
          } else {
            hasBackendServerRef.current = false;
          }
        })
        .catch(() => {
          hasBackendServerRef.current = false;
        });
    }
  }, []);

  // 1. Universal Database Loader: LocalStorage is the primary source of truth, falls back to /database.json
  const loadUniversalDatabase = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingDb(true);

      // Check current localStorage state first
      let localDb: ScriptureDatabase | null = null;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          localDb = sanitizeScriptureDatabase(parsed);
        }
      } catch {}

      // If user already has data in localStorage, it is our universal source of truth!
      if (localDb && localDb.verses.length > 0) {
        setDatabase(localDb);
        setSyncStatus('synced');
        return localDb;
      }

      // If localStorage is empty (first-time visitor on Vercel or fresh browser):
      let staticDb: ScriptureDatabase | null = null;
      try {
        const res = await fetch(`/database.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          staticDb = sanitizeScriptureDatabase(data);
        }
      } catch {}

      const baselineDb = staticDb || sanitizeScriptureDatabase(INITIAL_SCRIPTURE_DB) || INITIAL_SCRIPTURE_DB;
      setDatabase(baselineDb);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(baselineDb));
      } catch {}
      setSyncStatus('synced');
      return baselineDb;
    } catch (err) {
      console.warn('Could not load database:', err);
    } finally {
      if (!silent) setIsLoadingDb(false);
    }
    return null;
  }, []);

  // Fetch database on mount
  useEffect(() => {
    loadUniversalDatabase();
  }, [loadUniversalDatabase]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Updating positions of node in UI directly updates the position value of that note in JSON
  const handleSaveNodePosition = (id: string, position: NodePosition) => {
    const roundedPos = {
      x: Math.round(position.x),
      y: Math.round(position.y),
      fx: Math.round(position.x),
      fy: Math.round(position.y),
    };

    setDatabase((prev) => {
      const updatedPositions = {
        ...(prev.node_positions || {}),
        [id]: roundedPos,
      };

      // Directly update the coordinates inside the note/verse in the JSON
      const updatedVerses = prev.verses.map((v) =>
        v.id === id
          ? {
              ...v,
              x: roundedPos.x,
              y: roundedPos.y,
            }
          : v
      );

      const newDb: ScriptureDatabase = {
        ...prev,
        verses: updatedVerses,
        node_positions: updatedPositions,
      };

      persistUniversalDatabase(newDb);
      return newDb;
    });

    setSyncStatus('synced');
  };

  // Download the full database JSON with coordinates baked into every verse note
  const handleDownloadDatabaseJson = () => {
    const formattedDb: ScriptureDatabase = sanitizeScriptureDatabase(database) || database;
    const jsonStr = JSON.stringify(formattedDb, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded database.json with coordinates');
  };

  // Import any universal database.json from user's computer
  const handleImportDatabaseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sanitized = sanitizeScriptureDatabase(parsed);
        if (sanitized && sanitized.verses.length > 0) {
          setDatabase(sanitized);
          persistUniversalDatabase(sanitized);
          showToast(`Imported ${sanitized.verses.length} verses & ${sanitized.edges.length} links!`);
        } else {
          showToast('Invalid database.json format');
        }
      } catch {
        showToast('Error reading database.json');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Manual explicit save layout in JSON
  const handleManualSaveLayout = () => {
    setDatabase((prev) => {
      const formattedDb = sanitizeScriptureDatabase(prev) || prev;
      persistUniversalDatabase(formattedDb);
      return formattedDb;
    });
    showToast('Coordinates & connections saved in JSON!');
  };

  const handleCommitBatch = (newVerses: Verse[], newEdges: Edge[]) => {
    setDatabase((prev) => {
      const existingIds = new Set(prev.verses.map((v) => v.id));
      const freshVerses = newVerses.filter((v) => !existingIds.has(v.id));

      const edgeKey = (e: Edge) => `${e.from}::${e.to}`;
      const existingEdgeKeys = new Set(prev.edges.map(edgeKey));
      const freshEdges = newEdges.filter((e) => !existingEdgeKeys.has(edgeKey(e)));

      const updatedPositions = { ...(prev.node_positions || {}) };
      freshVerses.forEach((v) => {
        if (typeof v.x === 'number' && typeof v.y === 'number') {
          updatedPositions[v.id] = {
            x: Math.round(v.x),
            y: Math.round(v.y),
            fx: Math.round(v.x),
            fy: Math.round(v.y),
          };
        }
      });

      const newDb: ScriptureDatabase = {
        ...prev,
        verses: [...prev.verses, ...freshVerses],
        edges: [...prev.edges, ...freshEdges],
        node_positions: updatedPositions,
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Merged verses & connections to universal JSON`);
  };

  // Direct manipulation connection created on canvas or modal
  const handleAddEdge = (edge: Edge) => {
    setDatabase((prev) => {
      const filtered = prev.edges.filter((e) => !(e.from === edge.from && e.to === edge.to));
      const newDb: ScriptureDatabase = {
        ...prev,
        edges: [...filtered, edge],
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Linked ${edge.from} → ${edge.to} (${edge.relation})`);
  };

  const handleUpdateEdge = (from: string, to: string, updatedWhy: string) => {
    setDatabase((prev) => {
      const newDb: ScriptureDatabase = {
        ...prev,
        edges: prev.edges.map((e) =>
          e.from === from && e.to === to ? { ...e, why: updatedWhy } : e
        ),
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast('Updated connection reasoning');
  };

  const handleDeleteEdge = (from: string, to: string) => {
    setDatabase((prev) => {
      const newDb: ScriptureDatabase = {
        ...prev,
        edges: prev.edges.filter((e) => !(e.from === from && e.to === to)),
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Removed link ${from} → ${to}`);
  };

  const handleAddVerse = (verse: Verse) => {
    setDatabase((prev) => {
      const withoutDuplicate = prev.verses.filter((v) => v.id !== verse.id);
      const posX = typeof verse.x === 'number' ? Math.round(verse.x) : 0;
      const posY = typeof verse.y === 'number' ? Math.round(verse.y) : 0;
      const verseWithPos = { ...verse, x: posX, y: posY };

      const updatedPositions = {
        ...(prev.node_positions || {}),
        [verse.id]: { x: posX, y: posY, fx: posX, fy: posY },
      };

      const newDb: ScriptureDatabase = {
        ...prev,
        verses: [...withoutDuplicate, verseWithPos],
        node_positions: updatedPositions,
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Added ${verse.id} to universal database`);
  };

  // Add new scripture to universal database
  const handleAddScripture = useCallback(
    (code: string, def: ScriptureDef) => {
      const cleanCode = code.trim().toUpperCase();
      setDatabase((prev) => {
        const updatedDb: ScriptureDatabase = {
          ...prev,
          scriptures: {
            ...prev.scriptures,
            [cleanCode]: def,
          },
        };
        persistUniversalDatabase(updatedDb);
        return updatedDb;
      });
      setActiveScriptures((prev) => new Set([...prev, cleanCode]));
      showToast(`Added scripture ${cleanCode} (${def.full_name})`);
    },
    [persistUniversalDatabase, showToast]
  );

  const handleDeleteVerse = (verseId: string) => {
    setDatabase((prev) => {
      const remainingVerses = prev.verses.filter((v) => v.id !== verseId);
      const remainingEdges = prev.edges.filter((e) => e.from !== verseId && e.to !== verseId);
      const updatedPositions = { ...(prev.node_positions || {}) };
      delete updatedPositions[verseId];

      const newDb: ScriptureDatabase = {
        ...prev,
        verses: remainingVerses,
        edges: remainingEdges,
        node_positions: updatedPositions,
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    setSelectedVerse(null);
    showToast(`Deleted ${verseId} from universal database`);
  };

  const handleResetDatabase = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    const seed = sanitizeScriptureDatabase(INITIAL_SCRIPTURE_DB) || INITIAL_SCRIPTURE_DB;
    setDatabase(seed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {}

    if (hasBackendServerRef.current !== false) {
      fetch('/api/database/reset', { method: 'POST' }).catch(() => {
        hasBackendServerRef.current = false;
      });
    }
    showToast('Reset constellation to initial seed scripture database');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('scripture_auth_authenticated');
      sessionStorage.removeItem('scripture_auth_authenticated');
    } catch (e) {}
    setIsAuthenticated(false);
    setIsMenuOpen(false);
    showToast('Logged out');
  };

  const toggleScriptureFilter = (sc: string) => {
    setActiveScriptures((prev) => {
      const next = new Set(prev);
      if (next.has(sc)) {
        if (next.size > 1) next.delete(sc);
      } else {
        next.add(sc);
      }
      return next;
    });
  };

  return (
    <div className="w-screen h-screen bg-[#0e111a] text-stone-200 relative overflow-hidden font-sans select-none">
      {/* Subtle Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#161824]/95 text-stone-100 border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-mono backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* QUIET, UNDERSTATED TITLE (Top Left) */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none flex flex-col gap-0.5">
        <h1 className="font-devanagari text-stone-200/90 text-sm sm:text-base font-normal tracking-wide">
          मनाचे श्लोक · दासबोध
        </h1>
        <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">
          Scripture Constellation · {database.verses.length} verses · {database.edges.length} links
        </p>
      </div>

      {/* Hidden File Input for Importing database.json */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportDatabaseFile}
        className="hidden"
      />

      {/* TOP RIGHT CONTROLS: Small Curator Mode Toggle + Menu Button */}
      <div className="absolute top-5 right-6 z-30 flex items-center gap-2">
        {/* Small Curator Mode Toggle Button */}
        <button
          id="btn-curator-toggle"
          onClick={() => {
            const next = !isCuratorMode;
            setIsCuratorMode(next);
            showToast(
              next
                ? 'Curator Mode: Drag between orbs to link'
                : 'Move Mode: Drag orbs freely to position'
            );
          }}
          className={`h-9 px-3 rounded-full flex items-center gap-2 text-xs font-mono transition-all border backdrop-blur-md active:scale-95 ${
            isCuratorMode
              ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-md ring-1 ring-amber-400/40'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white'
          }`}
          title={
            isCuratorMode
              ? 'Curator Mode (Linking): Drag from an orb to connect it to another. Click to switch to Move Mode.'
              : 'Move Mode: Drag orbs freely to position them as you wish. Click to switch to Curator Mode.'
          }
        >
          {isCuratorMode ? (
            <>
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-amber-300">Curator</span>
            </>
          ) : (
            <>
              <Move className="w-3.5 h-3.5 text-stone-400" />
              <span>Move</span>
            </>
          )}
        </button>

        {/* Save Coordinates in JSON Button */}
        <button
          id="btn-save-json-layout"
          onClick={handleManualSaveLayout}
          className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-mono transition-all border backdrop-blur-md active:scale-95 ${
            syncStatus === 'saving'
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}
          title="Save node coordinates directly into the JSON database"
        >
          {syncStatus === 'saving' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="hidden sm:inline">Saving JSON...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Save in JSON</span>
            </>
          )}
        </button>

        {/* Import JSON Button */}
        <button
          id="btn-import-json"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-mono transition-all border backdrop-blur-md active:scale-95 bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white"
          title="Import database.json file from your computer"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Import JSON</span>
        </button>

        {/* Download JSON Button */}
        <button
          id="btn-download-json"
          onClick={handleDownloadDatabaseJson}
          className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-mono transition-all border backdrop-blur-md active:scale-95 bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white"
          title="Download database.json containing coordinates for every note"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Download JSON</span>
        </button>

        <button
          id="btn-main-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all border ${
            isMenuOpen
              ? 'bg-amber-600/30 border-amber-400/50 text-amber-200'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-400 hover:text-stone-200'
          }`}
          title="Settings & Tools"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
        </button>

        {/* ELEGANT SLIDE-OUT / POPOVER MENU */}
        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-12 right-0 w-72 bg-[#12131c]/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150 text-stone-300"
          >
            {/* Curator vs Move Mode Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                Mode:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsCuratorMode(false);
                    showToast('Move Mode: Drag orbs freely to position');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono text-center transition-colors border flex items-center justify-center gap-1.5 ${
                    !isCuratorMode
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200 font-semibold'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Move className="w-3 h-3" />
                  <span>Move</span>
                </button>
                <button
                  onClick={() => {
                    setIsCuratorMode(true);
                    showToast('Curator Mode: Drag between orbs to link');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono text-center transition-colors border flex items-center justify-center gap-1.5 ${
                    isCuratorMode
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200 font-semibold'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>Curator</span>
                </button>
              </div>
            </div>

            {/* Scripture Filters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                  Scripture Glow:
                </span>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsManualVerseOpen(true);
                  }}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                  title="Add more scriptures"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add More</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {Object.entries(database.scriptures || {}).map(([code, def]) => {
                  const theme = getScriptureTheme(code, (def as ScriptureDef)?.full_name);
                  const isActive = activeScriptures.has(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleScriptureFilter(code)}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-mono flex items-center gap-2 transition-colors border ${
                        isActive
                          ? 'bg-white/10 border-white/10 text-stone-200'
                          : 'bg-white/[0.02] border-white/5 text-stone-500'
                      }`}
                      title={(def as ScriptureDef)?.full_name || code}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.core }}
                      />
                      <span className="truncate">{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orb Numerals Mode (Devanagari vs English only) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                Orb Numerals:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setNumeralMode('devanagari')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono text-center transition-colors border flex items-center justify-center gap-1.5 ${
                    numeralMode === 'devanagari'
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200 font-semibold'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Devanagari numerals (१७८, ५.१.४०, ६.१.१६)"
                >
                  <span>Devanagari</span>
                  <span className="text-[10px] text-amber-400/80 font-devanagari">१ २ ३</span>
                </button>
                <button
                  onClick={() => setNumeralMode('latin')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono text-center transition-colors border flex items-center justify-center gap-1.5 ${
                    numeralMode === 'latin'
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200 font-semibold'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title="English numerals (178, 5.1.40, 6.1.16)"
                >
                  <span>English</span>
                  <span className="text-[10px] text-amber-400/80">1 2 3</span>
                </button>
              </div>
            </div>

            {/* Views */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <button
                onClick={() => {
                  setIsCatalogOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  Verse Catalog
                </span>
                <span className="font-mono text-[10px] text-stone-500">
                  {database.verses.length}
                </span>
              </button>
            </div>

            {/* Tools */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  await loadUniversalDatabase(false);
                  setIsSyncing(false);
                  showToast('Universal constellation synchronized');
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
                title="Force refresh database and node positions directly from universal server"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync with Server</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500">Live</span>
              </button>

              <button
                onClick={async () => {
                  await handleManualSaveLayout();
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
                title="Save current constellation coordinates to JSON storage"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Coordinates in JSON</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500">JSON</span>
              </button>

              <button
                onClick={() => {
                  handleDownloadDatabaseJson();
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
                title="Download updated database.json with coordinates baked into every verse note"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download database.json</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500">Export</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
                title="Import database.json file from your computer"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Import database.json</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500">Import</span>
              </button>

              <button
                onClick={() => {
                  setIsBatchProposerOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center gap-2 text-stone-300 hover:text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Ingest & Propose Batch
              </button>

              <button
                onClick={() => {
                  setIsJsonModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center gap-2 text-stone-300 hover:text-white transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Database Schema & Export
              </button>

              <button
                onClick={() => {
                  if (confirm('Reset to initial seed scripture database?')) {
                    handleResetDatabase();
                    setIsMenuOpen(false);
                  }
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center gap-2 text-stone-500 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Seed Data
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-2.5 py-1.5 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 text-rose-400/80 hover:text-rose-300 transition-colors border-t border-white/5 pt-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign Out / Lock (admin)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FULL-SCREEN INTERACTIVE CONSTELLATION GRAPH */}
      <main className="w-full h-full">
        <GraphVisualization
          verses={database.verses}
          edges={database.edges}
          onSelectVerse={(v) => setSelectedVerse(v)}
          selectedVerseId={selectedVerse?.id || null}
          isCuratorMode={isCuratorMode}
          onAddEdge={handleAddEdge}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          activeScriptures={activeScriptures}
          numeralMode={numeralMode}
          nodePositions={database.node_positions}
          onSaveNodePosition={handleSaveNodePosition}
        />
      </main>

      {/* Universal Database Sync Status */}
      {isLoadingDb && (
        <div className="fixed bottom-6 left-6 z-40 bg-[#161824]/90 border border-amber-500/20 px-3 py-1.5 rounded-full text-[11px] font-mono text-amber-300/80 flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Syncing universal database...</span>
        </div>
      )}

      {/* SINGLE FLOATING "+" BUTTON (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          id="btn-floating-add-verse"
          onClick={() => setIsManualVerseOpen(true)}
          className="w-11 h-11 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-2xl border border-amber-400/40 backdrop-blur-md transition-all active:scale-95"
          title="Add New Verse"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* MODAL 1: POETIC VERSE DETAILS + CURATOR CONNECTION TOOLS */}
      <VerseDetailsModal
        verse={selectedVerse}
        database={database}
        onClose={() => setSelectedVerse(null)}
        onDeleteVerse={handleDeleteVerse}
        onAddEdge={handleAddEdge}
        onDeleteEdge={handleDeleteEdge}
        isCuratorMode={true}
      />

      {/* MODAL 2: MANUAL VERSE ENTRY */}
      <ManualVerseModal
        database={database}
        isOpen={isManualVerseOpen}
        onClose={() => setIsManualVerseOpen(false)}
        onAddVerse={handleAddVerse}
        onAddScripture={handleAddScripture}
      />

      {/* MODAL 3: BATCH INGESTION & SCHOLAR AI PROPOSER */}
      <BatchProposerModal
        database={database}
        isOpen={isBatchProposerOpen}
        onClose={() => setIsBatchProposerOpen(false)}
        onCommitBatch={(verses, edges) => handleCommitBatch(verses, edges)}
      />

      {/* MODAL 4: JSON DATABASE & SCHEMA EXPORT */}
      <JsonManagerModal
        database={database}
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onUpdateDatabase={async (db) => {
          setDatabase(db);
          await persistUniversalDatabase(db);
          showToast(`Updated universal database with ${db.verses.length} verses`);
        }}
        onResetDatabase={handleResetDatabase}
      />

      {/* MODAL 5: VERSE CATALOG OVERLAY */}
      {isCatalogOpen && (
        <div
          onClick={() => setIsCatalogOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full">
            <VerseCatalog
              database={database}
              onSelectVerse={(v) => {
                setSelectedVerse(v);
                setIsCatalogOpen(false);
              }}
              onOpenAddVerseModal={() => {
                setIsCatalogOpen(false);
                setIsManualVerseOpen(true);
              }}
              onDeleteVerse={handleDeleteVerse}
              onClose={() => setIsCatalogOpen(false)}
            />
          </div>
        </div>
      )}

      {/* AUTHENTICATION GATE: ADMIN / 10509 REQUIRED TO ENTER THE SITE */}
      <LoginModal
        isOpen={!isAuthenticated}
        onLoginSuccess={async () => {
          setIsAuthenticated(true);
          await loadUniversalDatabase(false);
          showToast('Welcome, admin. Synced universal constellation.');
        }}
      />
    </div>
  );
}
