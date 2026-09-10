import React, { useState, useEffect } from 'react';
import { INITIAL_SCRIPTURE_DB } from './data/initialData';
import { ScriptureDatabase, Verse, Edge, Chain, RelationType } from './types';
import { GraphVisualization, SCRIPTURE_THEMES, RELATION_STYLES } from './components/GraphVisualization';
import { VerseCatalog } from './components/VerseCatalog';
import { ChainsViewer } from './components/ChainsViewer';
import { VerseDetailsModal } from './components/VerseDetailsModal';
import { BatchProposerModal } from './components/BatchProposerModal';
import { JsonManagerModal } from './components/JsonManagerModal';
import { ManualVerseModal } from './components/ManualVerseModal';
import {
  Plus,
  MoreHorizontal,
  Sparkles,
  FileCode,
  GitCommit,
  BookOpen,
  CheckCircle,
  FileText,
  Shield,
  RotateCcw,
  X,
  Compass,
} from 'lucide-react';

const STORAGE_KEY = 'scripture_graph_database_v1';

export default function App() {
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

  // Curator mode: false by default for pure contemplation & exploration
  const [isCuratorMode, setIsCuratorMode] = useState(false);

  // Selected verse for the minimal 2-item overlay
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // Active Argument Chain (if any, highlights path in constellation)
  const [activeChainId, setActiveChainId] = useState<string | null>(null);

  // Floating Modals / Overlays
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManualVerseOpen, setIsManualVerseOpen] = useState(false);
  const [isBatchProposerOpen, setIsBatchProposerOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isChainsOpen, setIsChainsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Filters
  const [activeScriptures, setActiveScriptures] = useState<Set<string>>(
    new Set(['MS', 'DB', 'BG', 'BP'])
  );
  const [activeRelations, setActiveRelations] = useState<Set<RelationType>>(
    new Set(['extends', 'supports', 'contrasts', 'restates', 'requires', 'exemplifies'])
  );
  const [numeralMode, setNumeralMode] = useState<'image-match' | 'devanagari' | 'latin'>('image-match');

  // Subtle toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch {
      // ignore
    }
  }, [database]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCommitBatch = (
    newVerses: Verse[],
    newEdges: Edge[],
    newChains: Chain[],
    reviewNotes?: string[]
  ) => {
    setDatabase((prev) => {
      const existingIds = new Set(prev.verses.map((v) => v.id));
      const freshVerses = newVerses.filter((v) => !existingIds.has(v.id));

      const edgeKey = (e: Edge) => `${e.from}::${e.to}`;
      const existingEdgeKeys = new Set(prev.edges.map(edgeKey));
      const freshEdges = newEdges.filter((e) => !existingEdgeKeys.has(edgeKey(e)));

      const mergedNotes = [
        ...(prev.review_notes || []),
        ...(reviewNotes || []).map((n) => `[${new Date().toLocaleTimeString()}]: ${n}`),
      ];

      return {
        ...prev,
        verses: [...prev.verses, ...freshVerses],
        edges: [...prev.edges, ...freshEdges],
        chains: [...prev.chains, ...newChains],
        review_notes: mergedNotes,
      };
    });

    showToast(`Merged ${newVerses.length} verses & ${newEdges.length} connections.`);
  };

  // Direct manipulation connection created on canvas
  const handleAddEdge = (edge: Edge) => {
    setDatabase((prev) => {
      const filtered = prev.edges.filter((e) => !(e.from === edge.from && e.to === edge.to));
      return {
        ...prev,
        edges: [...filtered, edge],
      };
    });
    showToast(`Linked ${edge.from} → ${edge.to} (${edge.relation})`);
  };

  const handleUpdateEdge = (from: string, to: string, updatedWhy: string) => {
    setDatabase((prev) => ({
      ...prev,
      edges: prev.edges.map((e) =>
        e.from === from && e.to === to ? { ...e, why: updatedWhy } : e
      ),
    }));
    showToast('Updated connection reasoning');
  };

  const handleDeleteEdge = (from: string, to: string) => {
    setDatabase((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => !(e.from === from && e.to === to)),
    }));
    showToast(`Removed link ${from} → ${to}`);
  };

  const handleAddVerse = (verse: Verse) => {
    setDatabase((prev) => ({
      ...prev,
      verses: [...prev.verses, verse],
    }));
    showToast(`Added ${verse.id}`);
  };

  const handleDeleteVerse = (verseId: string) => {
    setDatabase((prev) => ({
      ...prev,
      verses: prev.verses.filter((v) => v.id !== verseId),
      edges: prev.edges.filter((e) => e.from !== verseId && e.to !== verseId),
      chains: prev.chains.map((c) => ({
        ...c,
        sequence: c.sequence.filter((id) => id !== verseId),
      })),
    }));
    showToast(`Deleted ${verseId}`);
  };

  const handleAddChain = (chain: Chain) => {
    setDatabase((prev) => ({
      ...prev,
      chains: [...prev.chains, chain],
    }));
    showToast(`Saved chain: ${chain.title}`);
  };

  const handleDeleteChain = (chainId: string) => {
    setDatabase((prev) => ({
      ...prev,
      chains: prev.chains.filter((c) => c.id !== chainId),
    }));
    showToast('Deleted chain');
  };

  const handleResetDatabase = () => {
    setDatabase(INITIAL_SCRIPTURE_DB);
    showToast('Reset constellation to initial seed scripture database');
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

  const toggleRelationFilter = (rel: RelationType) => {
    setActiveRelations((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) {
        if (next.size > 1) next.delete(rel);
      } else {
        next.add(rel);
      }
      return next;
    });
  };

  const activeChain = database.chains.find((c) => c.id === activeChainId);

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

      {/* SINGLE MENU BUTTON (Top Right) */}
      <div className="absolute top-5 right-6 z-30">
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
            {/* Curator Mode Switch */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-stone-200 text-xs">Curator Mode</span>
                </div>
                <button
                  onClick={() => setIsCuratorMode(!isCuratorMode)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    isCuratorMode ? 'bg-amber-600' : 'bg-white/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isCuratorMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                {isCuratorMode
                  ? 'Wire connections by dragging from star to star. Tap connections to annotate.'
                  : 'Pure exploration & reading mode. Drag to pan and explore.'}
              </p>
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

            {/* Relation Lines Filter */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                Relation Filters:
              </span>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(RELATION_STYLES) as RelationType[]).map((rel) => {
                  const isActive = activeRelations.has(rel);
                  const style = RELATION_STYLES[rel];
                  return (
                    <button
                      key={rel}
                      onClick={() => toggleRelationFilter(rel)}
                      className={`px-2 py-0.5 rounded-full text-[10px] transition-colors border ${
                        isActive
                          ? 'bg-white/10 border-white/10 text-stone-200'
                          : 'bg-transparent border-white/5 text-stone-600'
                      }`}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                        style={{ backgroundColor: style.color }}
                      />
                      {rel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orb Numerals Mode */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                Orb Numerals:
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setNumeralMode('image-match')}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono text-center transition-colors border ${
                    numeralMode === 'image-match'
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Authentic: ६.१.१६ on Dasbodh, 178 on Shlok"
                >
                  Authentic
                </button>
                <button
                  onClick={() => setNumeralMode('devanagari')}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono text-center transition-colors border ${
                    numeralMode === 'devanagari'
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title="All Devanagari (१७८, ५.१.४०)"
                >
                  १ २ ३
                </button>
                <button
                  onClick={() => setNumeralMode('latin')}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono text-center transition-colors border ${
                    numeralMode === 'latin'
                      ? 'bg-amber-600/30 border-amber-400/50 text-amber-200'
                      : 'bg-white/5 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title="All Western (178, 5.1.40)"
                >
                  1 2 3
                </button>
              </div>
            </div>

            {/* Layers & Views */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <button
                onClick={() => {
                  setIsChainsOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                  Argument Chains
                </span>
                <span className="font-mono text-[10px] text-stone-500">
                  {database.chains.length}
                </span>
              </button>

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

              <button
                onClick={() => {
                  setIsNotesOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-stone-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Scholar Review Notes
                </span>
                <span className="font-mono text-[10px] text-stone-500">
                  {(database.review_notes || []).length}
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
            </div>
          </div>
        )}
      </div>

      {/* FULL-SCREEN INTERACTIVE CONSTELLATION GRAPH (Dominates 100% of the screen) */}
      <main className="w-full h-full">
        <GraphVisualization
          verses={database.verses}
          edges={database.edges}
          onSelectVerse={(v) => setSelectedVerse(v)}
          selectedVerseId={selectedVerse?.id || null}
          activeChainVerseIds={activeChain?.sequence}
          isCuratorMode={isCuratorMode}
          onAddEdge={handleAddEdge}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          activeScriptures={activeScriptures}
          activeRelations={activeRelations}
          numeralMode={numeralMode}
        />
      </main>

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

      {/* ACTIVE CHAIN HUD (If selected from menu) */}
      {activeChain && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-md w-full px-4">
          <div className="bg-[#12141e]/95 border border-amber-500/30 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-stone-200">{activeChain.title}</span>
                <span className="font-mono text-[10px] text-stone-500 block truncate">
                  {activeChain.sequence.join(' → ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveChainId(null)}
              className="p-1 text-stone-500 hover:text-white rounded"
              title="Clear chain highlight"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: POETIC MINIMAL VERSE DETAILS (Item 1: Devanagari, Item 2: Understated Ref) */}
      <VerseDetailsModal
        verse={selectedVerse}
        database={database}
        onClose={() => setSelectedVerse(null)}
        onDeleteVerse={handleDeleteVerse}
        isCuratorMode={isCuratorMode}
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
        onCommitBatch={handleCommitBatch}
      />

      {/* MODAL 4: JSON DATABASE & SCHEMA EXPORT */}
      <JsonManagerModal
        database={database}
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onUpdateDatabase={(db) => {
          setDatabase(db);
          showToast('Updated database from JSON');
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

      {/* MODAL 6: ARGUMENT CHAINS VIEWER OVERLAY */}
      {isChainsOpen && (
        <div
          onClick={() => setIsChainsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full">
            <ChainsViewer
              database={database}
              onSelectVerse={(v) => {
                setSelectedVerse(v);
                setIsChainsOpen(false);
              }}
              onAddChain={handleAddChain}
              onDeleteChain={handleDeleteChain}
              activeChainId={activeChainId}
              setActiveChainId={setActiveChainId}
              onClose={() => setIsChainsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL 7: SCHOLAR REVIEW NOTES OVERLAY */}
      {isNotesOpen && (
        <div
          onClick={() => setIsNotesOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#10111a] border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-stone-100 text-sm">
                  Scholar Doctrinal Review Flags
                </h3>
              </div>
              <button
                onClick={() => setIsNotesOpen(false)}
                className="p-1 text-stone-500 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 text-xs">
              {(database.review_notes || []).length === 0 ? (
                <p className="text-stone-500 italic p-4 text-center">
                  No flags recorded. All scriptures and edges align with orthodox scholarship.
                </p>
              ) : (
                (database.review_notes || []).map((note, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 text-stone-300 font-serif leading-relaxed"
                  >
                    {note}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
