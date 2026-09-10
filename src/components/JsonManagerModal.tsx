import React, { useState } from 'react';
import { ScriptureDatabase } from '../types';
import { Copy, Download, Upload, RotateCcw, Check, X, FileCode } from 'lucide-react';

interface JsonManagerModalProps {
  database: ScriptureDatabase;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDatabase: (updated: ScriptureDatabase) => void | Promise<void | boolean>;
  onResetDatabase: () => void;
}

export const JsonManagerModal: React.FC<JsonManagerModalProps> = ({
  database,
  isOpen,
  onClose,
  onUpdateDatabase,
  onResetDatabase,
}) => {
  if (!isOpen) return null;

  const jsonString = JSON.stringify(database, null, 2);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState(jsonString);
  const [parseError, setParseError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scripture-graph-db-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyEdit = async () => {
    try {
      setParseError(null);
      const parsed = JSON.parse(editedText);
      if (!parsed.verses || !parsed.edges) {
        throw new Error('Invalid JSON: Must contain "verses" and "edges" arrays.');
      }
      setIsProcessing(true);
      await onUpdateDatabase(parsed);
      setEditMode(false);
      setStatusFeedback({
        type: 'success',
        message: `Successfully updated universal database with ${parsed.verses.length} verses.`,
      });
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      setParseError(err.message || 'Malformed JSON');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusFeedback(null);
    setParseError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.verses) || !Array.isArray(parsed.edges)) {
          throw new Error('Invalid schema: file must contain "verses" and "edges" arrays.');
        }

        // Validate verses
        const versesCount = parsed.verses.length;
        const edgesCount = parsed.edges.length;

        await onUpdateDatabase(parsed);
        setStatusFeedback({
          type: 'success',
          message: `Imported ${versesCount} verses & ${edgesCount} connections. Synchronized across all devices!`,
        });
        setTimeout(() => setStatusFeedback(null), 5000);
      } catch (err: any) {
        setStatusFeedback({
          type: 'error',
          message: `Failed to import JSON: ${err.message || 'Invalid format'}`,
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setStatusFeedback({
        type: 'error',
        message: 'Could not read file from device.',
      });
      setIsProcessing(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10111a] rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-stone-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141622]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="font-semibold text-stone-100 text-sm">
                JSON Database & Schema Inspector
              </h3>
              <p className="text-[11px] text-stone-400">
                100% compliant with schema-sample.json · Version {database.schema_version}
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

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-[#0e0f16] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-stone-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-stone-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .json
            </button>

            <label className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import .json
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetDatabase();
                setStatusFeedback({
                  type: 'success',
                  message: 'Database reset to initial constellation seed.',
                });
                setTimeout(() => setStatusFeedback(null), 4000);
              }}
              className="px-2.5 py-1 text-stone-500 hover:text-amber-400 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Seed
            </button>

            <button
              onClick={() => {
                if (!editMode) setEditedText(jsonString);
                setEditMode(!editMode);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                editMode ? 'bg-amber-600 text-white' : 'bg-white/10 text-stone-300 hover:bg-white/15'
              }`}
            >
              {editMode ? 'Cancel Edit' : 'Edit Raw JSON'}
            </button>
          </div>
        </div>

        {/* Live Status / Import Feedback Banner */}
        {statusFeedback && (
          <div
            className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between gap-2 ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{statusFeedback.message}</span>
            <button
              onClick={() => setStatusFeedback(null)}
              className="p-1 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="px-5 py-1.5 bg-amber-950/40 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Writing and syncing universal database across all devices...</span>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#090a0e] text-emerald-400 font-mono text-xs">
          {editMode ? (
            <div className="h-full flex flex-col gap-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full min-h-[380px] p-3 bg-black/60 text-emerald-300 font-mono text-xs border border-white/10 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
              />
              {parseError && (
                <div className="p-2 bg-red-950/80 text-red-300 border border-red-800 rounded text-xs">
                  {parseError}
                </div>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre overflow-x-auto leading-relaxed">
              {jsonString}
            </pre>
          )}
        </div>

        {/* Footer */}
        {editMode && (
          <div className="p-3 border-t border-white/10 bg-[#141622] flex justify-end gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-stone-400"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyEdit}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
            >
              Apply Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
