import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Laptop, 
  Usb, 
  FileText, 
  StickyNote, 
  Coffee, 
  Headphones, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Archive, 
  Building, 
  Check, 
  Info,
  Sparkles,
  Move,
  Clock,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface OfficeIncidentChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const OfficeIncidentChallenge: React.FC<OfficeIncidentChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  // Remediation states (containment drop targets)
  const [usbSecured, setUsbSecured] = useState(false);
  const [noteSecured, setNoteSecured] = useState(false);
  const [docSecured, setDocSecured] = useState(false);
  const [laptopLocked, setLaptopLocked] = useState(false);

  // Drag and drop tracking
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [selectedItemForClickDrop, setSelectedItemForClickDrop] = useState<string | null>(null);
  const [dropNotice, setDropNotice] = useState<string | null>(null);

  const totalHazardCount = 4;
  const securedCount = [usbSecured, noteSecured, docSecured, laptopLocked].filter(Boolean).length;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setUsbSecured(false);
    setNoteSecured(false);
    setDocSecured(false);
    setLaptopLocked(false);
    setDraggedItem(null);
    setSelectedItemForClickDrop(null);
    setDropNotice(null);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (submitted) return;
    setDraggedItem(itemId);
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const executeDrop = (targetZone: string, incomingItemId?: string) => {
    if (submitted) return;
    const itemId = incomingItemId || draggedItem || selectedItemForClickDrop;
    if (!itemId) return;

    if (targetZone === 'it_dropbox' && itemId === 'usb') {
      sounds.playSuccess();
      setUsbSecured(true);
      setDropNotice('✓ Unknown USB securely deposited into IT Security Drop Box.');
    } else if (targetZone === 'shredder' && itemId === 'note') {
      sounds.playSuccess();
      setNoteSecured(true);
      setDropNotice('✓ Password sticky note shredded into cross-cut confetti.');
    } else if (targetZone === 'cabinet' && itemId === 'doc') {
      sounds.playSuccess();
      setDocSecured(true);
      setDropNotice('✓ Confidential salary report locked in Filing Cabinet.');
    } else if (targetZone === 'laptop' && (itemId === 'lock_padlock' || itemId === 'laptop')) {
      sounds.playSuccess();
      setLaptopLocked(true);
      setDropNotice('✓ Workstation screen locked (Win+L / Cmd+Ctrl+Q).');
    } else {
      sounds.playWarning();
      if (itemId === 'usb') {
        setDropNotice('⚠️ Unknown USB must be dropped into the IT Security Drop Box, not here.');
      } else if (itemId === 'note') {
        setDropNotice('⚠️ Password note must be dropped into the Paper Shredder.');
      } else if (itemId === 'doc') {
        setDropNotice('⚠️ Confidential document must be locked in the Filing Cabinet.');
      } else if (itemId === 'lock_padlock') {
        setDropNotice('⚠️ Drag the Security Padlock onto the Laptop screen to lock it.');
      }
    }

    setDraggedItem(null);
    setSelectedItemForClickDrop(null);
    setTimeout(() => setDropNotice(null), 4000);
  };

  const handleDrop = (e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItem;
    if (itemId) {
      executeDrop(targetZone, itemId);
    }
  };

  const handleItemSelect = (itemId: string) => {
    if (submitted) return;
    sounds.playClick();
    if (selectedItemForClickDrop === itemId) {
      setSelectedItemForClickDrop(null);
    } else {
      setSelectedItemForClickDrop(itemId);
      setDropNotice(`Selected "${itemId}". Now click the matching destination container below to drop it.`);
    }
  };

  const handleFinalSubmit = () => {
    if (submitted) return;
    sounds.playClick();

    const isCorrect = securedCount >= 3;
    const scoreAwarded = isCorrect
      ? (securedCount === 4 ? question.points : Math.round(question.points * 0.8))
      : Math.round((securedCount / 4) * 50);

    const bonusAwarded = isCorrect && securedCount === 4 ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      hazardsSecured: securedCount,
      laptopLocked,
      docSecured,
      noteSecured,
      usbSecured,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Scenario & Drag-and-Drop Objective */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is your office desk before lunch. Drag and drop the physical hazards into their secure disposal/lock containers.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Drag each item to its correct destination (or tap an item then tap a container).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(securedCount > 0 || selectedItemForClickDrop !== null) && !submitted && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}

          {/* Counter Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Hazards Contained:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              securedCount === totalHazardCount
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : securedCount > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {securedCount} / {totalHazardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Notice / Guidance Toast */}
      {dropNotice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2 animate-fadeIn max-w-xl mx-auto shadow-lg">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{dropNotice}</span>
        </div>
      )}

      {/* Main Workspace Simulation Area */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">12:30 PM • Leaving Desk for Lunch</span>
          </div>
          <span className="text-cyan-400">Drag items to safe receptacles below</span>
        </div>

        {/* PHYSICAL DESK SURFACE */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-cyan-400" />
            <span>Desk Surface (Draggable Items):</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 min-h-[220px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shadow-inner">
            {/* 1. UNKNOWN USB THUMB DRIVE */}
            <div
              draggable={!usbSecured && !submitted}
              onDragStart={(e) => handleDragStart(e, 'usb')}
              onClick={() => !usbSecured && handleItemSelect('usb')}
              className={`p-4 rounded-2xl border text-xs transition-all flex flex-col justify-between gap-3 select-none ${
                usbSecured
                  ? 'bg-slate-950 border-slate-900 opacity-40 cursor-default'
                  : selectedItemForClickDrop === 'usb'
                  ? 'bg-cyan-950/60 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-950 cursor-grab scale-105'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 cursor-grab hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <Usb className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {usbSecured ? 'Secured' : 'DRAG ME'}
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs">Unknown USB Drive</div>
                <p className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                  🏷️ "CONFIDENTIAL: Q3 Bonuses"
                </p>
              </div>
            </div>

            {/* 2. PASSWORD STICKY NOTE */}
            <div
              draggable={!noteSecured && !submitted}
              onDragStart={(e) => handleDragStart(e, 'note')}
              onClick={() => !noteSecured && handleItemSelect('note')}
              className={`p-4 rounded-2xl border text-xs transition-all flex flex-col justify-between gap-3 select-none ${
                noteSecured
                  ? 'bg-slate-950 border-slate-900 opacity-40 cursor-default'
                  : selectedItemForClickDrop === 'note'
                  ? 'bg-cyan-950/60 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-950 cursor-grab scale-105'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 cursor-grab hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                  <StickyNote className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {noteSecured ? 'Shredded' : 'DRAG ME'}
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs">Password Sticky Note</div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Reads: <code className="text-amber-300">Pass: Spring2025!</code>
                </p>
              </div>
            </div>

            {/* 3. CONFIDENTIAL PAYROLL FOLDER */}
            <div
              draggable={!docSecured && !submitted}
              onDragStart={(e) => handleDragStart(e, 'doc')}
              onClick={() => !docSecured && handleItemSelect('doc')}
              className={`p-4 rounded-2xl border text-xs transition-all flex flex-col justify-between gap-3 select-none ${
                docSecured
                  ? 'bg-slate-950 border-slate-900 opacity-40 cursor-default'
                  : selectedItemForClickDrop === 'doc'
                  ? 'bg-cyan-950/60 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-950 cursor-grab scale-105'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 cursor-grab hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {docSecured ? 'Locked' : 'DRAG ME'}
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs">Confidential Bonus Folder</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exposed salary & banking details
                </p>
              </div>
            </div>

            {/* 4. SECURITY PADLOCK (Drag onto Laptop Screen) */}
            <div
              draggable={!laptopLocked && !submitted}
              onDragStart={(e) => handleDragStart(e, 'lock_padlock')}
              onClick={() => !laptopLocked && handleItemSelect('lock_padlock')}
              className={`p-4 rounded-2xl border text-xs transition-all flex flex-col justify-between gap-3 select-none ${
                laptopLocked
                  ? 'bg-slate-950 border-slate-900 opacity-40 cursor-default'
                  : selectedItemForClickDrop === 'lock_padlock'
                  ? 'bg-cyan-950/60 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-950 cursor-grab scale-105'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 cursor-grab hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {laptopLocked ? 'Applied' : 'DRAG ME'}
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs">Screen Lock Padlock</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Drag to lock workstation screen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TARGET CONTAINMENT DROP ZONES */}
        <div className="space-y-2 pt-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Target Disposal & Safe Storage Containers (Drop Zones):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* JUMBLED DROP ZONE 1: LOCKABLE FILING CABINET (formerly zone 3) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'cabinet')}
              onClick={() => selectedItemForClickDrop && executeDrop('cabinet')}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center text-center justify-between min-h-[160px] cursor-pointer ${
                docSecured
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                docSecured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-cyan-400'
              }`}>
                {docSecured ? <CheckCircle2 className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs">Lockable Filing Cabinet</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {docSecured ? 'Clean desk policy satisfied' : 'Drop confidential folder here'}
                </p>
              </div>
              {docSecured && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Locked Away ✓
                </span>
              )}
            </div>

            {/* JUMBLED DROP ZONE 2: WORKSTATION LAPTOP (formerly zone 4) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'laptop')}
              onClick={() => selectedItemForClickDrop && executeDrop('laptop')}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center text-center justify-between min-h-[160px] cursor-pointer ${
                laptopLocked
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                laptopLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'
              }`}>
                {laptopLocked ? <Lock className="w-6 h-6 text-emerald-400" /> : <Laptop className="w-6 h-6 text-cyan-400" />}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs">Workstation Laptop</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {laptopLocked ? 'Screen locked & password protected' : 'Drop padlock here to lock'}
                </p>
              </div>
              {laptopLocked && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Screen Locked ✓
                </span>
              )}
            </div>

            {/* JUMBLED DROP ZONE 3: IT SECURITY DROP BOX (formerly zone 1) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'it_dropbox')}
              onClick={() => selectedItemForClickDrop && executeDrop('it_dropbox')}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center text-center justify-between min-h-[160px] cursor-pointer ${
                usbSecured
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                usbSecured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-cyan-400'
              }`}>
                {usbSecured ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs">IT Security Safe Drop Box</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {usbSecured ? 'USB quarantined for forensic inspection' : 'Drop unknown USB drive here'}
                </p>
              </div>
              {usbSecured && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Secured ✓
                </span>
              )}
            </div>

            {/* JUMBLED DROP ZONE 4: CROSS-CUT SHREDDER (formerly zone 2) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'shredder')}
              onClick={() => selectedItemForClickDrop && executeDrop('shredder')}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center text-center justify-between min-h-[160px] cursor-pointer ${
                noteSecured
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                noteSecured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-amber-400'
              }`}>
                {noteSecured ? <CheckCircle2 className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs">Cross-Cut Paper Shredder</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {noteSecured ? 'Password note destroyed' : 'Drop password sticky note here'}
                </p>
              </div>
              {noteSecured && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Shredded ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submission Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {securedCount === totalHazardCount
              ? '✓ Desk 100% compliant with corporate clean desk policy.'
              : `${securedCount} of ${totalHazardCount} hazards neutralized.`}
          </div>

          {!submitted ? (
            <button
              type="button"
              disabled={securedCount === 0}
              onClick={handleFinalSubmit}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 ${
                securedCount >= 3
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Workspace Security ({securedCount}/4 Contained)</span>
            </button>
          ) : (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Workspace Security Report Recorded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
