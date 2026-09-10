import React, { useState } from 'react';
import { Verse, Edge, Chain, ScriptureDatabase, RelationType } from '../types';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

interface BatchProposerModalProps {
  database: ScriptureDatabase;
  isOpen: boolean;
  onClose: () => void;
  onCommitBatch: (newVerses: Verse[], newEdges: Edge[], newChains: Chain[], reviewNotes?: string[]) => void;
}

const PRESET_EXAMPLES = [
  {
    label: 'Bhagavad Gita 2.23 (Classical Sanskrit parallel to DB-6.1.16)',
    text: `Scripture: BG
Chapter: 2, Verse: 23
Devanagari:
नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।
न चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥ २३ ॥`,
  },
  {
    label: 'Manache Shlok 1 (Invocation & Resolution of Mind)',
    text: `Scripture: MS
Shlok: 1
Devanagari:
गणाधीश जो ईश सर्वां गुणांचा ।
मुळारंभ आरंभ तो निर्गुणाचा ॥
नमूं शारदा मूळ चत्वार वाचा ।
गमूं पंथ आनंत या राघवाचा ॥ १ ॥`,
  },
  {
    label: 'Dasbodh 1.1.1 (Grantharambha Samas)',
    text: `Scripture: DB
Dashak: 1, Samas: 1, Ovi: 1
Devanagari:
श्रोते पुसती कोण ग्रंथ । काय याचे जी फलित ।
कोण अधिकारि प्रवृत्त । येथें व्हावें ॥ १ ॥`,
  },
];

export const BatchProposerModal: React.FC<BatchProposerModalProps> = ({
  database,
  isOpen,
  onClose,
  onCommitBatch,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staging state
  const [proposedVerses, setProposedVerses] = useState<Verse[]>([]);
  const [proposedEdges, setProposedEdges] = useState<Edge[]>([]);
  const [proposedChains, setProposedChains] = useState<Chain[]>([]);
  const [reviewNotes, setReviewNotes] = useState<string[]>([]);
  const [selectedEdgeIndices, setSelectedEdgeIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handlePropose = async () => {
    if (!rawInput.trim()) {
      setError('Please provide raw verses Devanagari text, scripture, and locator.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/propose-verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput,
          currentDatabase: database,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setProposedVerses(data.verses || []);
      setProposedEdges(data.edges || []);
      setProposedChains(data.chains || []);
      setReviewNotes(data.review_notes || []);

      // Auto-select proposed edges by default for convenience
      const indices = new Set<number>();
      (data.edges || []).forEach((_: any, idx: number) => indices.add(idx));
      setSelectedEdgeIndices(indices);
    } catch (err: any) {
      console.error('Batch proposer error:', err);
      setError(err.message || 'Failed to process raw verses.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEdgeSelection = (idx: number) => {
    setSelectedEdgeIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCommit = () => {
    const approvedEdges = proposedEdges.filter((_, idx) => selectedEdgeIndices.has(idx));
    onCommitBatch(proposedVerses, approvedEdges, proposedChains, reviewNotes);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRawInput('');
    setProposedVerses([]);
    setProposedEdges([]);
    setProposedChains([]);
    setReviewNotes([]);
    setSelectedEdgeIndices(new Set());
    setError(null);
  };

  const hasResults = proposedVerses.length > 0 || proposedEdges.length > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10111a] rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/80 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-100 text-sm">
                Scholar Ingestion & Edge Proposer
              </h3>
              <p className="text-[11px] text-stone-400">
                Faithful Devanagari ingestion, restrained thematic analysis & closed-vocabulary argumentative links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Rules Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Scholar Restraint Directive:</span> Reproduces Devanagari verbatim without modernization. Proposes edges only within closed vocabulary (<code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-amber-200">extends, supports, contrasts, restates, requires, exemplifies</code>) with concise reasoning. Zero forced connections.
            </div>
          </div>

          {/* Preset Pickers */}
          <div>
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
              Quick Test Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawInput(ex.text)}
                  className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 rounded-lg transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="raw-verse-input" className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Raw Verses Input (Devanagari Text + Scripture + Locator):
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                Supports multiple verses in one batch
              </span>
            </div>
            <textarea
              id="raw-verse-input"
              rows={5}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={`Paste your raw verse(s) here, e.g.:

Scripture: BG
Chapter: 2, Verse: 23
नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।
न चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥ २३ ॥`}
              className="w-full p-3 font-mono text-xs border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none bg-[#090a0e] text-stone-100"
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePropose}
              disabled={isLoading || !rawInput.trim()}
              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Text & Theological Connections...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze & Propose Candidate Edges
                </>
              )}
            </button>

            {hasResults && (
              <button
                onClick={handleReset}
                className="text-stone-400 hover:text-white underline text-xs"
              >
                Clear Results
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Staging & Review Area */}
          {hasResults && (
            <div className="pt-4 border-t border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-stone-100 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Candidate Staging Area (Review Before Merging)
                </h4>
                <span className="text-[11px] text-stone-400 font-mono">
                  {proposedVerses.length} verses · {selectedEdgeIndices.size} of {proposedEdges.length} edges selected
                </span>
              </div>

              {/* Review Notes */}
              {reviewNotes.length > 0 && (
                <div className="p-3 bg-sky-950/50 border border-sky-800 rounded-xl text-sky-200 space-y-1">
                  <span className="font-semibold block uppercase tracking-wider text-[10px] text-sky-400">
                    Scholar Doctrinal Review Flags:
                  </span>
                  {reviewNotes.map((note, nIdx) => (
                    <p key={nIdx} className="italic pl-2 border-l border-sky-400/50">
                      • {note}
                    </p>
                  ))}
                </div>
              )}

              {/* Proposed Verses */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  1. Parsed Verses (Devanagari Verbatim):
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {proposedVerses.map((v) => (
                    <div key={v.id} className="p-3 bg-[#131520] border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 bg-white/10 text-stone-200 font-mono text-[11px] rounded">
                          {v.id} ({v.display_ref})
                        </span>
                        <div className="flex gap-1">
                          {v.theme_tags?.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white/5 text-stone-400 rounded text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="font-devanagari text-sm text-stone-100 whitespace-pre-line leading-relaxed pl-2 border-l border-amber-500/40">
                        {v.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Edges */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  2. Candidate Argumentative Edges (Select to approve):
                </span>
                {proposedEdges.length === 0 ? (
                  <div className="p-3 bg-[#131520] border border-dashed border-white/10 rounded-xl text-stone-500 text-center italic">
                    Restraint exercised: No genuine argumentative links found with existing verses.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proposedEdges.map((e, idx) => {
                      const isSelected = selectedEdgeIndices.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleEdgeSelection(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/60'
                              : 'bg-[#131520] border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-stone-600 bg-black/40'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <span className="font-mono text-xs text-stone-200">
                                {e.from} → {e.to}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-stone-300 uppercase">
                              {e.relation}
                            </span>
                          </div>
                          <p className="text-stone-300 italic font-serif pl-6 text-xs leading-relaxed">
                            "{e.why}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#141622] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-white/10 text-stone-400 hover:text-white rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>

          {hasResults && (
            <button
              onClick={handleCommit}
              disabled={proposedVerses.length === 0}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Commit to Constellation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
