import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SCRIPTURE_DB } from './data/initialData';
import { ScriptureDatabase, Verse, Edge, NodePosition } from './types';
import { GraphVisualization, SCRIPTURE_THEMES } from './components/GraphVisualization';
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
} from 'lucide-react';

const STORAGE_KEY = 'scripture_graph_database_v1';

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
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_SCRIPTURE_DB;
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

  // Scripture Filters
  const [activeScriptures, setActiveScriptures] = useState<Set<string>>(
    new Set(['MS', 'DB', 'BG', 'BP'])
  );

  // Curator Mode vs Move Mode toggle
  const [isCuratorMode, setIsCuratorMode] = useState(false);

  // Orb Numerals Mode: Devanagari or English numbers
  const [numeralMode, setNumeralMode] = useState<'devanagari' | 'latin'>('devanagari');

  // Subtle toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const savePositionsDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Universal Database from Server on Mount
  // Makes sure whichever device opens the site, it loads the universal JSON file & positions
  useEffect(() => {
    let isMounted = true;
    async function loadUniversalDatabase() {
      try {
        setIsLoadingDb(true);
        const res = await fetch('/api/database');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.verses) && isMounted) {
            setDatabase(data);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Could not load universal database from server, using local fallback:', err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    }
    loadUniversalDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Persist full database to universal server JSON and local cache
  const persistUniversalDatabase = async (newDb: ScriptureDatabase) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
      await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDb),
      });
    } catch (err) {
      console.error('Failed to persist universal database to server:', err);
    }
  };

  // Remember how user arranged nodes
  const handleSaveNodePosition = (id: string, position: NodePosition) => {
    setDatabase((prev) => {
      const updatedPositions = {
        ...(prev.node_positions || {}),
        [id]: position,
      };
      const newDb = {
        ...prev,
        node_positions: updatedPositions,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
      } catch (e) {}

      // Debounce network write to server positions endpoint
      if (savePositionsDebounceRef.current) {
        clearTimeout(savePositionsDebounceRef.current);
      }
      savePositionsDebounceRef.current = setTimeout(() => {
        fetch('/api/database/positions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positions: { [id]: position } }),
        }).catch((err) => console.warn('Failed to save arranged node position:', err));
      }, 250);

      return newDb;
    });
  };

  const handleCommitBatch = (
    newVerses: Verse[],
    newEdges: Edge[]
  ) => {
    setDatabase((prev) => {
      const existingIds = new Set(prev.verses.map((v) => v.id));
      const freshVerses = newVerses.filter((v) => !existingIds.has(v.id));

      const edgeKey = (e: Edge) => `${e.from}::${e.to}`;
      const existingEdgeKeys = new Set(prev.edges.map(edgeKey));
      const freshEdges = newEdges.filter((e) => !existingEdgeKeys.has(edgeKey(e)));

      const newDb = {
        ...prev,
        verses: [...prev.verses, ...freshVerses],
        edges: [...prev.edges, ...freshEdges],
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });

    showToast(`Merged ${newVerses.length} verses & ${newEdges.length} connections to universal database.`);
  };

  // Direct manipulation connection created on canvas or modal
  const handleAddEdge = (edge: Edge) => {
    setDatabase((prev) => {
      const filtered = prev.edges.filter((e) => !(e.from === edge.from && e.to === edge.to));
      const newDb = {
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
      const newDb = {
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
      const newDb = {
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
      const newDb = {
        ...prev,
        verses: [...prev.verses, verse],
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Added ${verse.id} to universal database`);
  };

  const handleDeleteVerse = (verseId: string) => {
    setDatabase((prev) => {
      const updatedPositions = { ...(prev.node_positions || {}) };
      delete updatedPositions[verseId];
      const newDb = {
        ...prev,
        verses: prev.verses.filter((v) => v.id !== verseId),
        edges: prev.edges.filter((e) => e.from !== verseId && e.to !== verseId),
        node_positions: updatedPositions,
      };
      persistUniversalDatabase(newDb);
      return newDb;
    });
    showToast(`Deleted ${verseId} from universal database`);
  };

  const handleResetDatabase = () => {
    fetch('/api/database/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.database) {
          setDatabase(data.database);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.database));
          showToast('Reset universal database to initial seed scripture database');
        }
      })
      .catch(() => {
        setDatabase(INITIAL_SCRIPTURE_DB);
        persistUniversalDatabase(INITIAL_SCRIPTURE_DB);
        showToast('Reset constellation to initial seed scripture database');
      });
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
          Scripture Constellation · {database.verses.length} verses
        </p>
      </div>

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
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                Scripture Glow:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(SCRIPTURE_THEMES).map(([code, theme]) => {
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
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.core }}
                      />
                      <span>{code}</span>
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
        onUpdateDatabase={(db) => {
          setDatabase(db);
          persistUniversalDatabase(db);
          showToast('Updated universal database from JSON');
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
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          showToast('Welcome, admin');
        }}
      />
    </div>
  );
}
