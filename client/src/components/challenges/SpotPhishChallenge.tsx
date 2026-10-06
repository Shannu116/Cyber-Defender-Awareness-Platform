import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { 
  Mail, 
  ExternalLink, 
  Trash2, 
  Flag, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  Reply,
  ShieldAlert,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface SpotPhishChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

interface EmailItem {
  id: string;
  senderName: string;
  senderAddress: string;
  subject: string;
  time: string;
  isPhishing: boolean;
  unread: boolean;
}

const INBOX_EMAILS: EmailItem[] = [
  {
    id: 'email-genuine',
    senderName: 'HR Operations',
    senderAddress: 'hr-internal@company-internal.net',
    subject: 'Official: Annual Employee Benefits Overview',
    time: 'Yesterday',
    isPhishing: false,
    unread: false
  },
  {
    id: 'email-phish',
    senderName: 'Payroll Services',
    senderAddress: 'payroll-update@company-payroll-help.example',
    subject: 'Action Required: Payroll Information Update',
    time: '8:42 AM',
    isPhishing: true,
    unread: true
  }
];

export const SpotPhishChallenge: React.FC<SpotPhishChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral, registerChecklist, clearChecklist } = useEcho();

  const [activeEmailId, setActiveEmailId] = useState<string>('email-phish');
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'report' | 'delete' | 'reply' | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showPhishedWarning, setShowPhishedWarning] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);

  // Total suspicious targets to find in the phishing email
  const totalSuspiciousCount = 4;

  // Register Echo checklist on mount so the hint engine knows what to find
  useEffect(() => {
    registerChecklist([
      {
        id: 'suspicious_sender',
        label: 'Suspicious sender domain',
        hint: 'Expand the sender metadata dropdown or inspect the "From" header. Compare the domain after the @ symbol against your real company domain (@company-internal.net).',
        severity: 'high',
      },
      {
        id: 'suspicious_greeting',
        label: 'Generic impersonal greeting ("Hello,")',
        hint: 'Examine the opening greeting. Does it greet you by name or employee ID, or does it use a generic opener like "Hello,"?',
        severity: 'medium',
      },
      {
        id: 'suspicious_urgency',
        label: 'Manufactured urgency / payment delay threat',
        hint: 'Scan the body text for language creating panic — look for immediate end-of-day deadlines and threats of salary payment disruption.',
        severity: 'high',
      },
      {
        id: 'suspicious_link',
        label: 'Counterfeit destination URL link',
        hint: 'Hover over the "Verify Payroll Details" button. Does the destination address point to an external lookalike site (account-verification.example)?',
        severity: 'critical',
      },
    ]);
    return () => clearChecklist();
  }, [registerChecklist, clearChecklist]);

  const handleElementClick = (elementId: string, isSuspicious: boolean, label?: string) => {
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
          title: 'Lookalike Sender Domain Spoofing',
          subtitle: 'From: <payroll-update@company-payroll-help.example>',
          severity: 'high',
          explanation: 'The sender address uses "@company-payroll-help.example" instead of the verified internal company domain "@company-internal.net". Attackers register similar lookalike domains to impersonate internal corporate departments.',
          attackerObjective: 'To deceive employees into assuming an official company department sent this urgent notice.',
          proTip: 'Always expand the sender metadata and verify the domain name after the @ symbol.'
        });
      } else if (elementId === 'suspicious_greeting') {
        explainThreat({
          id: 'suspicious_greeting',
          title: 'Generic Impersonal Greeting ("Hello,")',
          subtitle: 'Lacks personal employee name or ID',
          severity: 'medium',
          explanation: 'Authentic internal HR notices are personalized to your employee account (e.g., "Hello Alex,"). Generic greetings indicate mass automated phishing blasts.',
          attackerObjective: 'Attackers cast broad nets across organizations without individual employee records.',
          proTip: 'Legitimate internal company services already know your full name and employee ID.'
        });
      } else if (elementId === 'suspicious_urgency') {
        explainThreat({
          id: 'suspicious_urgency',
          title: 'Manufactured Urgency & Salary Delay Threat',
          subtitle: '"Action must be taken before the end of the day to avoid salary payment delays."',
          severity: 'high',
          explanation: 'Threatening salary delay with a rigid deadline is a classic psychological pressure tactic designed to prompt hasty compliance without scrutiny.',
          attackerObjective: 'To cause panic so you click before checking authenticity.',
          proTip: 'Urgent threats of account suspension or delayed paychecks are the hallmark of social engineering.'
        });
      } else if (elementId === 'suspicious_link') {
        explainThreat({
          id: 'suspicious_link',
          title: 'External Credential Harvesting Link',
          subtitle: 'Destination: https://account-verification.example/login',
          severity: 'critical',
          explanation: 'The CTA button leads to "account-verification.example" rather than your internal HR portal. Submitting credentials here directly exposes your corporate login.',
          attackerObjective: 'To capture your corporate login password and intercept session tokens.',
          proTip: 'Always inspect the destination URL before clicking links in unexpected messages.'
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

  const handleLinkButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (submitted) return;
    handleElementClick('suspicious_link', true);
    sounds.playWarning();
    setShowPhishedWarning(true);
  };

  const handleFinalSubmit = (action: 'report' | 'delete' | 'reply') => {
    if (submitted) return;
    sounds.playClick();
    setSelectedAction(action);

    // Pass condition per changes.md: Find 3 of 4 clues to pass and choose "Report Phish"
    const hasEnoughClues = foundIds.length >= 3;
    const isCorrect = action === 'report' && hasEnoughClues;
    
    const scoreAwarded = isCorrect 
      ? 100
      : action === 'report'
      ? Math.round((foundIds.length / totalSuspiciousCount) * 70)
      : Math.round((foundIds.length / totalSuspiciousCount) * 40);

    const bonusAwarded = isCorrect && foundIds.length === totalSuspiciousCount ? (question.bonusPoints || 25) : 0;

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
    setShowPhishedWarning(false);
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
              You receive an email during a normal workday regarding employee payroll records verification. Inspect the email carefully to find anything suspicious before taking action.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Puzzle Metaphor: "Spot the Difference" — Compare the genuine internal notice in your Inbox against the lookalike phishing email. (Find 3 of 4 clues to pass)
            </p>
          </div>
        </div>

        {/* Counter & Clear Selection Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Suspicious Clues Found:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              foundIds.length >= 3
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

      {/* Simulated Desktop Email Client: Inbox + Reading Pane */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto">
        {/* Email Client App Top Bar */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-full bg-slate-800 inline-block" />
            <span className="font-mono text-slate-300 ml-2 font-semibold">Corporate Desktop Mail Client</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Inbox className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inbox: 2 Messages</span>
          </div>
        </div>

        {/* Client Layout: Left Sidebar (Inbox) + Right Area (Reading Pane) */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-[460px]">
          {/* Left Column: Inbox List (Spot the Difference Metaphor) */}
          <div className="md:col-span-4 bg-slate-950/60 p-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1 font-bold flex items-center justify-between">
              <span>Inbox Messages</span>
              <span className="text-cyan-400">Compare Emails</span>
            </div>

            {INBOX_EMAILS.map((email) => {
              const isSelected = activeEmailId === email.id;
              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => {
                    setActiveEmailId(email.id);
                    if (!email.isPhishing) {
                      explainNeutral(
                        'This is a clean, authentic internal notice from HR Operations (@company-internal.net). Notice it uses your verified company domain and greets you with your real name "Hi Alex,".',
                        'Clean Internal Notice'
                      );
                    }
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white truncate">{email.senderName}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{email.time}</span>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold truncate mb-1">
                    {email.subject}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={email.isPhishing ? 'text-amber-400' : 'text-emerald-400'}>
                      {email.isPhishing ? 'External domain' : 'Verified internal'}
                    </span>
                    {email.isPhishing && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                        Inspect
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-4">
              <span className="font-bold text-slate-300">💡 Spot the Difference:</span>
              <p className="leading-relaxed">
                Click between both messages to compare genuine corporate communications against the phishing email.
              </p>
            </div>
          </div>

          {/* Right Column: Reading Pane */}
          <div className="md:col-span-8 bg-slate-900/40 flex flex-col justify-between">
            {activeEmailId === 'email-phish' ? (
              /* Phishing Email View */
              <div>
                {/* Email Header Area */}
                <div className="p-5 bg-slate-950/60 border-b border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                      Action Required: Payroll Information Update
                    </h2>
                    <span className="text-slate-500 text-xs font-mono shrink-0">Today, 8:42 AM</span>
                  </div>

                  {/* Sender Header with Dropdown */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0 select-none">
                        PS
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200">Payroll Services</span>

                          {/* SENDER ADDRESS CLUE */}
                          <span
                            onClick={() => handleElementClick('suspicious_sender', true)}
                            className={`font-mono text-xs cursor-pointer select-none rounded px-1.5 py-0.5 transition-colors ${
                              isSenderFound
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Click to inspect sender address"
                          >
                            &lt;payroll-update@company-payroll-help.example&gt;
                          </span>
                        </div>

                        <div className="text-slate-500 font-mono text-[11px]">
                          To: Alex Morgan &lt;alex.morgan@company-internal.net&gt;
                        </div>
                      </div>
                    </div>

                    {/* Metadata Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailsExpanded(!isDetailsExpanded);
                        handleElementClick('suspicious_sender', true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isDetailsExpanded ? 'Hide Details' : 'Details'}</span>
                      {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Dropdown Details */}
                  {isDetailsExpanded && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300 animate-fadeIn">
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-16">From:</span>
                        <span 
                          onClick={() => handleElementClick('suspicious_sender', true)}
                          className={`cursor-pointer font-bold ${isSenderFound ? 'text-rose-400' : 'text-slate-200'}`}
                        >
                          Payroll Services &lt;payroll-update@company-payroll-help.example&gt;
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-16">Reply-To:</span>
                        <span className="text-rose-400">payroll-update@company-payroll-help.example</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-16">Security:</span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          Unverified external domain (SPF: Neutral, DKIM: None)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div className="p-6 space-y-5 text-slate-200 text-xs sm:text-sm leading-relaxed font-sans select-none">
                  {/* Generic Greeting Clue */}
                  <div>
                    <span
                      onClick={() => handleElementClick('suspicious_greeting', true)}
                      className={`rounded px-1.5 py-0.5 cursor-pointer transition-colors ${
                        isGreetingFound
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                          : 'text-slate-200 hover:bg-slate-800/40'
                      }`}
                      title="Click to inspect greeting"
                    >
                      Hello,
                    </span>
                  </div>

                  <p>
                    We are updating employee payroll records as part of our annual verification process.
                  </p>

                  {/* Manufactured Urgency Clue */}
                  <p>
                    <span
                      onClick={() => handleElementClick('suspicious_urgency', true)}
                      className={`rounded px-1.5 py-0.5 inline cursor-pointer transition-colors ${
                        isUrgencyFound
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-200 hover:bg-slate-800/40'
                      }`}
                      title="Click to inspect urgency clause"
                    >
                      Action must be taken before the end of the day to avoid salary payment delays.
                    </span>
                  </p>

                  {/* CTA Button: "Verify Payroll Details" with Hover Preview */}
                  <div className="py-2 relative inline-block">
                    <div
                      onMouseEnter={() => setIsHoveringLink(true)}
                      onMouseLeave={() => setIsHoveringLink(false)}
                      className="relative inline-block"
                    >
                      <button
                        type="button"
                        onClick={handleLinkButtonClick}
                        className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 select-none shadow-md cursor-pointer ${
                          isLinkFound
                            ? 'bg-rose-950 border-2 border-rose-500 text-rose-300'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        <span>Verify Payroll Details</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Hover Destination Preview Tooltip */}
                      {isHoveringLink && (
                        <div className="absolute left-0 top-full mt-2 z-20 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-cyan-300 shadow-xl whitespace-nowrap animate-fadeIn">
                          🔗 Link Destination: <strong className="text-rose-400">https://account-verification.example/login</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sign-off */}
                  <div className="pt-2 text-slate-400 text-xs space-y-1 border-t border-slate-800/80">
                    <div>Thank you,</div>
                    <div className="font-semibold text-slate-300">Payroll Services</div>
                    <div className="text-[11px] text-slate-500">Corporate Operations Department</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Genuine HR Notice View (Clean Reference for Spot the Difference) */
              <div className="p-6 space-y-5 text-slate-200 text-xs sm:text-sm">
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Official: Annual Employee Benefits Overview</h2>
                    <span className="text-slate-500 text-xs font-mono">Yesterday</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>From: HR Operations &lt;hr-internal@company-internal.net&gt;</span>
                  </div>
                  <div className="text-slate-400 text-xs font-mono">
                    To: Alex Morgan &lt;alex.morgan@company-internal.net&gt;
                  </div>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white">Hi Alex,</p>
                  <p>
                    Please review our updated annual employee benefits guide on the corporate intranet. All enrollment changes take effect during the standard open window next month.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
                    🔗 Intranet Portal: https://intranet.company-internal.net/benefits
                  </div>
                  <p className="text-slate-400 text-xs">
                    Notice: This genuine email uses your personal name, your corporate domain, and verified internal links without artificial urgency.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveEmailId('email-phish')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  <span>Return to Phishing Email</span>
                </button>
              </div>
            )}

            {/* Email Toolbar / Action Decision Section */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Email Toolbar: Decide your response
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  {foundIds.length} of 4 clues discovered
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleFinalSubmit('report')}
                  className={`py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedAction === 'report'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Flag className="w-4 h-4 text-slate-400" />
                  <span>Report Phish</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleFinalSubmit('delete')}
                  className={`py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedAction === 'delete'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <span>Delete Message</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => handleFinalSubmit('reply')}
                  className={`py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedAction === 'reply'
                      ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Reply className="w-4 h-4 text-slate-400" />
                  <span>Reply to Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Phished Warning Modal if user clicks CTA link directly */}
      {showPhishedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/60 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowPhishedWarning(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">Phished Landing Page Simulation</h3>
                <p className="text-xs text-slate-400">Untrusted destination link clicked</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-rose-200">
                ⚠️ In a real phishing attack, clicking "Verify Payroll Details" loads a counterfeit clone login page designed to capture your company credentials.
              </p>
              <p className="text-slate-400">
                Notice the URL pointed to <strong className="text-rose-400 font-mono">account-verification.example</strong> instead of your company portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPhishedWarning(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
            >
              Return to Email & Report Phish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
