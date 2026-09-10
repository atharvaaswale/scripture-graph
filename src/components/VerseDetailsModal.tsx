import React, { useEffect } from 'react';
import { Verse, ScriptureDatabase } from '../types';
import { X, Trash2 } from 'lucide-react';

interface VerseDetailsModalProps {
  verse: Verse | null;
  database: ScriptureDatabase;
  onClose: () => void;
  onDeleteVerse?: (verseId: string) => void;
  isCuratorMode?: boolean;
}

export const VerseDetailsModal: React.FC<VerseDetailsModalProps> = ({
  verse,
  database,
  onClose,
  onDeleteVerse,
  isCuratorMode = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!verse) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#101117]/95 border border-white/10 rounded-2xl max-w-xl w-full p-8 sm:p-10 shadow-2xl text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200"
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
        <div className="text-stone-400/90 text-xs sm:text-sm font-devanagari tracking-wider mt-6 font-medium">
          {verse.display_ref}
        </div>

        {/* In Curator Mode only: Subtle low-profile tools tucked at the bottom */}
        {isCuratorMode && (
          <div className="mt-8 pt-4 border-t border-white/5 w-full flex items-center justify-between text-[11px] text-stone-500 font-mono">
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
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
