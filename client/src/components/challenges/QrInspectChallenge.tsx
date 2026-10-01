import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  QrCode, 
  Flag, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Check,
  SplitSquareVertical,
  Mail,
  Globe,
  ExternalLink,
  Shield,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface QrInspectChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const QrInspectChallenge: React.FC<QrInspectChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral } = useEcho();
  const [foundDiffIds, setFoundDiffIds] = useState<string[]>([]);
  const [chosenAction, setChosenAction] = useState<string | null>(null);

  const totalDifferencesCount = 3;

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundDiffIds([]);
    setChosenAction(null);
  };

  const handleDifferenceClick = (diffId: string, isRealDifference: boolean, neutralText?: string) => {
    if (submitted) return;

    if (isRealDifference) {
      if (!foundDiffIds.includes(diffId)) {
        sounds.playSuccess();
        setFoundDiffIds(prev => [...prev, diffId]);
      } else {
        sounds.playClick();
      }

      if (diffId === 'diff_email') {
        explainThreat({
          id: 'diff_email',
          title: 'Typosquatting Domain ("rn" vs "m")',
          subtitle: 'benefits@rnicrosoft.com',
          severity: 'critical',
          explanation: 'The rogue flyer lists @rnicrosoft.com instead of @microsoft.com. The attacker paired "r" and "n" which visually mimics the single letter "m" in sans-serif fonts. Any employee emailing HR about benefits would unknowingly send SSNs and health information straight to the attacker.',
          attackerObjective: 'To intercept confidential HR inquiries, personal identifying information (PII), and employee benefit records.',
          proTip: 'Look closely at letters like "rn" vs "m", "vv" vs "w", and "cl" vs "d" in email addresses.'
        });
      } else if (diffId === 'diff_link') {
        explainThreat({
          id: 'diff_link',
          title: 'Lookalike Subdomain Phishing Gateway',
          subtitle: 'https://microsoft-benefits.portal-auth.com/enroll',
          severity: 'critical',
          explanation: 'The real portal is hosted at benefits.microsoft.com. The attacker crafted microsoft-benefits.portal-auth.com, placing the company brand in the subdomain prefix while the actual registered parent domain is "portal-auth.com".',
          attackerObjective: 'To harvest corporate single sign-on credentials and session cookies via an off-site clone.',
          proTip: 'Read URLs backwards from the first slash back to the domain suffix to identify who actually owns the site.'
        });
      } else if (diffId === 'diff_qr') {
        explainThreat({
          id: 'diff_qr',
          title: 'Spoofed & Unencrypted QR Destination ("Quishing")',
          subtitle: 'http://login-rnicrosoft.com/sso/benefits',
          severity: 'critical',
          explanation: 'QR code phishing ("quishing") directs mobile scanners away from secure company intranets. Here, the QR code redirects to an unencrypted HTTP site on a fraudulent domain designed to bypass corporate network inspection on personal phones.',
          attackerObjective: 'To exploit personal smartphones that lack corporate endpoint protection and SSL enforcement.',
          proTip: 'Always preview the resolved destination URL before opening links decoded from physical QR codes.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralText || 
        'This section matches the authentic company flyer template. Look closely at the email address, web portal link, and QR destination URL.',
        'Authentic Notice Section'
      );
    }
  };

  const handleDecision = (decisionKey: 'report_poster' | 'tear_down') => {
    if (submitted) return;
    sounds.playClick();
    setChosenAction(decisionKey);

    const isCorrect = decisionKey === 'report_poster' || decisionKey === 'tear_down';
    const scoreAwarded = isCorrect
      ? Math.round(50 + (foundDiffIds.length / totalDifferencesCount) * 50)
      : 0;
    const bonusAwarded = isCorrect && foundDiffIds.length === totalDifferencesCount ? (question.bonusPoints || 15) : 0;

    onSubmitAnswer({
      decision: decisionKey,
      foundIds: foundDiffIds,
      foundCount: foundDiffIds.length,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const isEmailDiffFound = foundDiffIds.includes('diff_email');
  const isLinkDiffFound = foundDiffIds.includes('diff_link');
  const isQrDiffFound = foundDiffIds.includes('diff_qr');

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <SplitSquareVertical className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Identify Differences: Compare the Official Notice with the Breakroom Flyer.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              The attacker copied the company flyer template. Inspect both notices side-by-side and click the 3 subtle differences (email typosquatting, lookalike link, and spoofed QR target) on the right flyer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(foundDiffIds.length > 0 || chosenAction !== null) && !submitted && (
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
            <span className="text-slate-400">Differences Identified:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              foundDiffIds.length === totalDifferencesCount
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : foundDiffIds.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {foundDiffIds.length} / {totalDifferencesCount}
            </span>
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE IDENTIFY DIFFERENCES COMPARISON GRID (Twin Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
        
        {/* PANEL 1: OFFICIAL CORPORATE NOTICE (REFERENCE) */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl select-none flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authentic Notice (Official Reference)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Corporate HR Template</span>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            {/* Flyer Header Banner */}
            <div 
              onClick={() => handleDifferenceClick('ref_header', false, 'Header and corporate branding match the authentic company style.')}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Microsoft Corporation • Human Resources</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Notice #MS-2026-B</span>
              </div>
              <div className="font-bold text-white text-sm sm:text-base tracking-tight">
                2026 Annual Employee Benefits Enrollment
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Review and update your healthcare coverage, dental plans, and retirement contributions.
              </p>
            </div>

            {/* Plan Highlights */}
            <div 
              onClick={() => handleDifferenceClick('ref_plans', false, 'The benefit bullet points are standard corporate boilerplate copied by the attacker.')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 cursor-pointer font-sans"
            >
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Standard Plan Options:</div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>Comprehensive Medical & Prescription Drug Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>100% Preventive Dental & Vision Healthcare</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>401(k) Retirement Account with 6% Company Matching</span>
                </div>
              </div>
            </div>

            {/* ELEMENT 1: AUTHENTIC EMAIL (Neutral, NO colored highlight) */}
            <div 
              onClick={() => handleDifferenceClick('ref_email', false, 'Official HR Email: benefits@microsoft.com. Notice the legitimate domain @microsoft.com. Compare this to the right flyer.')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>HR Support & Questions:</span>
              </div>
              <div className="font-mono text-xs text-slate-300">
                Email: benefits@microsoft.com
              </div>
            </div>

            {/* ELEMENT 2: AUTHENTIC WEB LINK (Neutral, NO colored highlight) */}
            <div 
              onClick={() => handleDifferenceClick('ref_link', false, 'Official Web Portal: https://benefits.microsoft.com/enroll. This uses the legitimate company subdomain. Compare this to the right flyer.')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Enroll Online via Web Browser:</span>
              </div>
              <div className="font-mono text-xs text-slate-300">
                Link: https://benefits.microsoft.com/enroll
              </div>
            </div>

            {/* ELEMENT 3: AUTHENTIC QR CODE & DESTINATION (Neutral, NO colored highlight) */}
            <div 
              onClick={() => handleDifferenceClick('ref_qr', false, 'Official Mobile QR destination: https://microsoft.com/sso/benefits. Secured with HTTPS and hosted on the authentic corporate domain.')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer text-center space-y-2"
            >
              <div className="text-[11px] font-bold text-slate-300">Or Scan Mobile QR Code for Quick Access:</div>
              <QrCode className="w-20 h-20 mx-auto text-white bg-slate-900 p-2 rounded-xl border border-slate-800" />
              <div className="text-[10px] font-mono text-slate-400">
                Destination: https://microsoft.com/sso/benefits
              </div>
            </div>

            {/* Flyer Footer */}
            <div 
              onClick={() => handleDifferenceClick('ref_footer', false, 'Official document reference identifier.')}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between cursor-pointer"
            >
              <span>Window: Oct 1 - Oct 31</span>
              <span>Doc ID: MS-HR-BEN-2026</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: ROGUE BREAKROOM FLYER (SPOT THE DIFFERENCES) */}
        <div className="rounded-3xl bg-slate-900 border-2 border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl select-none flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Breakroom Flyer (Click Differences)</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400">Spot 3 differences</span>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            {/* Flyer Header Banner (Matches Official) */}
            <div 
              onClick={() => handleDifferenceClick('rogue_header', false, 'The header and corporate logo are identical clones of the genuine flyer.')}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Microsoft Corporation • Human Resources</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Notice #MS-2026-B</span>
              </div>
              <div className="font-bold text-white text-sm sm:text-base tracking-tight">
                2026 Annual Employee Benefits Enrollment
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Review and update your healthcare coverage, dental plans, and retirement contributions.
              </p>
            </div>

            {/* Plan Highlights (Matches Official) */}
            <div 
              onClick={() => handleDifferenceClick('rogue_plans', false, 'The plan descriptions are identical to make the poster seem credible.')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 cursor-pointer font-sans"
            >
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Standard Plan Options:</div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>Comprehensive Medical & Prescription Drug Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>100% Preventive Dental & Vision Healthcare</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">•</span>
                  <span>401(k) Retirement Account with 6% Company Matching</span>
                </div>
              </div>
            </div>

            {/* DIFFERENCE 1: EMAIL TYPOSQUATTING (rnicrosoft.com vs microsoft.com) */}
            <div 
              onClick={() => handleDifferenceClick('diff_email', true)}
              className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                isEmailDiffFound
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>HR Support & Questions:</span>
              </div>
              <div className="font-mono text-xs">
                Email: <span className={isEmailDiffFound ? 'text-rose-300 underline font-bold' : 'text-slate-300'}>benefits@rnicrosoft.com</span>
              </div>
            </div>

            {/* DIFFERENCE 2: LOOKALIKE WEB LINK (microsoft-benefits.portal-auth.com) */}
            <div 
              onClick={() => handleDifferenceClick('diff_link', true)}
              className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                isLinkDiffFound
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-bold">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Enroll Online via Web Browser:</span>
              </div>
              <div className="font-mono text-xs">
                Link: <span className={isLinkDiffFound ? 'text-rose-300 underline font-bold' : 'text-slate-300'}>https://microsoft-benefits.portal-auth.com/enroll</span>
              </div>
            </div>

            {/* DIFFERENCE 3: LOOKALIKE QR CODE DESTINATION LINK */}
            <div 
              onClick={() => handleDifferenceClick('diff_qr', true)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center space-y-2 ${
                isQrDiffFound
                  ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-200 shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-300">Or Scan Mobile QR Code for Quick Access:</div>
              <QrCode className="w-20 h-20 mx-auto text-white bg-slate-900 p-2 rounded-xl border border-slate-800" />
              <div className="text-[10px] font-mono text-slate-400">
                Destination: <span className={isQrDiffFound ? 'text-rose-300 font-bold underline' : 'text-slate-300'}>http://login-rnicrosoft.com/sso/benefits</span>
              </div>
            </div>

            {/* Flyer Footer (Matches Official) */}
            <div 
              onClick={() => handleDifferenceClick('rogue_footer', false, 'The document reference footer is copied directly from the official notice.')}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between cursor-pointer"
            >
              <span>Window: Oct 1 - Oct 31</span>
              <span>Doc ID: MS-HR-BEN-2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Decision Section (100% Neutral Symmetrical Buttons) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl mx-auto space-y-3">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
          Decide your response after identifying the differences:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={submitted}
            onClick={() => handleDecision('report_poster')}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              chosenAction === 'report_poster'
                ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4 text-slate-400" />
            <span>Report Flyer to IT Security & Facilities</span>
          </button>

          <button
            type="button"
            disabled={submitted}
            onClick={() => handleDecision('tear_down')}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              chosenAction === 'tear_down'
                ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Tear Down Poster & Warn Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};
