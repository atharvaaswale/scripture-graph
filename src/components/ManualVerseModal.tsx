import React, { useState } from 'react';
import { Verse, ScriptureDatabase, ScriptureDef } from '../types';
import { X, Sparkles } from 'lucide-react';

interface ManualVerseModalProps {
  database: ScriptureDatabase;
  isOpen: boolean;
  onClose: () => void;
  onAddVerse: (verse: Verse) => void;
}

export const ManualVerseModal: React.FC<ManualVerseModalProps> = ({
  database,
  isOpen,
  onClose,
  onAddVerse,
}) => {
  const [scripture, setScripture] = useState('MS');
  const [id, setId] = useState('');
  const [displayRef, setDisplayRef] = useState('');
  const [text, setText] = useState('');
  const [themeTagsInput, setThemeTagsInput] = useState('');
  const [locators, setLocators] = useState<Record<string, number | string>>({ shlok: 1 });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentScriptureDef = database.scriptures[scripture];

  const handleScriptureChange = (sc: string) => {
    setScripture(sc);
    const def = database.scriptures[sc];
    const initialLoc: Record<string, number | string> = {};
    (def?.locator_fields || []).forEach((f) => {
      initialLoc[f] = 1;
    });
    setLocators(initialLoc);
  };

  const handleLocatorChange = (field: string, val: string) => {
    const num = parseInt(val, 10);
    setLocators((prev) => ({
      ...prev,
      [field]: isNaN(num) ? val : num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Devanagari text is required.');
      return;
    }

    let calculatedId = id.trim();
    if (!calculatedId) {
      if (scripture === 'MS') calculatedId = `MS-${locators.shlok || 1}`;
      else if (scripture === 'DB') calculatedId = `DB-${locators.dashak || 1}.${locators.samas || 1}.${locators.ovi || 1}`;
      else if (scripture === 'BG') calculatedId = `BG-${locators.chapter || 1}.${locators.verse || 1}`;
      else calculatedId = `${scripture}-${Object.values(locators).join('.')}`;
    }

    if (database.verses.some((v) => v.id === calculatedId)) {
      setError(`Verse ID "${calculatedId}" already exists.`);
      return;
    }

    const calculatedRef =
      displayRef.trim() ||
      `${currentScriptureDef?.full_name || scripture} ${Object.values(locators).join('.')}`;

    const tags = themeTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddVerse({
      id: calculatedId,
      scripture,
      locator: locators,
      display_ref: calculatedRef,
      text: text.trim(),
      theme_tags: tags,
      translation: { en: null, mr: null },
      notes: null,
    });

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141f] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-stone-200"
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-stone-100 text-sm">
              Add Scripture Verse to Constellation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-500 hover:text-stone-300 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
                Scripture:
              </label>
              <select
                value={scripture}
                onChange={(e) => handleScriptureChange(e.target.value)}
                className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                {Object.entries(database.scriptures).map(([code, def]) => {
                  const sDef = def as ScriptureDef;
                  return (
                    <option key={code} value={code}>
                      {code} - {sDef.full_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
                ID (optional):
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
              Locator Coordinates:
            </label>
            <div className="flex gap-2">
              {(currentScriptureDef?.locator_fields || ['shlok']).map((field) => (
                <div key={field} className="flex-1">
                  <span className="text-[10px] text-stone-500 uppercase">{field}:</span>
                  <input
                    type="number"
                    value={locators[field] || ''}
                    onChange={(e) => handleLocatorChange(field, e.target.value)}
                    className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
              Display Reference:
            </label>
            <input
              type="text"
              value={displayRef}
              onChange={(e) => setDisplayRef(e.target.value)}
              placeholder="e.g. मनाचे श्लोक १८० or दासबोध ५.२.१"
              className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none font-devanagari"
            />
          </div>

          <div>
            <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
              Devanagari Verse Text (Verbatim):
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter exact verse text in Devanagari..."
              className="w-full p-3 bg-[#090a0e] border border-white/10 rounded-lg text-stone-100 focus:ring-1 focus:ring-amber-500 outline-none font-devanagari text-sm leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider block mb-1">
              Theme Tags (comma separated):
            </label>
            <input
              type="text"
              value={themeTagsInput}
              onChange={(e) => setThemeTagsInput(e.target.value)}
              placeholder="e.g. Guru, discrimination, Atman, devotion"
              className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-all shadow-sm"
            >
              Add Star
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
