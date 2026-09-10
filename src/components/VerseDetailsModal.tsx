import React, { useState, useEffect } from 'react';
import { Verse, ScriptureDatabase, Edge, RelationType } from '../types';
import { X, Trash2, Link as LinkIcon, Plus } from 'lucide-react';
import { RELATION_STYLES } from './GraphVisualization';

interface VerseDetailsModalProps {
  verse: Verse | null;
  database: ScriptureDatabase;
  onClose: () => void;
  onDeleteVerse?: (verseId: string) => void;
  onAddEdge?: (edge: Edge) => void;
  onDeleteEdge?: (from: string, to: string) => void;
  isCuratorMode?: boolean;
}

const ALL_RELATIONS: RelationType[] = [
  'extends',
  'supports',
  'contrasts',
  'restates',
  'requires',
  'exemplifies',
];

export const VerseDetailsModal: React.FC<VerseDetailsModalProps> = ({
  verse,
  database,
  onClose,
  onDeleteVerse,
  onAddEdge,
  onDeleteEdge,
}) => {
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [targetVerseId, setTargetVerseId] = useState<string>('');
  const [selectedRelation, setSelectedRelation] = useState<RelationType>('supports');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset linking form when verse changes
  useEffect(() => {
    setIsLinkingOpen(false);
    if (verse) {
      const otherVerses = database.verses.filter((v) => v.id !== verse.id);
      if (otherVerses.length > 0) {
        setTargetVerseId(otherVerses[0].id);
      }
    }
  }, [verse, database.verses]);

  if (!verse) return null;

  // Find incoming & outgoing edges for this verse
  const connectedEdges = database.edges.filter(
    (e) => e.from === verse.id || e.to === verse.id
  );

  const handleCreateLink = () => {
    if (!targetVerseId || !onAddEdge) return;
    onAddEdge({
      from: verse.id,
      to: targetVerseId,
      relation: selectedRelation,
      why: '',
    });
    setIsLinkingOpen(false);
  };

  const otherVerses = database.verses.filter((v) => v.id !== verse.id);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#101117]/95 border border-white/10 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Understated Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-300 hover:bg-white/5 rounded-full transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Full verse text in Devanagari (Hero of the interaction) */}
        <div className="font-devanagari text-xl sm:text-2xl text-stone-100 font-normal leading-relaxed whitespace-pre-line tracking-wide selection:bg-amber-900/40">
          {verse.text}
        </div>

        {/* 2. Small, understated reference caption */}
        <div className="text-stone-400/90 text-xs sm:text-sm font-devanagari tracking-wider mt-4 font-medium">
          {verse.display_ref}
        </div>

        {/* 3. Connected Verses & Linking Tools */}
        <div className="mt-6 pt-4 border-t border-white/10 w-full text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <LinkIcon className="w-3 h-3 text-amber-400" />
              Connected Verses ({connectedEdges.length})
            </span>
            <button
              onClick={() => setIsLinkingOpen(!isLinkingOpen)}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20"
            >
              <Plus className="w-3 h-3" />
              {isLinkingOpen ? 'Cancel' : 'Link Verse'}
            </button>
          </div>

          {/* Inline Link Creator */}
          {isLinkingOpen && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                  Connect to Target Verse:
                </label>
                <select
                  value={targetVerseId}
                  onChange={(e) => setTargetVerseId(e.target.value)}
                  className="w-full bg-[#161824] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 font-sans focus:outline-none focus:border-amber-400"
                >
                  {otherVerses.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} ({v.display_ref}) — {v.text.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-1.5">
                  Relation Type:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_RELATIONS.map((rel) => {
                    const style = RELATION_STYLES[rel];
                    const isSel = selectedRelation === rel;
                    return (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => setSelectedRelation(rel)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          isSel
                            ? 'ring-2 ring-white text-white font-semibold shadow-md'
                            : 'opacity-70 hover:opacity-100 text-white/90'
                        }`}
                        style={{ backgroundColor: style.color }}
                      >
                        {rel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCreateLink}
                className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wide transition-colors"
              >
                Create Connection
              </button>
            </div>
          )}

          {/* List existing links */}
          {connectedEdges.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {connectedEdges.map((e, idx) => {
                const isSource = e.from === verse.id;
                const otherId = isSource ? e.to : e.from;
                const otherVerse = database.verses.find((v) => v.id === otherId);
                const style = RELATION_STYLES[e.relation];

                return (
                  <div
                    key={`${e.from}-${e.to}-${idx}`}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white shrink-0"
                        style={{ backgroundColor: style.color }}
                      >
                        {e.relation}
                      </span>
                      <span className="font-mono text-stone-400 text-[11px]">
                        {isSource ? '→' : '←'}
                      </span>
                      <span className="text-stone-300 truncate font-devanagari text-[11px]">
                        {otherVerse?.display_ref || otherId}
                      </span>
                    </div>

                    {onDeleteEdge && (
                      <button
                        onClick={() => onDeleteEdge(e.from, e.to)}
                        className="text-stone-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove Link"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subtle low-profile tools tucked at the bottom */}
        <div className="mt-6 pt-3 border-t border-white/5 w-full flex items-center justify-between text-[11px] text-stone-500 font-mono">
          <span>ID: {verse.id}</span>
          {onDeleteVerse && (
            <button
              onClick={() => {
                if (confirm(`Delete verse ${verse.id} from database?`)) {
                  onDeleteVerse(verse.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Verse
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
