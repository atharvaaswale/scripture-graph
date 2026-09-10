import React, { useState } from 'react';
import { Chain, ScriptureDatabase, Verse } from '../types';
import { GitCommit, ArrowRight, Plus, Trash2, X } from 'lucide-react';

interface ChainsViewerProps {
  database: ScriptureDatabase;
  onSelectVerse: (verse: Verse) => void;
  onAddChain: (chain: Chain) => void;
  onDeleteChain: (chainId: string) => void;
  activeChainId: string | null;
  setActiveChainId: (chainId: string | null) => void;
  onClose?: () => void;
}

export const ChainsViewer: React.FC<ChainsViewerProps> = ({
  database,
  onSelectVerse,
  onAddChain,
  onDeleteChain,
  activeChainId,
  setActiveChainId,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeqText, setNewSeqText] = useState('');

  const activeChain = database.chains.find((c) => c.id === activeChainId) || database.chains[0];

  const getVerse = (id: string) => database.verses.find((v) => v.id === id);

  const getConnectingEdge = (fromId: string, toId: string) => {
    return database.edges.find((e) => e.from === fromId && e.to === toId);
  };

  const handleCreateChain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSeqText.trim()) return;

    const sequence = newSeqText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (sequence.length < 2) {
      alert('A chain must have at least 2 verse IDs.');
      return;
    }

    const id = `chain-${Date.now().toString(36)}`;
    onAddChain({
      id,
      title: newTitle.trim(),
      sequence,
    });

    setActiveChainId(id);
    setNewTitle('');
    setNewSeqText('');
    setIsCreating(false);
  };

  return (
    <div className="bg-[#10111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[560px] text-stone-200">
      {/* Sidebar: Chains List */}
      <div className="w-full md:w-72 border-r border-white/10 flex flex-col bg-[#141622]">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-stone-200 text-xs">
              Argument Chains ({database.chains.length})
            </h3>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1 text-stone-400 hover:text-white rounded transition-colors"
            title="Create Chain"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateChain} className="p-3 border-b border-white/10 bg-[#0d0e14] space-y-2 text-xs">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Chain Theme Title"
              className="w-full p-1.5 bg-black/40 border border-white/10 rounded text-stone-200 text-xs outline-none"
              required
            />
            <input
              type="text"
              value={newSeqText}
              onChange={(e) => setNewSeqText(e.target.value)}
              placeholder="Verse IDs: MS-179, DB-5.1.40"
              className="w-full p-1.5 bg-black/40 border border-white/10 rounded text-stone-200 text-xs font-mono outline-none"
              required
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 text-stone-400 text-[11px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-medium"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {database.chains.map((chain) => (
            <div
              key={chain.id}
              onClick={() => setActiveChainId(chain.id)}
              className={`p-3 cursor-pointer transition-colors flex items-center justify-between group ${
                activeChain?.id === chain.id
                  ? 'bg-amber-500/10 border-l-2 border-amber-500'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-medium text-stone-200">{chain.title}</div>
                <div className="text-[10px] text-stone-500 font-mono">
                  {chain.sequence.length} steps · {chain.sequence.join(' → ')}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete chain "${chain.title}"?`)) onDeleteChain(chain.id);
                }}
                className="p-1 text-stone-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Active Chain Steps */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0e14]">
        {/* Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-stone-100 text-xs">{activeChain?.title || 'Select a Chain'}</h4>
            <span className="text-[10px] text-stone-500 font-mono">
              Highlighted as luminous trajectory in Constellation
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-stone-500 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sequence Steps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeChain ? (
            activeChain.sequence.map((verseId, idx) => {
              const verse = getVerse(verseId);
              const nextVerseId = activeChain.sequence[idx + 1];
              const connectingEdge = nextVerseId ? getConnectingEdge(verseId, nextVerseId) : null;

              return (
                <div key={verseId} className="space-y-2">
                  <div
                    onClick={() => verse && onSelectVerse(verse)}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#131520] hover:bg-[#181a28] cursor-pointer transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs text-stone-300 font-bold">{verseId}</span>
                        <span className="text-xs text-stone-400 font-devanagari">
                          {verse?.display_ref}
                        </span>
                      </div>
                      <div className="font-devanagari text-xs text-stone-200 leading-relaxed pl-2 border-l border-amber-500/40">
                        {verse?.text || '(Verse text missing)'}
                      </div>
                    </div>
                  </div>

                  {nextVerseId && (
                    <div className="pl-6 py-1 flex items-center gap-2 text-[11px] text-stone-400">
                      <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                      {connectingEdge ? (
                        <span className="font-serif italic text-stone-400">
                          [{connectingEdge.relation}] {connectingEdge.why ? `"${connectingEdge.why}"` : ''}
                        </span>
                      ) : (
                        <span className="text-stone-600 italic">No direct edge in database</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-stone-500 text-xs italic">
              No active chain selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
