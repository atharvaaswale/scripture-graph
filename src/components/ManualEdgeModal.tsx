import React, { useState } from 'react';
import { Edge, RelationType, ScriptureDatabase } from '../types';
import { X, Link2 } from 'lucide-react';

interface ManualEdgeModalProps {
  database: ScriptureDatabase;
  isOpen: boolean;
  onClose: () => void;
  onAddEdge: (edge: Edge) => void;
  preselectedSourceId?: string | null;
}

const RELATIONS: { type: RelationType; desc: string }[] = [
  { type: 'extends', desc: 'Builds upon, develops, or elaborates the earlier claim' },
  { type: 'supports', desc: 'Provides corroborating theological evidence or justification' },
  { type: 'contrasts', desc: 'Presents opposing viewpoint, corrective, or paradoxical tension' },
  { type: 'restates', desc: 'Expresses identical doctrine or insight in different terms' },
  { type: 'requires', desc: 'Serves as an indispensable prerequisite or condition' },
  { type: 'exemplifies', desc: 'Provides a specific narrative or concrete instance' },
];

export const ManualEdgeModal: React.FC<ManualEdgeModalProps> = ({
  database,
  isOpen,
  onClose,
  onAddEdge,
  preselectedSourceId,
}) => {
  const [fromId, setFromId] = useState(preselectedSourceId || database.verses[0]?.id || '');
  const [toId, setToId] = useState(database.verses[1]?.id || database.verses[0]?.id || '');
  const [relation, setRelation] = useState<RelationType>('extends');
  const [why, setWhy] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) {
      setError('Please select both source and target verses.');
      return;
    }
    if (fromId === toId) {
      setError('A verse cannot connect to itself.');
      return;
    }
    if (!why.trim()) {
      setError('A short "why" argumentative justification is required for every edge.');
      return;
    }

    // Check duplicate
    const exists = database.edges.some((e) => e.from === fromId && e.to === toId);
    if (exists) {
      setError(`An edge already exists from ${fromId} to ${toId}. Check existing edges.`);
      return;
    }

    onAddEdge({
      from: fromId,
      to: toId,
      relation,
      why: why.trim(),
    });

    setWhy('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Establish Argumentative Connection
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Source Verse (From):
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              >
                {database.verses.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} - {v.display_ref}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Target Verse (To):
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              >
                {database.verses.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} - {v.display_ref}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Relation Type (Strict Closed Vocabulary):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONS.map((r) => (
                <label
                  key={r.type}
                  className={`p-2 rounded-lg border cursor-pointer flex flex-col transition-all ${
                    relation === r.type
                      ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-slate-900">
                    <input
                      type="radio"
                      name="relation"
                      value={r.type}
                      checked={relation === r.type}
                      onChange={() => setRelation(r.type)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    {r.type}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {r.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Scholarly Argument / Thematic Link ("why"):
            </label>
            <textarea
              rows={3}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="State the substantive argumentative connection referencing what both verses claim..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-serif text-slate-800"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm"
            >
              Add Edge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
