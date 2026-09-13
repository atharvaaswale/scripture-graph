import React, { useState } from 'react';
import { Verse, ScriptureDatabase, ScriptureDef } from '../types';
import { X, Sparkles, Plus, BookOpen, Check } from 'lucide-react';

interface ManualVerseModalProps {
  database: ScriptureDatabase;
  isOpen: boolean;
  onClose: () => void;
  onAddVerse: (verse: Verse) => void;
  onAddScripture?: (code: string, def: ScriptureDef) => void;
}

const COMMON_SCRIPTURE_PRESETS: Array<{
  code: string;
  full_name: string;
  author: string;
  language: string;
  locator_fields: string[];
}> = [
  { code: 'JN', full_name: 'Jnaneshwari (Bhavartha Dipika)', author: 'Sant Dnyaneshwar', language: 'Marathi', locator_fields: ['adhyaya', 'ovi'] },
  { code: 'AG', full_name: 'Ashtavakra Gita', author: 'Sage Ashtavakra', language: 'Sanskrit', locator_fields: ['chapter', 'verse'] },
  { code: 'UP', full_name: 'Upanishads', author: 'Vedic Rishis', language: 'Sanskrit', locator_fields: ['upanishad', 'khanda', 'mantra'] },
  { code: 'TG', full_name: 'Tukaram Gatha', author: 'Sant Tukaram', language: 'Marathi', locator_fields: ['abhanga'] },
  { code: 'YV', full_name: 'Yoga Vasistha', author: 'Sage Valmiki', language: 'Sanskrit', locator_fields: ['prakarana', 'sarga', 'shloka'] },
  { code: 'VC', full_name: 'Vivekachudamani', author: 'Adi Shankaracharya', language: 'Sanskrit', locator_fields: ['shloka'] },
  { code: 'AM', full_name: 'Amritanubhava', author: 'Sant Dnyaneshwar', language: 'Marathi', locator_fields: ['prakarana', 'ovi'] },
  { code: 'EB', full_name: 'Eknathi Bhagavata', author: 'Sant Eknath', language: 'Marathi', locator_fields: ['adhyaya', 'ovi'] },
  { code: 'RV', full_name: 'Rigveda Samhita', author: 'Vedic Rishis', language: 'Sanskrit', locator_fields: ['mandala', 'sukta', 'mantra'] },
  { code: 'BS', full_name: 'Brahma Sutras', author: 'Badarayana', language: 'Sanskrit', locator_fields: ['adhyaya', 'pada', 'sutra'] },
  { code: 'SS', full_name: 'Shiva Sutras', author: 'Sage Vasugupta', language: 'Sanskrit', locator_fields: ['unmesha', 'sutra'] },
  { code: 'VR', full_name: 'Valmiki Ramayana', author: 'Sage Valmiki', language: 'Sanskrit', locator_fields: ['kanda', 'sarga', 'shloka'] },
  { code: 'MB', full_name: 'Mahabharata', author: 'Sage Vyasa', language: 'Sanskrit', locator_fields: ['parva', 'adhyaya', 'shloka'] },
];

