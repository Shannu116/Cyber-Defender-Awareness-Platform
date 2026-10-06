import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Question, QrInspectSubmission } from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Check, 
  SplitSquareVertical, 
  Mail, 
  Globe, 
  Shield, 
  Smartphone, 
  X, 
  HelpCircle, 
  AlertOctagon, 
  Clock, 
  ArrowRight, 
  PhoneCall, 
  Flag, 
  Trash2, 
  Eye
} from 'lucide-react';
import { sounds } from '../../utils/sound';

export const AUTHENTIC_QR_URL = 'https://www.amazon.com/';
export const PHISH_TRACKER_URL = 
  (import.meta.env.VITE_PHISH_TRACKER_URL as string | undefined) || 
  'https://phish-tracker-1.onrender.com/track/click?token=1083c99e-e3b2-4e10-a92e-afc3ba949351';

interface QrInspectChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: QrInspectSubmission) => void;
}

type DecisionType = 'scan_check' | 'ignore' | 'tear_down' | 'report_poster';

interface ElementInfo {
  id: string;
  neutralAria: string;
  isMalicious: boolean;
  explanation: string;
}

export const QrInspectChallenge: React.FC<QrInspectChallengeProps> = ({
  submitted,
  onSubmitAnswer,
}) => {
  // Scannable QR Data URLs
  const [authQrDataUrl, setAuthQrDataUrl] = useState<string>('');
  const [rogueQrDataUrl, setRogueQrDataUrl] = useState<string>('');

  // Flagged elements (locked once clicked)
  const [flaggedKeys, setFlaggedKeys] = useState<string[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Phone camera scan text input
  const [scannedUrlInput, setScannedUrlInput] = useState<string>('');
  const [revealedScan, setRevealedScan] = useState<boolean>(false);

  // Hints
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Decision & Follow-up
  const [chosenAction, setChosenAction] = useState<DecisionType | null>(null);
  const [followUpChoice, setFollowUpChoice] = useState<string | null>(null);

  // Mobile layout tab switcher (< 768px)
  const [mobileActiveTab, setMobileActiveTab] = useState<'authentic' | 'rogue'>('rogue');

  // Element Registry for Instant Feedback
  const elementRegistry: Record<string, ElementInfo> = {
    // 5 Real Forgeries on Rogue Flyer
    diff_email: {
      id: 'diff_email',
      neutralAria: 'Breakroom Support Email Address',
      isMalicious: true,
      explanation: 'Typosquatting domain: "arnazon.com" pairs "r" and "n" to visually mimic "m". Look for letter pairs: rn vs m, vv vs w, cl vs d.'
    },
    diff_link: {
      id: 'diff_link',
      neutralAria: 'Breakroom Web Portal Link',
      isMalicious: true,
      explanation: 'Lookalike subdomain: Look only at the text before the first "/". The real owner is portal-auth.com, not amazon.com.'
    },
    diff_qr: {
      id: 'diff_qr',
      neutralAria: 'Breakroom Flyer QR Code',
      isMalicious: true,
      explanation: 'The QR code opened an unrelated hosting domain that doesn\'t match the address printed on the flyer. Always preview the URL your phone shows before opening it.'
    },
    diff_urgency: {
      id: 'diff_urgency',
      neutralAria: 'Breakroom Enrollment Deadline',
      isMalicious: true,
      explanation: 'Manufactured urgency: "Enroll within 24 hours or lose coverage" creates artificial panic. Real open enrollment periods at Amazon run for an entire month (Oct 1 – Oct 31).'
    },
    diff_form_id: {
      id: 'diff_form_id',
      neutralAria: 'Breakroom Document ID',
      isMalicious: true,
      explanation: 'Mismatched document ID: "AMZ-HR-BEN-2026-X" carries an unauthorized "-X" suffix indicating tampered collateral.'
    },

    // Decoys on Breakroom Flyer
    decoy_extension_rogue: {
      id: 'decoy_extension_rogue',
      neutralAria: 'Breakroom Campus Helpline',
      isMalicious: false,
      explanation: 'Legitimate internal routing: 5-digit campus extensions and PBX tie-lines are standard telephony at Amazon.'
    },
    decoy_tpa_rogue: {
      id: 'decoy_tpa_rogue',
      neutralAria: 'Breakroom Benefits Administrator',
      isMalicious: false,
      explanation: 'Legitimate benefits administrator: Amazon officially partners with Fidelity NetBenefits for 401(k) and healthcare management.'
    },
    decoy_timestamp_rogue: {
      id: 'decoy_timestamp_rogue',
      neutralAria: 'Breakroom System Cutoff Timestamp',
      isMalicious: false,
      explanation: 'Legitimate timestamp: Standard ISO 8601 UTC format ensures unambiguous worldwide cutoffs across Amazon fulfillment centers and hubs.'
    },

    // Authentic Boilerplate on Rogue Flyer
    rogue_header: {
      id: 'rogue_header',
      neutralAria: 'Breakroom Notice Header Banner',
      isMalicious: false,
      explanation: 'Legitimate letterhead: Standard Amazon HR letterhead copied from official communications.'
    },
    rogue_plans: {
      id: 'rogue_plans',
      neutralAria: 'Breakroom Plan Option Bullet Points',
      isMalicious: false,
      explanation: 'Legitimate boilerplate: Standard employee benefit options copied from the corporate handbook.'
    },

    // Authentic Poster Elements
    ref_header: {
      id: 'ref_header',
      neutralAria: 'Official Notice Header Banner',
      isMalicious: false,
      explanation: 'Legitimate letterhead: Official Amazon Human Resources corporate letterhead.'
    },
    ref_plans: {
      id: 'ref_plans',
      neutralAria: 'Official Plan Option Bullet Points',
      isMalicious: false,
      explanation: 'Legitimate boilerplate: Standard employee benefit options from Amazon HR.'
    },
    ref_email: {
      id: 'ref_email',
      neutralAria: 'Official HR Support Email',
      isMalicious: false,
      explanation: 'Legitimate address: benefits@amazon.com is hosted on the genuine corporate domain.'
    },
    ref_link: {
      id: 'ref_link',
      neutralAria: 'Official Web Portal Link',
      isMalicious: false,
      explanation: 'Legitimate portal: benefits.amazon.com is an authentic corporate subdomain under amazon.com.'
    },
    ref_qr: {
      id: 'ref_qr',
      neutralAria: 'Official Scannable QR Code',
      isMalicious: false,
      explanation: 'Legitimate QR destination: Decodes directly to the official homepage https://www.amazon.com/.'
    },
    ref_urgency: {
      id: 'ref_urgency',
      neutralAria: 'Official Enrollment Window',
      isMalicious: false,
      explanation: 'Legitimate schedule: Standard annual enrollment window running Oct 1 - Oct 31.'
    },
    decoy_extension: {
      id: 'decoy_extension',
      neutralAria: 'Official Campus Helpline',
      isMalicious: false,
      explanation: 'Legitimate internal routing: 5-digit campus extensions and tie-lines are standard dialing procedures at Amazon.'
    },
    decoy_tpa: {
      id: 'decoy_tpa',
      neutralAria: 'Official Benefits Administrator',
      isMalicious: false,
      explanation: 'Legitimate benefits administrator: Amazon officially partners with Fidelity NetBenefits.'
    },
    decoy_timestamp: {
      id: 'decoy_timestamp',
      neutralAria: 'Official System Cutoff Timestamp',
      isMalicious: false,
      explanation: 'Legitimate timestamp: ISO 8601 UTC format used across Amazon cloud infrastructure.'
    },
    ref_form_id: {
      id: 'ref_form_id',
      neutralAria: 'Official Document ID',
      isMalicious: false,
      explanation: 'Legitimate document ID: Matches the official AMZ-HR-BEN-2026 filing record.'
    }
  };

  // Generate real QR codes on mount (client-side only, no external fetches)
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(AUTHENTIC_QR_URL, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(url => {
      if (isMounted) setAuthQrDataUrl(url);
    }).catch(err => console.error('Failed to generate authentic QR code:', err));

    QRCode.toDataURL(PHISH_TRACKER_URL, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(url => {
      if (isMounted) setRogueQrDataUrl(url);
    }).catch(err => console.error('Failed to generate rogue QR code:', err));

    return () => { isMounted = false; };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Flag and Lock an element with instant feedback
  const handleFlagElement = (key: string) => {
    if (submitted) return;
    if (flaggedKeys.includes(key)) return; // Locked once revealed

    const info = elementRegistry[key];
    if (!info) return;

    setFlaggedKeys(prev => [...prev, key]);

    if (info.isMalicious) {
      sounds.playSuccess();
      setLiveAnnouncement(`Malicious element flagged: ${info.explanation}`);
      triggerToast('🎯 Attack Vector Identified: Malicious element flagged!');
    } else {
      sounds.playWarning();
      setLiveAnnouncement(`Legitimate element flagged: ${info.explanation}`);
      triggerToast('ℹ️ Legitimate Element: That element is genuine corporate practice.');
    }
  };

  // Unlock vague hint
  const handleRequestHint = () => {
    if (submitted || showHint) return;
    sounds.playClick();
    setHintsUsed(1);
    setShowHint(true);
    triggerToast('💡 Advisory Clue Unlocked');
  };

  // "I can't scan right now" reveals decoded URL
  const handleRevealDecodedUrl = () => {
    if (submitted || revealedScan) return;
    sounds.playClick();
    setRevealedScan(true);
    triggerToast('Decoded QR destination revealed');
  };

  // Input validation: accept answers containing "phish-tracker" or "onrender.com"
  const isScannedUrlMatch = (input: string): boolean => {
    const val = input.trim().toLowerCase();
    return val.includes('phish-tracker') || val.includes('onrender.com') || val.includes('onrender');
  };

  // Differences and decoys definitions
  const realDifferenceIds = ['diff_email', 'diff_link', 'diff_qr', 'diff_urgency', 'diff_form_id'];
  const foundRealDifferences = realDifferenceIds.filter(id => flaggedKeys.includes(id));
  const falselyFlaggedItems = flaggedKeys.filter(id => !realDifferenceIds.includes(id));

  const scannedUrlIsCorrect = isScannedUrlMatch(scannedUrlInput);

  // Handle final submission
  const handleFinalSubmit = () => {
    if (submitted || !chosenAction) return;
    sounds.playClick();

    // Base score based on decision protocol
    let baseScore = 0;
    if (chosenAction === 'report_poster') {
      baseScore = 100;
    } else if (chosenAction === 'tear_down') {
      baseScore = 50;
    } else if (chosenAction === 'ignore') {
      baseScore = 10;
    } else {
      baseScore = 0;
    }

    // Differences identified bonus: 10 pts per real difference (up to 50 pts)
    const diffBonus = foundRealDifferences.length * 10;

    // Scanned URL accuracy bonus: +15 pts
    const scannedBonus = scannedUrlIsCorrect ? 15 : 0;

    // Follow-up question bonus: +15 pts
    const followUpBonus = followUpChoice === 'fu_correct' ? 15 : 0;
    const totalBonus = diffBonus + scannedBonus + followUpBonus;

    // Negative marking removed: no point deductions applied
    const scoreAwarded = baseScore + totalBonus;
    const isCorrect = (chosenAction === 'report_poster' || chosenAction === 'tear_down') && foundRealDifferences.length >= 2;

    onSubmitAnswer({
      decision: chosenAction,
      foundIds: foundRealDifferences,
      foundCount: foundRealDifferences.length,
      falsePositiveCount: falselyFlaggedItems.length,
      hintsUsed,
      scannedUrlInput: scannedUrlInput.trim(),
      scannedUrlCorrect: scannedUrlIsCorrect,
      revealedScan,
      followUpChoice,
      isCorrect,
      scoreAwarded,
      bonusAwarded: totalBonus
    });
  };

  // Element Styling Helper with Instant Feedback
  const renderItemClasses = (key: string) => {
    const isFlagged = flaggedKeys.includes(key);
    if (!isFlagged) {
      return 'p-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none';
    }

    const info = elementRegistry[key];
    if (info?.isMalicious) {
      return 'p-3 rounded-xl border border-rose-500 bg-rose-950/40 text-rose-100 ring-1 ring-rose-500/50 shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none cursor-default';
    } else {
      return 'p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/30 text-emerald-100 ring-1 ring-emerald-500/30 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-default';
    }
  };

  // Revealed Badge and Explanation Block
  const renderItemFeedback = (key: string) => {
    if (!flaggedKeys.includes(key)) return null;
    const info = elementRegistry[key];
    if (!info) return null;

    if (info.isMalicious) {
      return (
        <div className="mt-2 pt-2 border-t border-rose-500/30 flex items-start gap-2 text-xs text-rose-200 animate-fadeIn">
          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" />
            <span>Malicious</span>
          </span>
          <span className="font-sans leading-relaxed text-[11px] text-rose-200">
            {info.explanation}
          </span>
        </div>
      );
    } else {
      return (
        <div className="mt-2 pt-2 border-t border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-200 animate-fadeIn">
          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Legitimate</span>
          </span>
          <span className="font-sans leading-relaxed text-[11px] text-emerald-200">
            {info.explanation}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Guidance & Action Controls Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-xl flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shrink-0 mt-0.5">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Inspect Before You Scan: Spot Counterfeit Differences</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                Quishing Defense
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              An attacker hung a rogue flyer in the breakroom. Compare both notices side-by-side. 
              Click any element you suspect is forged. Suspect attacks are confirmed instantly in RED, while legitimate elements are marked in GREEN. Once flagged, elements are locked.
            </p>
          </div>
        </div>

        {/* Controls: Hint, Flags Counter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hint Button */}
          {!showHint && !submitted && (
            <button
              type="button"
              onClick={handleRequestHint}
              className="text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-950/50"
              title="Reveal advisory clue"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Need a Hint?</span>
            </button>
          )}

          {/* Running Flags Counter (Never reveals total) */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2 shadow-inner">
            <span className="text-slate-400">Flags raised:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              flaggedKeys.length > 0
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {flaggedKeys.length}
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Clue Banner (Only shown if unlocked) */}
      {showHint && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono shadow-md flex items-start gap-2.5 animate-fadeIn">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-amber-300">Security Advisory Clue:</span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Look closely at contact channels, web addresses, and administrative details. Do not trust what appears at first glance. 
              Scrutinize letter pairs that mimic single letters and inspect web hostnames before the first slash. Check whether timeframes reflect realistic policy or panic tactics.
            </p>
          </div>
        </div>
      )}

      {/* Phone Camera Scan Step */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Smartphone className="w-4 h-4" />
          <span>Physical Phone Camera Scan Step</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-slate-200 font-sans font-bold">
            Scan the QR code on the flyer with your phone&apos;s camera. Do NOT open the link. Read the address your phone shows.
          </p>
          <p className="text-[11px] text-cyan-300/80 font-mono">
            Scans in this exercise are logged for security-awareness training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-1">
          <div className="md:col-span-2">
            <label htmlFor="scanned-url-input" className="block text-[11px] font-mono text-slate-400 mb-1">
              What address did your phone show?
            </label>
            <input
              id="scanned-url-input"
              type="text"
              disabled={submitted}
              value={scannedUrlInput}
              onChange={(e) => setScannedUrlInput(e.target.value)}
              placeholder="Type the URL your phone showed (e.g. phish-tracker... or onrender.com)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-end">
            {!revealedScan ? (
              <button
                type="button"
                disabled={submitted}
                onClick={handleRevealDecodedUrl}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Reveals the decoded destination URL"
              >
                I can&apos;t scan right now
              </button>
            ) : (
              <div className="w-full p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-[11px] font-mono text-amber-300 break-all">
                <span className="font-bold">Decoded Target:</span> {PHISH_TRACKER_URL}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Screen Switcher Tabs (< 768px) */}
      <div className="flex md:hidden rounded-2xl bg-slate-950 p-1.5 border border-slate-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => { sounds.playClick(); setMobileActiveTab('authentic'); }}
          className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveTab === 'authentic'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>1. Official Notice</span>
        </button>
        <button
          type="button"
          onClick={() => { sounds.playClick(); setMobileActiveTab('rogue'); }}
          className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveTab === 'rogue'
              ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Breakroom Flyer</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SIDE-BY-SIDE NOTICES (IDENTICAL NEUTRAL STYLING UNTIL CLICKED)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
        
        {/* PANEL 1: OFFICIAL REFERENCE NOTICE (AMAZON.COM, INC.) */}
        <div className={`rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl flex flex-col justify-between ${
          mobileActiveTab === 'authentic' ? 'block' : 'hidden md:flex'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Reference Notice</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Corporate HR Template</span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            {/* Header */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_header') ? 'Flagged Legitimate: Amazon HR Header' : 'Official Notice Header Banner'}
              onClick={() => handleFlagElement('ref_header')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_header'); } }}
              className={renderItemClasses('ref_header')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Amazon.com, Inc. • Human Resources</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Notice #AMZ-2026-B</span>
              </div>
              <div className="font-bold text-white text-sm sm:text-base tracking-tight">
                2026 Annual Employee Benefits Enrollment
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Review and update your healthcare coverage, dental plans, and retirement contributions.
              </p>
              {renderItemFeedback('ref_header')}
            </div>

            {/* Plan Highlights */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_plans') ? 'Flagged Legitimate: Amazon Benefit Options' : 'Official Plan Options'}
              onClick={() => handleFlagElement('ref_plans')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_plans'); } }}
              className={renderItemClasses('ref_plans')}
            >
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Standard Plan Options:</div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>Comprehensive Medical &amp; Prescription Drug Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>100% Preventive Dental &amp; Vision Healthcare</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>401(k) Retirement Account with 4% Company Match</span>
                </div>
              </div>
              {renderItemFeedback('ref_plans')}
            </div>

            {/* Support Email */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_email') ? 'Flagged Legitimate: benefits@amazon.com' : 'Official HR Support Email'}
              onClick={() => handleFlagElement('ref_email')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_email'); } }}
              className={renderItemClasses('ref_email')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>HR Support &amp; Questions:</span>
              </div>
              <div className="font-mono text-xs text-slate-200">
                Email: benefits@amazon.com
              </div>
              {renderItemFeedback('ref_email')}
            </div>

            {/* Portal Link */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_link') ? 'Flagged Legitimate: benefits.amazon.com/enroll' : 'Official Web Portal Link'}
              onClick={() => handleFlagElement('ref_link')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_link'); } }}
              className={renderItemClasses('ref_link')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Enroll Online via Web Browser:</span>
              </div>
              <div className="font-mono text-xs text-slate-200 break-all">
                Link: https://benefits.amazon.com/enroll
              </div>
              {renderItemFeedback('ref_link')}
            </div>

            {/* Real Scannable QR Code on Authentic Notice */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_qr') ? 'Flagged Legitimate: Official Amazon QR' : 'Official Scannable QR Code'}
              onClick={() => handleFlagElement('ref_qr')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_qr'); } }}
              className={`text-center space-y-2.5 ${renderItemClasses('ref_qr')}`}
            >
              <div className="text-[11px] font-bold text-slate-300">
                Or Scan Mobile QR Code for Quick Access:
              </div>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
                {authQrDataUrl ? (
                  <img 
                    src={authQrDataUrl} 
                    alt="Authentic Scannable QR Code" 
                    width={220} 
                    height={220} 
                    className="w-[220px] h-[220px] block mx-auto" 
                  />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-400 text-xs">
                    Generating scannable QR...
                  </div>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                [Point phone camera at code to preview link]
              </div>
              {renderItemFeedback('ref_qr')}
            </div>

            {/* Enrollment Window */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_urgency') ? 'Flagged Legitimate: Oct 1 - Oct 31 Schedule' : 'Official Enrollment Window'}
              onClick={() => handleFlagElement('ref_urgency')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_urgency'); } }}
              className={renderItemClasses('ref_urgency')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Enrollment Window:</span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans">
                Open Enrollment Period: Oct 1 – Oct 31, 2026 (Annual Window)
              </div>
              {renderItemFeedback('ref_urgency')}
            </div>

            {/* Decoy 1: PBX Dial Extension */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_extension') ? 'Flagged Legitimate: PBX Helpline' : 'Official Campus Helpline'}
              onClick={() => handleFlagElement('decoy_extension')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_extension'); } }}
              className={renderItemClasses('decoy_extension')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>Internal Helpline:</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Amazon HR Helpdesk: ext. 4-4321 / Tie-line #8-890
              </div>
              {renderItemFeedback('decoy_extension')}
            </div>

            {/* Decoy 2: Third-Party Administrator */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_tpa') ? 'Flagged Legitimate: TPA Partner' : 'Official Benefits Administrator'}
              onClick={() => handleFlagElement('decoy_tpa')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_tpa'); } }}
              className={renderItemClasses('decoy_tpa')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Third-Party Benefits Administrator:
                </span>
                <span className="text-[9px] font-mono text-slate-500">EDI-AMZ-8842</span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans">
                TPA Support: fidelity-benefits@netbenefits.com
              </div>
              {renderItemFeedback('decoy_tpa')}
            </div>

            {/* Decoy 3: ISO UTC Cutoff Timestamp */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_timestamp') ? 'Flagged Legitimate: UTC Timestamp' : 'Official System Cutoff Timestamp'}
              onClick={() => handleFlagElement('decoy_timestamp')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_timestamp'); } }}
              className={renderItemClasses('decoy_timestamp')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Automated System Cutoff:</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Portal Cutoff: 2026-10-31T23:59:00Z (UTC)
              </div>
              {renderItemFeedback('decoy_timestamp')}
            </div>

            {/* Document Footer */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('ref_form_id') ? 'Flagged Legitimate: Document ID' : 'Official Document ID'}
              onClick={() => handleFlagElement('ref_form_id')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('ref_form_id'); } }}
              className={`p-2.5 rounded-xl border text-[10px] font-mono text-slate-400 flex items-center justify-between cursor-pointer transition-all ${
                flaggedKeys.includes('ref_form_id')
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <span>Window: Oct 1 - Oct 31</span>
              <span>Doc ID: AMZ-HR-BEN-2026</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: BREAKROOM NOTICE BOARD FLYER (SUSPECT COPY) */}
        <div className={`rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 space-y-4 shadow-2xl flex flex-col justify-between ${
          mobileActiveTab === 'rogue' ? 'block' : 'hidden md:flex'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Breakroom Notice Board Flyer</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Flags: {flaggedKeys.length}
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            {/* Header (Matching Boilerplate) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('rogue_header') ? 'Flagged Legitimate: Amazon HR Header' : 'Breakroom Notice Header Banner'}
              onClick={() => handleFlagElement('rogue_header')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('rogue_header'); } }}
              className={renderItemClasses('rogue_header')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Amazon.com, Inc. • Human Resources</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Notice #AMZ-2026-B</span>
              </div>
              <div className="font-bold text-white text-sm sm:text-base tracking-tight">
                2026 Annual Employee Benefits Enrollment
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Review and update your healthcare coverage, dental plans, and retirement contributions.
              </p>
              {renderItemFeedback('rogue_header')}
            </div>

            {/* Plan Highlights (Matching Boilerplate) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('rogue_plans') ? 'Flagged Legitimate: Benefit Options' : 'Breakroom Plan Option Bullet Points'}
              onClick={() => handleFlagElement('rogue_plans')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('rogue_plans'); } }}
              className={renderItemClasses('rogue_plans')}
            >
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Standard Plan Options:</div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>Comprehensive Medical &amp; Prescription Drug Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>100% Preventive Dental &amp; Vision Healthcare</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>401(k) Retirement Account with 4% Company Match</span>
                </div>
              </div>
              {renderItemFeedback('rogue_plans')}
            </div>

            {/* DIFFERENCE 1: TYPOSQUATTING EMAIL (benefits@arnazon.com) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('diff_email') ? 'Flagged Malicious: Typosquatting Email Address' : 'Breakroom Support Email Address'}
              onClick={() => handleFlagElement('diff_email')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('diff_email'); } }}
              className={renderItemClasses('diff_email')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>HR Support &amp; Questions:</span>
              </div>
              <div className="font-mono text-xs text-slate-200">
                Email: benefits@arnazon.com
              </div>
              {renderItemFeedback('diff_email')}
            </div>

            {/* DIFFERENCE 2: LOOKALIKE SUBDOMAIN (amazon-benefits.portal-auth.com/enroll) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('diff_link') ? 'Flagged Malicious: Lookalike Subdomain Link' : 'Breakroom Web Portal Link'}
              onClick={() => handleFlagElement('diff_link')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('diff_link'); } }}
              className={renderItemClasses('diff_link')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Enroll Online via Web Browser:</span>
              </div>
              <div className="font-mono text-xs text-slate-200 break-all">
                Link: https://amazon-benefits.portal-auth.com/enroll
              </div>
              {renderItemFeedback('diff_link')}
            </div>

            {/* DIFFERENCE 3: REAL SCANNABLE ROGUE QR CODE (PHISH_TRACKER_URL) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('diff_qr') ? 'Flagged Malicious: Spoofed QR Code' : 'Breakroom Flyer QR Code'}
              onClick={() => handleFlagElement('diff_qr')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('diff_qr'); } }}
              className={`text-center space-y-2.5 ${renderItemClasses('diff_qr')}`}
            >
              <div className="text-[11px] font-bold text-slate-300">
                Or Scan Mobile QR Code for Quick Access:
              </div>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
                {rogueQrDataUrl ? (
                  <img 
                    src={rogueQrDataUrl} 
                    alt="Breakroom Flyer Scannable QR Code" 
                    width={220} 
                    height={220} 
                    className="w-[220px] h-[220px] block mx-auto" 
                  />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-400 text-xs">
                    Generating scannable QR...
                  </div>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                [Point phone camera at code to preview link]
              </div>
              {renderItemFeedback('diff_qr')}
            </div>

            {/* DIFFERENCE 4: URGENCY PRESSURE TEXT (24 hours or lose coverage) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('diff_urgency') ? 'Flagged Malicious: Manufactured Urgency' : 'Breakroom Enrollment Deadline'}
              onClick={() => handleFlagElement('diff_urgency')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('diff_urgency'); } }}
              className={renderItemClasses('diff_urgency')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Enrollment Deadline:</span>
              </div>
              <div className="text-[11px] text-slate-200 font-sans">
                Enroll within 24 hours or lose coverage
              </div>
              {renderItemFeedback('diff_urgency')}
            </div>

            {/* Decoy 1 on Breakroom Flyer */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_extension_rogue') ? 'Flagged Legitimate: PBX Helpline' : 'Breakroom Campus Helpline'}
              onClick={() => handleFlagElement('decoy_extension_rogue')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_extension_rogue'); } }}
              className={renderItemClasses('decoy_extension_rogue')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>Internal Helpline:</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Amazon HR Helpdesk: ext. 4-4321 / Tie-line #8-890
              </div>
              {renderItemFeedback('decoy_extension_rogue')}
            </div>

            {/* Decoy 2 on Breakroom Flyer */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_tpa_rogue') ? 'Flagged Legitimate: TPA Partner' : 'Breakroom Benefits Administrator'}
              onClick={() => handleFlagElement('decoy_tpa_rogue')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_tpa_rogue'); } }}
              className={renderItemClasses('decoy_tpa_rogue')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Third-Party Benefits Administrator:
                </span>
                <span className="text-[9px] font-mono text-slate-500">EDI-AMZ-8842</span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans">
                TPA Support: fidelity-benefits@netbenefits.com
              </div>
              {renderItemFeedback('decoy_tpa_rogue')}
            </div>

            {/* Decoy 3 on Breakroom Flyer */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('decoy_timestamp_rogue') ? 'Flagged Legitimate: UTC Timestamp' : 'Breakroom System Cutoff Timestamp'}
              onClick={() => handleFlagElement('decoy_timestamp_rogue')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('decoy_timestamp_rogue'); } }}
              className={renderItemClasses('decoy_timestamp_rogue')}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Automated System Cutoff:</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Portal Cutoff: 2026-10-31T23:59:00Z (UTC)
              </div>
              {renderItemFeedback('decoy_timestamp_rogue')}
            </div>

            {/* DIFFERENCE 5: MISMATCHED DOC ID (AMZ-HR-BEN-2026-X) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={flaggedKeys.includes('diff_form_id') ? 'Flagged Malicious: Mismatched Document ID' : 'Breakroom Document ID'}
              onClick={() => handleFlagElement('diff_form_id')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('diff_form_id'); } }}
              className={`p-2.5 rounded-xl border text-[10px] font-mono flex flex-col justify-between cursor-pointer transition-all ${
                flaggedKeys.includes('diff_form_id')
                  ? 'border-rose-500 bg-rose-950/40 text-rose-100 ring-1 ring-rose-500/50'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>Window: Immediate</span>
                <span>Doc ID: AMZ-HR-BEN-2026-X</span>
              </div>
              {renderItemFeedback('diff_form_id')}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DECISION STEP: 4 RESPONSE PROTOCOLS WITH CONSEQUENCE PANELS          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl mx-auto space-y-5 shadow-2xl">
        <div className="border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Step 2: Choose Your Incident Response Protocol</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              4 Protocols
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            What immediate operational action should you take after discovering this poster in the employee breakroom?
          </p>
        </div>

        {/* 4 Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Protocol 1: Scan it yourself */}
          <button
            type="button"
            disabled={submitted}
            onClick={() => { sounds.playClick(); setChosenAction('scan_check'); }}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              chosenAction === 'scan_check'
                ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${chosenAction === 'scan_check' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900 text-slate-400'}`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-xs sm:text-sm">Scan it yourself to check</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Scan the QR code with your smartphone to inspect where the link redirects before alerting anyone.
              </p>
            </div>
          </button>

          {/* Protocol 2: Ignore it */}
          <button
            type="button"
            disabled={submitted}
            onClick={() => { sounds.playClick(); setChosenAction('ignore'); }}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              chosenAction === 'ignore'
                ? 'bg-slate-800 border-slate-600 text-white shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${chosenAction === 'ignore' ? 'bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-400'}`}>
              <X className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-xs sm:text-sm">Ignore it</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Assume HR will notice and handle it later; leave the poster active on the wall.
              </p>
            </div>
          </button>

          {/* Protocol 3: Tear it down and warn the team */}
          <button
            type="button"
            disabled={submitted}
            onClick={() => { sounds.playClick(); setChosenAction('tear_down'); }}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              chosenAction === 'tear_down'
                ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${chosenAction === 'tear_down' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-400'}`}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-xs sm:text-sm">Tear down the poster immediately and warn the team</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Rip the poster down right away to prevent scans and message coworkers in chat.
              </p>
            </div>
          </button>

          {/* Protocol 4: Report to IT Security & Facilities (BEST) */}
          <button
            type="button"
            disabled={submitted}
            onClick={() => { sounds.playClick(); setChosenAction('report_poster'); }}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              chosenAction === 'report_poster'
                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${chosenAction === 'report_poster' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900 text-slate-400'}`}>
              <Flag className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-xs sm:text-sm text-emerald-400">Report to IT Security &amp; Facilities (Best Practice)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Preserve physical forensic evidence, notify IT Security to block domains and review CCTV, and coordinate building sweeps.
              </p>
            </div>
          </button>
        </div>

        {/* Consequence Outcome Panel */}
        {chosenAction && (
          <div className="p-4 rounded-2xl border animate-fadeIn text-xs space-y-2">
            {chosenAction === 'scan_check' && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-1">
                <div className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Severe Danger: Direct Device Exposure (0 Points)</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Scanning unknown or rogue QR codes on mobile devices exposes you to zero-day mobile browser exploits, drive-by downloads, and credential harvesters. Incident response teams isolate and analyze suspect codes inside hardened sandbox environments—never on live employee phones!
                </p>
              </div>
            )}

            {chosenAction === 'ignore' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 space-y-1">
                <div className="font-bold text-sm text-slate-400 flex items-center gap-1.5">
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Passive Inaction: Failed Collective Defense (10 Points)</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-sans">
                  Leaving an active phishing poster hanging in a common workplace area guarantees that other coworkers will scan it throughout the day. Prompt reporting is essential to corporate immunity.
                </p>
              </div>
            )}

            {chosenAction === 'tear_down' && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1">
                <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Partial Credit (50 Points): Destroys Physical Evidence</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  While tearing down the poster halts immediate scans, crumpling or disposing of it destroys physical forensic evidence (paper stock, printer toner footprints, latent fingerprints, adhesive residue) and prevents Facilities and IT Security from matching camera timestamps to the poster&apos;s physical mounting time.
                </p>
              </div>
            )}

            {chosenAction === 'report_poster' && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-1">
                <div className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Flawless Incident Response (100 Points): Enterprise Best Practice</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Alerting IT Security and Facilities preserves physical forensic artifacts, triggers security camera review of the breakroom entrance, initiates immediate DNS firewall sinkholing for rogue domains, and deploys facilities officers to sweep all building notice boards.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 3: INCIDENT RESPONSE FOLLOW-UP QUESTION                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {chosenAction && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Step 3: Incident Response Follow-Up
              </span>
              <h5 className="text-xs sm:text-sm font-bold text-white">
                A coworker mentions they already scanned the breakroom flyer this morning and entered their corporate credentials. What should they do immediately?
              </h5>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {/* Option 1: Correct */}
              <div 
                role="button"
                tabIndex={0}
                aria-label="Change corporate password immediately, notify IT Security, and revoke all active account sessions / check MFA tokens"
                aria-pressed={followUpChoice === 'fu_correct'}
                onClick={() => { sounds.playClick(); setFollowUpChoice('fu_correct'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFollowUpChoice('fu_correct'); } }}
                className={`p-3 rounded-xl border text-xs font-sans cursor-pointer transition-all flex items-center justify-between ${
                  followUpChoice === 'fu_correct'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Change corporate password immediately, notify IT Security, and revoke all active account sessions / check MFA tokens.</span>
                {followUpChoice === 'fu_correct' && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </div>

              {/* Option 2: Wrong (cache) */}
              <div 
                role="button"
                tabIndex={0}
                aria-label="Just clear phone browser cache and history"
                aria-pressed={followUpChoice === 'fu_cache'}
                onClick={() => { sounds.playClick(); setFollowUpChoice('fu_cache'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFollowUpChoice('fu_cache'); } }}
                className={`p-3 rounded-xl border text-xs font-sans cursor-pointer transition-all flex items-center justify-between ${
                  followUpChoice === 'fu_cache'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Just clear their phone&apos;s browser history and cache; no need to alert anyone.</span>
                {followUpChoice === 'fu_cache' && <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
              </div>

              {/* Option 3: Wrong (wait) */}
              <div 
                role="button"
                tabIndex={0}
                aria-label="Wait until open enrollment closes"
                aria-pressed={followUpChoice === 'fu_wait'}
                onClick={() => { sounds.playClick(); setFollowUpChoice('fu_wait'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFollowUpChoice('fu_wait'); } }}
                className={`p-3 rounded-xl border text-xs font-sans cursor-pointer transition-all flex items-center justify-between ${
                  followUpChoice === 'fu_wait'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Wait until open enrollment closes at the end of the month to check if their benefits updated.</span>
                {followUpChoice === 'fu_wait' && <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
              </div>

              {/* Option 4: Wrong (forward link) */}
              <div 
                role="button"
                tabIndex={0}
                aria-label="Forward link to HR via personal email"
                aria-pressed={followUpChoice === 'fu_forward'}
                onClick={() => { sounds.playClick(); setFollowUpChoice('fu_forward'); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlagElement('fu_forward'); } }}
                className={`p-3 rounded-xl border text-xs font-sans cursor-pointer transition-all flex items-center justify-between ${
                  followUpChoice === 'fu_forward'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>Forward the flyer link to HR via personal email to ask if it is legitimate.</span>
                {followUpChoice === 'fu_forward' && <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
              </div>
            </div>
          </div>
        )}

        {/* Submit Investigation Button */}
        {chosenAction && followUpChoice && !submitted && (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="w-full py-3.5 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Submit Investigation &amp; Incident Protocol</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* POST-SUBMISSION RESULTS SCREEN (FULL AUDIT + ECHO TUTOR EXPLANATIONS)*/}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {submitted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-700 max-w-5xl mx-auto space-y-6 shadow-2xl animate-fadeIn">
          {/* Header Score Banner */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Investigation Audit Report
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Quishing Defense Assessment Complete</span>
                {chosenAction === 'report_poster' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                )}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">Differences Identified</div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {foundRealDifferences.length} / 5
              </div>
            </div>
          </div>

          {/* All 5 Real Differences Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Full Audit: 5 Forged Differences Analyzed</span>
            </h4>

            {/* Difference 1: Email Typosquatting */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              flaggedKeys.includes('diff_email')
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>1. Typosquatting Domain (&quot;rn&quot; vs &quot;m&quot;)</span>
                  {flaggedKeys.includes('diff_email') ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identified</span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Missed</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Email Channel</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500">Official:</span> benefits@amazon.com
                </div>
                <div className="p-2 rounded bg-slate-900 text-rose-300 font-bold">
                  <span className="text-slate-500">Rogue:</span> benefits@arnazon.com
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Echo Tutor Threat Breakdown:</strong> Look for lookalike letter pairs: rn vs m, vv vs w, cl vs d. The rogue flyer lists <code>benefits@arnazon.com</code>, pairing &quot;r&quot; and &quot;n&quot; to visually mimic the letter &quot;m&quot; in standard sans-serif screen fonts. Employees sending HR queries to this address would unwittingly route sensitive tax and medical data straight to the adversary.
              </p>
            </div>

            {/* Difference 2: Lookalike Subdomain Phishing Gateway */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              flaggedKeys.includes('diff_link')
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>2. Lookalike Subdomain Phishing Gateway</span>
                  {flaggedKeys.includes('diff_link') ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identified</span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Missed</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Web Portal</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500">Official:</span> https://benefits.amazon.com/enroll
                </div>
                <div className="p-2 rounded bg-slate-900 text-rose-300 font-bold break-all">
                  <span className="text-slate-500">Rogue:</span> https://amazon-benefits.portal-auth.com/enroll
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Echo Tutor Threat Breakdown:</strong> Look only at the text before the first &apos;/&apos;. The real owner is the last two parts of that domain (e.g., portal-auth.com). Attackers place &quot;amazon-benefits&quot; in the subdomain prefix to deceive users while hosting credential harvesters off-site.
              </p>
            </div>

            {/* Difference 3: Spoofed QR Destination */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              flaggedKeys.includes('diff_qr')
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>3. Spoofed QR Destination (Tracker / Hosting Domain Mismatch)</span>
                  {flaggedKeys.includes('diff_qr') ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identified</span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Missed</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400">QR Code Link</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500">Official QR Target:</span> {AUTHENTIC_QR_URL}
                </div>
                <div className="p-2 rounded bg-slate-900 text-rose-300 font-bold break-all">
                  <span className="text-slate-500">Rogue QR Target:</span> {PHISH_TRACKER_URL}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Echo Tutor Threat Breakdown:</strong> The QR code opened an unrelated hosting domain that doesn&apos;t match the address printed on the flyer. Always preview the URL your phone shows before opening it.
              </p>
            </div>

            {/* Difference 4: Manufactured Urgency & Panic Pressure */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              flaggedKeys.includes('diff_urgency')
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>4. Manufactured Urgency &amp; Panic Pressure</span>
                  {flaggedKeys.includes('diff_urgency') ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identified</span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Missed</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Social Engineering</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500">Official:</span> Oct 1 – Oct 31, 2026 (Annual Window)
                </div>
                <div className="p-2 rounded bg-slate-900 text-rose-300 font-bold">
                  <span className="text-slate-500">Rogue:</span> Enroll within 24 hours or lose coverage
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Echo Tutor Threat Breakdown:</strong> The rogue flyer threatens employees with immediate 24-hour loss of coverage. Genuine open enrollment periods at Amazon run for an entire month (Oct 1 – Oct 31). Threat actors manufacture artificial 24-hour emergencies to trigger panic so victims bypass verification.
              </p>
            </div>

            {/* Difference 5: Mismatched Document ID Code */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              flaggedKeys.includes('diff_form_id')
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <span>5. Mismatched Document ID Tracking Code</span>
                  {flaggedKeys.includes('diff_form_id') ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✓ Identified</span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">✗ Missed</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Footer Tracking</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <span className="text-slate-500">Official:</span> Doc ID: AMZ-HR-BEN-2026
                </div>
                <div className="p-2 rounded bg-slate-900 text-rose-300 font-bold">
                  <span className="text-slate-500">Rogue:</span> Doc ID: AMZ-HR-BEN-2026-X
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Echo Tutor Threat Breakdown:</strong> Notice the mismatched document ID: &quot;AMZ-HR-BEN-2026-X&quot; carries an unauthorized &quot;-X&quot; suffix not found on the authentic Amazon HR template. Attackers often copy older internal templates or fabricate revision tracking codes.
              </p>
            </div>
          </div>

          {/* Decoys Audit Section */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Decoy Elements Audit: Legitimate Corporate Realities</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-white font-mono text-[11px]">Campus Extension PBX</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  5-digit campus dial extensions (ext. 4-4321 / Tie-line #8-890) are standard corporate telephony at Amazon, not an indicator of fraud.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-white font-mono text-[11px]">Third-Party TPA Support</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Amazon officially partners with Fidelity NetBenefits to administer employee 401(k) and health accounts.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-white font-mono text-[11px]">ISO 8601 UTC Cutoff</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Amazon cloud infrastructure records automated cutoffs in UTC format to ensure consistency across global fulfillment centers and corporate hubs.
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Question Remediation Review */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
              Coworker Remediation Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong>Gold Standard Incident Protocol:</strong> When an employee enters corporate credentials into a rogue portal, they must immediately reset passwords, contact IT Security, and terminate active web sessions while reviewing MFA prompts. Passive actions like clearing phone browser cache leave corporate accounts completely exposed to the attacker.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
