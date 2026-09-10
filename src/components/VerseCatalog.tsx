import React, { useState, useMemo } from 'react';
import { Verse, ScriptureDatabase } from '../types';
import { Search, Plus, Trash2, X } from 'lucide-react';

interface VerseCatalogProps {
  database: ScriptureDatabase;
  onSelectVerse: (verse: Verse) => void;
  onOpenAddVerseModal: () => void;
  onDeleteVerse: (verseId: string) => void;
  onClose?: () => void;
}

export const VerseCatalog: React.FC<VerseCatalogProps> = ({
  database,
  onSelectVerse,
  onOpenAddVerseModal,
  onDeleteVerse,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScripture, setSelectedScripture] = useState<string>('ALL');

  const filteredVerses = useMemo(() => {
    return database.verses.filter((v) => {
      const matchesScripture = selectedScripture === 'ALL' || v.scripture === selectedScripture;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesScripture;

      const matchesText = v.text.toLowerCase().includes(q);
      const matchesId = v.id.toLowerCase().includes(q);
      const matchesRef = v.display_ref.toLowerCase().includes(q);
      const matchesTags = (v.theme_tags || []).some((t) => t.toLowerCase().includes(q));

      return matchesScripture && (matchesText || matchesId || matchesRef || matchesTags);
    });
  }, [database.verses, searchQuery, selectedScripture]);

  const scriptureCodes = Object.keys(database.scriptures);

  return (
    <div className="bg-[#10111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[82vh] text-stone-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#141622] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verse text, ref, tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0a0b10] border border-white/10 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-500/60 outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedScripture('ALL')}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedScripture === 'ALL'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All ({database.verses.length})
            </button>
            {scriptureCodes.map((code) => {
              const count = database.verses.filter((v) => v.scripture === code).length;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedScripture(code)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    selectedScripture === code
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {code} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onOpenAddVerseModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Verse
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Verses Table */}
      <div className="divide-y divide-white/5 overflow-y-auto flex-1">
        {filteredVerses.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs italic">
            No verses found matching query.
          </div>
        ) : (
          filteredVerses.map((verse) => {
            const outgoingCount = database.edges.filter((e) => e.from === verse.id).length;
            const incomingCount = database.edges.filter((e) => e.to === verse.id).length;

            return (
              <div
                key={verse.id}
                onClick={() => onSelectVerse(verse)}
                className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-white/10 text-stone-300 font-mono text-[10px] rounded">
                      {verse.id}
                    </span>
                    <span className="font-medium text-xs text-stone-300 font-devanagari">
                      {verse.display_ref}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {verse.theme_tags?.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 bg-white/5 text-stone-400 rounded text-[9px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="font-devanagari text-stone-200 text-sm whitespace-pre-line leading-relaxed pl-2 border-l border-amber-500/40">
                    {verse.text}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] text-stone-500 font-mono">
                    {outgoingCount} out · {incomingCount} in
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete verse ${verse.id}?`)) {
                        onDeleteVerse(verse.id);
                      }
                    }}
                    className="p-1 text-stone-600 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