export const ManualVerseModal: React.FC<ManualVerseModalProps> = ({
  database,
  isOpen,
  onClose,
  onAddVerse,
  onAddScripture,
}) => {
  const [scripture, setScripture] = useState('MS');
  const [id, setId] = useState('');
  const [displayRef, setDisplayRef] = useState('');
  const [text, setText] = useState('');
  const [themeTagsInput, setThemeTagsInput] = useState('');
  const [locators, setLocators] = useState<Record<string, number | string>>({ shlok: 1 });
  const [error, setError] = useState<string | null>(null);

  // Adding new scripture state
  const [isAddingScripture, setIsAddingScripture] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newLanguage, setNewLanguage] = useState('Sanskrit');
  const [newLocatorFields, setNewLocatorFields] = useState('chapter, verse');
  const [newScriptureError, setNewScriptureError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentScriptureDef = database.scriptures[scripture];

  // Presets not yet in database
  const availablePresets = COMMON_SCRIPTURE_PRESETS.filter(
    (p) => !database.scriptures[p.code]
  );

  const resetForm = (sc: string = scripture) => {
    setId('');
    setDisplayRef('');
    setText('');
    setThemeTagsInput('');
    setError(null);
    const def = database.scriptures[sc];
    const initialLoc: Record<string, number | string> = {};
    (def?.locator_fields || ['shlok']).forEach((f) => {
      initialLoc[f] = 1;
    });
    setLocators(initialLoc);
  };

  const handleScriptureChange = (sc: string) => {
    setScripture(sc);
    const def = database.scriptures[sc];
    const initialLoc: Record<string, number | string> = {};
    (def?.locator_fields || ['shlok']).forEach((f) => {
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

  const handleSaveNewScripture = () => {
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      setNewScriptureError('Please provide a scripture code (e.g. RV, BS, SS)');
      return;
    }
    if (!newFullName.trim()) {
      setNewScriptureError('Please provide the full title of the scripture');
      return;
    }

    const fields = newLocatorFields
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const def: ScriptureDef = {
      full_name: newFullName.trim(),
      author: newAuthor.trim() || 'Traditional',
      language: newLanguage.trim() || 'Sanskrit',
      locator_fields: fields.length > 0 ? fields : ['shlok'],
    };

    if (onAddScripture) {
      onAddScripture(cleanCode, def);
    } else {
      // Local fallback
      database.scriptures[cleanCode] = def;
    }

    handleScriptureChange(cleanCode);
    setIsAddingScripture(false);
    setNewScriptureError(null);
    setNewCode('');
    setNewFullName('');
    setNewAuthor('');
    setNewLocatorFields('chapter, verse');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Devanagari text is required.');
      return;
    }

    // Build locator coordinates string, e.g. "6.1.12", "2.23", "180"
    let locatorCoordsStr = '';
    if (scripture === 'MS') {
      locatorCoordsStr = String(locators.shlok ?? 1);
    } else if (scripture === 'DB') {
      locatorCoordsStr = `${locators.dashak ?? 1}.${locators.samas ?? 1}.${locators.ovi ?? 1}`;
    } else if (scripture === 'BG') {
      locatorCoordsStr = `${locators.chapter ?? 1}.${locators.verse ?? 1}`;
    } else {
      const fields = currentScriptureDef?.locator_fields || Object.keys(locators);
      locatorCoordsStr = fields.map((f) => locators[f] ?? 1).join('.');
    }

    let calculatedId = id.trim();
    if (!calculatedId) {
      calculatedId = `${scripture}-${locatorCoordsStr}`;
    }

    if (database.verses.some((v) => v.id === calculatedId)) {
      setError(`Verse ID "${calculatedId}" already exists.`);
      return;
    }

    // If display reference is empty, automatically format as "[Scripture Code] [Locator coordinates]" e.g. "DB 6.1.12" or "BG 2.23"
    const calculatedRef =
      displayRef.trim() ||
      `${scripture} ${locatorCoordsStr}`;

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

    // Clear form after star is added successfully
    resetForm(scripture);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141f] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-stone-200"
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Scripture Selection + Add Option */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-400 text-[10px] uppercase font-mono tracking-wider">
                  Scripture:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingScripture((prev) => !prev)}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{isAddingScripture ? 'Close' : '+ Add More'}</span>
                </button>
              </div>
              <select
                value={scripture}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingScripture(true);
                  } else {
                    handleScriptureChange(e.target.value);
                  }
                }}
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
                <option value="__ADD_NEW__" className="text-amber-300 font-semibold bg-[#1a1c29]">
                  ➕ + Add More Scriptures...
                </option>
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

          {/* INLINE DRAWER: ADD MORE SCRIPTURES */}
          {isAddingScripture && (
            <div className="p-3.5 bg-[#0a0c16] border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Register New Scripture in Universal JSON
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingScripture(false);
                    setNewScriptureError(null);
                  }}
                  className="text-stone-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets for 1-click addition */}
              {availablePresets.length > 0 && (
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block mb-1.5">
                    Quick Presets (Click to fill):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePresets.map((preset) => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => {
                          setNewCode(preset.code);
                          setNewFullName(preset.full_name);
                          setNewAuthor(preset.author);
                          setNewLanguage(preset.language);
                          setNewLocatorFields(preset.locator_fields.join(', '));
                        }}
                        className="px-2 py-1 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-[11px] rounded text-stone-300 hover:text-amber-200 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5 text-amber-400" />
                        <span className="font-semibold">{preset.code}</span> ({preset.full_name})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newScriptureError && (
                <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 text-[11px] rounded">
                  {newScriptureError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-stone-400 font-mono uppercase block mb-1">
                    Scripture Code (e.g. RV, BS):
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RV"
                    maxLength={6}
                    className="w-full p-2 bg-[#12141f] border border-white/10 rounded-lg text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono uppercase block mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Rigveda Samhita"
                    className="w-full p-2 bg-[#12141f] border border-white/10 rounded-lg text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-stone-400 font-mono uppercase block mb-1">
                    Author / Seer:
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Vedic Rishis"
                    className="w-full p-2 bg-[#12141f] border border-white/10 rounded-lg text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono uppercase block mb-1">
                    Language:
                  </label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="w-full p-2 bg-[#12141f] border border-white/10 rounded-lg text-stone-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="Sanskrit">Sanskrit</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Prakrit">Prakrit</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 font-mono uppercase block mb-1">
                  Locator Coordinates Field Names (comma-separated):
                </label>
                <input
                  type="text"
                  value={newLocatorFields}
                  onChange={(e) => setNewLocatorFields(e.target.value)}
                  placeholder="e.g. mandala, sukta, mantra or chapter, verse or shloka"
                  className="w-full p-2 bg-[#12141f] border border-white/10 rounded-lg text-stone-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Defines input fields when adding verses for this scripture
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingScripture(false);
                    setNewScriptureError(null);
                  }}
                  className="px-3 py-1.5 text-[11px] text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewScripture}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-[11px] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Save & Select Scripture
                </button>
              </div>
            </div>
          )}

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
              placeholder='Auto: "[Scripture Code] [Coordinates]" e.g. DB 6.1.12 or BG 2.23'
              className="w-full p-2 bg-[#090a0e] border border-white/10 rounded-lg text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-xs"
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

