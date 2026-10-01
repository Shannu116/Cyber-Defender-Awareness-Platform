import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Mail, 
  ExternalLink, 
  Trash2, 
  Flag, 
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface SpotPhishChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

export const SpotPhishChallenge: React.FC<SpotPhishChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral } = useEcho();

  // Elements found by the user
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'report' | 'delete' | 'ignore' | null>(null);

  // Total suspicious targets to find
  const totalSuspiciousCount = 4;

  const handleElementClick = (elementId: string, isSuspicious: boolean, label?: string, explanation?: string) => {
    if (submitted) return;

    if (isSuspicious) {
      if (!foundIds.includes(elementId)) {
        sounds.playSuccess();
        setFoundIds(prev => [...prev, elementId]);
      } else {
        sounds.playClick();
      }

      if (elementId === 'suspicious_sender') {
        explainThreat({
          id: 'suspicious_sender',
          title: 'External Lookalike Domain Spoofing',
          subtitle: 'Sender: <payroll-update@company-payroll-help.example>',
          severity: 'high',
          explanation: 'The sender uses "@company-payroll-help.example" instead of your authentic internal domain "@company-internal.net". Attackers register lookalike domains to impersonate internal departments.',
          attackerObjective: 'To deceive you into thinking an official corporate department authored this urgent message.',
          proTip: 'Always check the full domain name after the @ symbol, not just the display name.'
        });
      } else if (elementId === 'suspicious_greeting') {
        explainThreat({
          id: 'suspicious_greeting',
          title: 'Generic Impersonal Greeting ("Hello,")',
          subtitle: 'Lacks personal employee name or ID',
          severity: 'medium',
          explanation: 'Authentic internal HR and Payroll notices are tied to your employee profile and address you by your personal name (e.g., "Hello Alex,"). Generic greetings indicate a bulk automated phishing campaign.',
          attackerObjective: 'Attackers cast wide nets to thousands of recipients without customizing individual names.',
          proTip: 'Legitimate internal company services already know your full name and employee ID.'
        });
      } else if (elementId === 'suspicious_urgency') {
        explainThreat({
          id: 'suspicious_urgency',
          title: 'Manufactured Urgency & Penalty Threat',
          subtitle: '"before the end of the day to avoid delays"',
          severity: 'high',
          explanation: 'Threatening payment disruption with an immediate "before the end of the day" deadline is a classic psychological manipulation tactic designed to bypass critical scrutiny through panic.',
          attackerObjective: 'To short-circuit your critical thinking and prompt an emotional, hurried reaction.',
          proTip: 'Urgent threats of account suspension or delayed salary are the #1 hallmark of social engineering.'
        });
      } else if (elementId === 'suspicious_link') {
        explainThreat({
          id: 'suspicious_link',
          title: 'Counterfeit Credential Harvesting Link',
          subtitle: 'Destination: https://account-verification.example/login',
          severity: 'critical',
          explanation: 'The button points to an external credential harvesting site, not your company\'s legitimate HR portal. Clicking it would expose your corporate single sign-on credentials to attackers.',
          attackerObjective: 'To steal your enterprise login password and capture multi-factor session tokens.',
          proTip: 'Never click links in unexpected emails. Navigate independently using verified browser bookmarks.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        label || 'This section is standard corporate formatting. Look closely at sender addresses, false urgency, or external links.',
        'Authentic Email Element'
      );
    }
  };

  const handleFinalSubmit = (action: 'report' | 'delete' | 'ignore') => {
    if (submitted) return;
    sounds.playClick();
    setSelectedAction(action);

    const isCorrect = action === 'report' || (action === 'delete' && foundIds.length >= 2);
    const scoreAwarded = isCorrect 
      ? Math.round(50 + (foundIds.length / totalSuspiciousCount) * 50)
      : Math.round((foundIds.length / totalSuspiciousCount) * 40);
    const bonusAwarded = isCorrect && foundIds.length >= 3 ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      action,
      foundIds,
      foundCount: foundIds.length,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const handleClearSelection = () => {
    if (submitted) return;
    sounds.playClick();
    setFoundIds([]);
    setSelectedAction(null);
  };

  const isSenderFound = foundIds.includes('suspicious_sender');
  const isGreetingFound = foundIds.includes('suspicious_greeting');
  const isUrgencyFound = foundIds.includes('suspicious_urgency');
  const isLinkFound = foundIds.includes('suspicious_link');

  return (
    <div className="space-y-6">
      {/* Top Scenario & Investigation Objective */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Below is an email. Find the suspicious elements within it.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Read carefully and click directly on words, headers, or links that raise security red flags.
            </p>
          </div>
        </div>

        {/* Counter & Clear Selection Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Discovery Counter Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Suspicious Elements Found:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              foundIds.length === totalSuspiciousCount
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : foundIds.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {foundIds.length} / {totalSuspiciousCount}
            </span>
          </div>

          {(foundIds.length > 0 || selectedAction) && !submitted && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Realistic Corporate Email View (NO PRE-HIGHLIGHTS OR BUTTON CLUES) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-w-3xl mx-auto">
        {/* Email Window Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="font-mono text-slate-400 ml-2 font-medium">Corporate Webmail • Inbox</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span>Today, 8:42 AM</span>
            <span>•</span>
            <span className="text-slate-400">Message ID #48921</span>
          </div>
        </div>

        {/* Email Header Area */}
        <div className="p-5 sm:p-6 bg-slate-950/60 border-b border-slate-800 space-y-4">
          {/* Subject Line */}
          <div 
            onClick={() => handleElementClick('subject', false, 'The subject line is typical for workplace communication, but always verify the actual sender address.')}
            className="cursor-pointer flex items-start justify-between gap-4"
          >
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              Action Required: Payroll Information Update
            </h2>
            <span className="text-slate-600 text-xs font-mono">Normal Priority</span>
          </div>

          {/* Sender & Recipient Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0 select-none">
              PS
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-200">Payroll Services</span>

                {/* SENDER ADDRESS: Completely identical styling, NO hover color change, NO title tooltip */}
                <span
                  onClick={() => handleElementClick('suspicious_sender', true)}
                  className={`font-mono text-xs cursor-pointer select-none rounded px-1.5 py-0.5 transition-colors ${
                    isSenderFound
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  &lt;payroll-update@company-payroll-help.example&gt;
                </span>
              </div>

              {/* Recipient */}
              <div 
                onClick={() => handleElementClick('recipient', false, 'To: alex.morgan@company-internal.net is your real internal corporate email.')}
                className="text-slate-500 font-mono text-[11px] cursor-pointer"
              >
                To: Alex Morgan &lt;alex.morgan@company-internal.net&gt;
              </div>
            </div>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 sm:p-8 space-y-5 text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-900/40 font-sans cursor-pointer select-none">
          {/* GREETING: No hover color change */}
          <div>
            <span
              onClick={() => handleElementClick('suspicious_greeting', true)}
              className={`rounded px-1 py-0.5 transition-colors ${
                isGreetingFound
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                  : 'text-slate-200'
              }`}
            >
              Hello,
            </span>
          </div>

          {/* Body Paragraph 1 */}
          <p
            onClick={() => handleElementClick('body_intro', false, 'This sentence provides a believable corporate pretext, which attackers often use to sound normal.')}
            className="text-slate-200"
          >
            We are updating employee payroll records as part of our annual verification process.
          </p>

          {/* Body Paragraph 2 with Suspicious Urgency Phrase: Completely seamless, NO hover color change */}
          <p className="leading-relaxed text-slate-200">
            Please review your information{' '}
            <span
              onClick={() => handleElementClick('suspicious_urgency', true)}
              className={`rounded px-1 py-0.5 inline transition-colors ${
                isUrgencyFound
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                  : 'text-slate-200'
              }`}
            >
              before the end of the day to avoid delays with your next payment
            </span>
            .
          </p>

          {/* CALL TO ACTION BUTTON / LINK: Looks like a normal email button until clicked */}
          <div className="py-2">
            <button
              type="button"
              onClick={() => handleElementClick('suspicious_link', true)}
              className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 select-none shadow-md ${
                isLinkFound
                  ? 'bg-rose-950 border-2 border-rose-500 text-rose-300 shadow-rose-950/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <span>Review Payroll Information</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Sign-off */}
          <div 
            onClick={() => handleElementClick('signoff', false, 'Generic signature block commonly forged by attackers.')}
            className="pt-2 text-slate-400 text-xs space-y-1 border-t border-slate-800/80 cursor-pointer hover:text-slate-300 transition-colors"
          >
            <div>Thank you,</div>
            <div className="font-semibold text-slate-300">Payroll Services</div>
            <div className="text-[11px] text-slate-500">Corporate Operations Department</div>
          </div>
        </div>

        {/* Action Decision Section */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider font-mono">
              Decision: What action should you take?
            </span>
            <span className="text-slate-400 text-[11px]">
              {foundIds.length === 0 ? 'Click suspicious parts above before deciding' : `${foundIds.length} of ${totalSuspiciousCount} red flags marked`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Primary Action: Report Phishing */}
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('report')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedAction === 'report'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4 text-slate-400" />
              <span>Report Phishing</span>
            </button>

            {/* Alternative Action: Delete */}
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('delete')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedAction === 'delete'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Delete Message</span>
            </button>

            {/* Incorrect Action: Ignore / Reply */}
            <button
              type="button"
              disabled={submitted}
              onClick={() => handleFinalSubmit('ignore')}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedAction === 'ignore'
                  ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Ignore / Do Nothing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
