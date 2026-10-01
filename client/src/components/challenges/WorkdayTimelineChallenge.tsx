import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Calendar, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Award,
  FileText,
  MessageSquare,
  Smartphone,
  FolderOpen,
  Info,
  MapPin,
  Laptop,
  Lock,
  BellRing,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface WorkdayTimelineChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

interface IncidentItem {
  id: string;
  time: string;
  tag: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  scenario: string;
  artifactType: 'email' | 'chat' | 'phone_mfa' | 'file';
  totalRedFlags: number;
  protocols: {
    id: string;
    text: string;
    isSafe: boolean;
    feedback: string;
  }[];
}

export const WorkdayTimelineChallenge: React.FC<WorkdayTimelineChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  const { explainThreat, explainNeutral } = useEcho();
  const incidents: IncidentItem[] = [
    {
      id: 'inc-1',
      time: '09:15 AM',
      tag: 'Accounts Payable Inbox',
      title: 'Vendor Wire Transfer Alteration Request',
      icon: Mail,
      scenario: 'You arrive at your desk and open your morning finance inbox. An urgent email arrives requesting an emergency alteration to bank wiring instructions for a pending vendor payment.',
      artifactType: 'email',
      totalRedFlags: 3,
      protocols: [
        {
          id: 'p-1-wire',
          text: 'Route the $48,200 wire transfer immediately to ensure critical supply shipments are not delayed',
          isSafe: false,
          feedback: 'Catastrophic: Wire transfers cannot be recalled once sent. You fell for a Business Email Compromise (BEC) wire redirection scam.'
        },
        {
          id: 'p-1-verify',
          text: 'Hold the wire transfer and verify bank change details out-of-band via the vendor’s pre-established corporate phone directory',
          isSafe: true,
          feedback: 'Optimal Defense: Never accept banking routing changes via email alone. Always perform dual-custody verification via verified voice channels.'
        },
        {
          id: 'p-1-reply',
          text: 'Reply directly to the email asking the sender to confirm if they are authorized to make banking changes',
          isSafe: false,
          feedback: 'Ineffective: Replying to the email merely contacts the attacker, who will gladly confirm their own fraudulent request.'
        }
      ]
    },
    {
      id: 'inc-2',
      time: '11:45 AM',
      tag: 'Executive Collaboration Chat',
      title: 'Executive Impersonation via Direct Message',
      icon: MessageSquare,
      scenario: 'While preparing a status deck, a direct chat message pops up from someone using your Chief Executive Officer’s name and corporate headshot.',
      artifactType: 'chat',
      totalRedFlags: 3,
      protocols: [
        {
          id: 'p-2-buy',
          text: 'Purchase the gift cards immediately on your personal card and submit an expense report later',
          isSafe: false,
          feedback: 'Vulnerable: You suffered an Executive Impersonation / CEO Fraud scam. Company funds would be irrecoverably lost.'
        },
        {
          id: 'p-2-verify',
          text: 'Flag the impersonation and verify the request through the CEO’s executive assistant or official internal desk extension',
          isSafe: true,
          feedback: 'Optimal Defense: Independent verification through established internal channels dismantles impersonation attacks.'
        },
        {
          id: 'p-2-ignore',
          text: 'Ignore the message and close the chat window without notifying anyone or logging the incident',
          isSafe: false,
          feedback: 'Incomplete: Concealing the attack leaves your colleagues vulnerable to the exact same impersonator.'
        }
      ]
    },
    {
      id: 'inc-3',
      time: '02:20 PM',
      tag: 'Smartphone Authenticator',
      title: 'MFA Push Bombardment / Foreign Authentication',
      icon: Smartphone,
      scenario: 'Your mobile phone repeatedly vibrates on your desk. Your corporate Authenticator app is receiving repeated login approval prompts from a foreign territory.',
      artifactType: 'phone_mfa',
      totalRedFlags: 3,
      protocols: [
        {
          id: 'p-3-approve',
          text: 'Tap "Approve" on your phone to silence the repeated buzzing notifications',
          isSafe: false,
          feedback: 'Critical Breach: Approving foreign MFA prompts grants the attacker unrestricted access to corporate internal networks.'
        },
        {
          id: 'p-3-deny',
          text: 'Deny the authentication prompt, mark as fraudulent in the app, and immediately reset your corporate password',
          isSafe: true,
          feedback: 'Optimal Defense: Denying the push stops unauthorized entry; resetting your password neutralizes the compromised credential.'
        },
        {
          id: 'p-3-silence',
          text: 'Put your phone in "Do Not Disturb" mode for the afternoon and hope the notifications stop',
          isSafe: false,
          feedback: 'Hazardous: Ignoring active credential abuse allows attackers to keep trying or exploit other authentication pathways.'
        }
      ]
    },
    {
      id: 'inc-4',
      time: '04:35 PM',
      tag: 'Workstation Downloads',
      title: 'Disguised Executable in Downloads Folder',
      icon: FolderOpen,
      scenario: 'While reviewing meeting invites for tomorrow, you notice an unfamiliar file appeared in your workstation Downloads folder titled as a salary review.',
      artifactType: 'file',
      totalRedFlags: 3,
      protocols: [
        {
          id: 'p-4-open',
          text: 'Double-click the file to check if your department is included in the salary bonus schedule',
          isSafe: false,
          feedback: 'Severe Infection: Executing a disguised binary detonates ransomware or infostealer malware on your endpoint.'
        },
        {
          id: 'p-4-contain',
          text: 'Do not open the file, disconnect workstation from Wi-Fi/Ethernet, and report the download to IT Security / SOC',
          isSafe: true,
          feedback: 'Optimal Defense: Halting execution and isolating the endpoint protects both your device and the entire corporate intranet.'
        },
        {
          id: 'p-4-rename',
          text: 'Rename the file to remove the .exe suffix and try opening it in your standard PDF reader',
          isSafe: false,
          feedback: 'Dangerous: Modifying extensions does not make a malicious compiled binary safe to handle.'
        }
      ]
    }
  ];

  const [activeIncidentIndex, setActiveIncidentIndex] = useState<number>(0);

  // Track discovered red flag element IDs per incident
  const [foundElementIds, setFoundElementIds] = useState<Record<string, string[]>>({});

  // Track chosen protocol per incident
  const [selectedProtocols, setSelectedProtocols] = useState<Record<string, string>>({});

  const handleElementClick = (incidentId: string, elementId: string, isRedFlag: boolean, neutralNotice?: string) => {
    if (submitted) return;

    if (isRedFlag) {
      setFoundElementIds(prev => {
        const current = prev[incidentId] || [];
        if (current.includes(elementId)) {
          sounds.playClick();
          return prev;
        }
        sounds.playSuccess();
        return { ...prev, [incidentId]: [...current, elementId] };
      });

      // Explain finding via Echo
      if (elementId === 'email_sender') {
        explainThreat({
          id: 'email_sender',
          title: 'Lookalike External Domain (.top)',
          subtitle: 'billing@acme-vendor-portal.top',
          severity: 'critical',
          explanation: 'The sender domain is acme-vendor-portal.top instead of @acme-vendor.com. Attackers register cheap lookalike domains on unusual TLDs to stage Business Email Compromise (BEC) fraud and divert corporate disbursements.',
          attackerObjective: 'To impersonate a key vendor\'s accounts receivable division.',
          proTip: 'Always check the domain suffix and TLD (.com vs .top/.xyz) on incoming financial invoices.'
        });
      } else if (elementId === 'email_wire') {
        explainThreat({
          id: 'email_wire',
          title: 'Unsolicited Bank Account Routing Diversion',
          subtitle: 'Wire $48,200 to alternate escrow account',
          severity: 'critical',
          explanation: 'Requesting that corporate payments be redirected to a new "alternate escrow account" is the hallmark of wire fraud. Wire transfers cannot be reversed once cleared by the Federal Reserve / SWIFT network.',
          attackerObjective: 'To divert massive corporate payments directly into an attacker-controlled mule bank account.',
          proTip: 'Never accept banking routing changes via email alone; always conduct dual-custody voice verification.'
        });
      } else if (elementId === 'email_urgency') {
        explainThreat({
          id: 'email_urgency',
          title: 'Artificial Urgency & Coercive Deadline',
          subtitle: 'Must be initiated before 11:00 AM to prevent shipment hold',
          severity: 'high',
          explanation: 'Imposing a strict "before 11:00 AM" deadline creates psychological panic so finance staff rush to process the wire before verifying standard dual-approval controls.',
          attackerObjective: 'To bypass internal approval checklists through manufactured time pressure.',
          proTip: 'Urgent payment deadlines threatening supply disruption are almost always fraudulent.'
        });
      } else if (elementId === 'chat_pretext') {
        explainThreat({
          id: 'chat_pretext',
          title: 'Pretexting & Obstruction of Voice Verification',
          subtitle: 'In Offsite Board Meeting (Cannot take calls)',
          severity: 'medium',
          explanation: 'Stating they are trapped in an offsite meeting and cannot take calls is a deliberate roadblock to prevent you from picking up the phone to verify the CEO\'s voice.',
          attackerObjective: 'To isolate the employee and eliminate direct secondary verification.',
          proTip: 'Whenever an executive says they cannot take calls while asking for unusual tasks, verify independently.'
        });
      } else if (elementId === 'chat_giftcards') {
        explainThreat({
          id: 'chat_giftcards',
          title: 'Request for Irreversible Gift Card Currency',
          subtitle: 'Purchase 5 × $100 Apple / Google Play gift cards',
          severity: 'critical',
          explanation: 'Retail gift cards are untraceable and cannot be refunded once codes are transmitted. Authentic corporate procurement never instructs employees to purchase retail gift cards.',
          attackerObjective: 'To obtain instantly liquid digital assets that can be converted immediately to cryptocurrency.',
          proTip: 'Companies never purchase retail gift cards via employee credit cards for business operations.'
        });
      } else if (elementId === 'chat_codes') {
        explainThreat({
          id: 'chat_codes',
          title: 'Demand for Immediate Code Exfiltration',
          subtitle: 'Scratch off backs and send clear photos of claim codes',
          severity: 'critical',
          explanation: 'Once photos of gift card PIN codes are sent, the attacker drains the balances in seconds on online exchanges. The reimbursement promise is completely fake.',
          attackerObjective: 'Immediate exfiltration and laundering of digital redemption codes.',
          proTip: 'Treat gift card PIN codes like cash or passwords; never transmit them across chat.'
        });
      } else if (elementId === 'mfa_service') {
        explainThreat({
          id: 'mfa_service',
          title: 'Primary Password Already Compromised',
          subtitle: 'Corporate Single Sign-On (SSO) Authenticator',
          severity: 'high',
          explanation: 'An MFA push prompt only appears when an attacker enters your valid corporate username and password. The attacker already has your password; MFA is your final active barrier.',
          attackerObjective: 'Attacker is trying to complete the secondary authentication step for full network access.',
          proTip: 'If you receive an unprompted MFA challenge, change your master password immediately.'
        });
      } else if (elementId === 'mfa_fatigue') {
        explainThreat({
          id: 'mfa_fatigue',
          title: 'MFA Fatigue (Push Bombardment Attack)',
          subtitle: '7 repeated approval requests in 2 minutes',
          severity: 'critical',
          explanation: 'Threat actors repeatedly bombard victim phones with push notifications, hoping the user taps "Approve" simply to silence the annoying buzzing.',
          attackerObjective: 'To induce panic or accidental approval to bypass two-factor authentication.',
          proTip: 'Never tap "Approve" to stop phone buzzing. Tap "Deny" and notify security immediately.'
        });
      } else if (elementId === 'mfa_location') {
        explainThreat({
          id: 'mfa_location',
          title: 'Impossible Travel Anomaly',
          subtitle: 'Location: São Paulo, Brazil • IP: 177.136.241.9',
          severity: 'critical',
          explanation: 'You are physically working in your office; an authentication prompt originating from an unrecognized IP in Brazil indicates unauthorized foreign access.',
          attackerObjective: 'Remote account takeover by overseas adversary.',
          proTip: 'Examine geo-location and client IP in all multi-factor authentication push prompts.'
        });
      } else if (elementId === 'file_double_ext') {
        explainThreat({
          id: 'file_double_ext',
          title: 'Double Extension Deception (.pdf.exe)',
          subtitle: 'Q3_Company_Bonus_and_Salary_Schedule.pdf.exe',
          severity: 'critical',
          explanation: 'Cybercriminals append .pdf.exe knowing default operating system settings hide known file extensions. Users only see ...Schedule.pdf, tricking them into executing malicious binary code.',
          attackerObjective: 'To disguise an executable Trojan or ransomware payload as an innocuous PDF document.',
          proTip: 'Configure your operating system to show file extensions for all file types.'
        });
      } else if (elementId === 'file_type') {
        explainThreat({
          id: 'file_type',
          title: 'Executable Binary Program Disguised as Document',
          subtitle: 'Type: Application (.exe)',
          severity: 'critical',
          explanation: 'A legitimate corporate salary spreadsheet is a PDF or XLSX document. An Application (.exe) executes compiled machine code (ransomware or infostealers) that compromises your endpoint.',
          attackerObjective: 'To execute unauthorized native binaries with local user privileges.',
          proTip: 'Never launch .exe, .scr, .vbs, or .bat files disguised as business documents.'
        });
      } else if (elementId === 'file_origin') {
        explainThreat({
          id: 'file_origin',
          title: 'Calendar Invite Ingress Vector',
          subtitle: 'Downloaded via script from calendar invite hyperlink',
          severity: 'high',
          explanation: 'Attackers increasingly leverage unsolicited calendar meeting invites to sneak malicious drive-by download links past perimeter email spam filters.',
          attackerObjective: 'To bypass email security filters by using meeting description hyperlinks.',
          proTip: 'Do not click hyperlinks embedded in meeting invites from unknown or external attendees.'
        });
      }
    } else {
      sounds.playClick();
      explainNeutral(
        neutralNotice || 'This item is standard corporate information. Look closely for anomalies or deceptive details.',
        'Standard Corporate Artifact'
      );
    }
  };

  const handleProtocolSelect = (incidentId: string, protocolId: string) => {
    if (submitted) return;
    sounds.playClick();
    setSelectedProtocols(prev => ({
      ...prev,
      [incidentId]: protocolId
    }));
  };

  const allIncidentsTriaged = incidents.every(inc => selectedProtocols[inc.id] !== undefined);

  const handleFinalSubmit = () => {
    if (!allIncidentsTriaged || submitted) return;

    let safeCount = 0;
    const decisions: Record<string, any> = {};

    incidents.forEach(inc => {
      const chosenId = selectedProtocols[inc.id];
      const protocol = inc.protocols.find(p => p.id === chosenId);
      const isSafe = protocol?.isSafe ?? false;
      if (isSafe) safeCount++;
      decisions[inc.id] = {
        chosenId,
        isSafe,
        feedback: protocol?.feedback || '',
        discoveredFlags: (foundElementIds[inc.id] || []).length
      };
    });

    const isCorrect = safeCount >= 3;
    const scoreAwarded = isCorrect ? question.points : Math.round((safeCount / 4) * question.points);
    const bonusAwarded = safeCount === 4 ? (question.bonusPoints || 25) : 0;

    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playWarning();
    }

    onSubmitAnswer({
      decisions,
      safeCount,
      totalIncidents: 4,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  const currentIncident = incidents[activeIncidentIndex];
  const CurrentIcon = currentIncident.icon;
  const currentDiscovered = foundElementIds[currentIncident.id] || [];

  const handleClearCurrentSelection = () => {
    if (submitted) return;
    sounds.playClick();
    const currentId = currentIncident.id;
    setFoundElementIds(prev => {
      const next = { ...prev };
      delete next[currentId];
      return next;
    });
    setSelectedProtocols(prev => {
      const next = { ...prev };
      delete next[currentId];
      return next;
    });
  };

  const hasCurrentSelection = currentDiscovered.length > 0 || selectedProtocols[currentIncident.id] !== undefined;

  return (
    <div className="space-y-6">
      {/* Top Objective Guidance Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 shadow-md">
        <Calendar className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-200">
          <strong className="text-cyan-300 font-bold">Workplace Incident Triage:</strong>{' '}
          Below is your workday timeline. Read each encounter carefully and click directly on suspicious text, addresses, or metadata within the artifact to find the red flags yourself.
        </div>
      </div>

      {/* Main Console Container */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Timeline Navigation Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              Workday Incidents ({Object.keys(selectedProtocols).length}/4 Triaged)
            </h3>
          </div>
          <div className="text-xs font-mono text-cyan-400">
            Encounter {activeIncidentIndex + 1} of 4
          </div>
        </div>

        {/* 4 Workday Incident Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {incidents.map((inc, idx) => {
            const isTriaged = selectedProtocols[inc.id] !== undefined;
            const isCurrent = activeIncidentIndex === idx;

            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveIncidentIndex(idx);
                }}
                className={`p-3 rounded-2xl border text-xs font-mono transition-all text-left flex flex-col justify-between gap-1.5 ${
                  isCurrent
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                    : isTriaged
                    ? 'bg-slate-950 border-slate-700 text-slate-200 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{inc.time}</span>
                  {isTriaged && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] truncate text-slate-400 font-sans">
                  {inc.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Incident Header & Discovery Counter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-cyan-400 font-bold">
                  {currentIncident.time} • {currentIncident.tag}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  {currentIncident.title}
                </h4>
              </div>
            </div>

            {/* Red Flags Discovery Counter Badge & Clear Selection */}
            <div className="flex items-center gap-2">
              {hasCurrentSelection && !submitted && (
                <button
                  type="button"
                  onClick={handleClearCurrentSelection}
                  className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Selection</span>
                </button>
              )}

              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2">
                <span className="text-slate-400">Suspicious Elements:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  currentDiscovered.length === currentIncident.totalRedFlags
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : currentDiscovered.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentDiscovered.length} / {currentIncident.totalRedFlags}
                </span>
              </div>
            </div>
          </div>

          {/* Scenario Overview */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {currentIncident.scenario}
          </p>

          {/* REALISTIC ARTIFACT INTERACTION WINDOW (Challenge 1 format) */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
            {/* Artifact Window Header Ribbon */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="ml-2 font-bold text-slate-300 capitalize">{currentIncident.artifactType} Viewer</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Click parts of the artifact to investigate</span>
            </div>

            {/* ARTIFACT 1: EMAIL */}
            {currentIncident.id === 'inc-1' && (
              <div className="p-5 sm:p-6 space-y-4 font-sans text-xs sm:text-sm select-none">
                {/* Header fields */}
                <div className="space-y-1.5 pb-3 border-b border-slate-800 text-xs">
                  {/* Sender Field with Clickable Domain */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-400">From:</span>
                    <span className="text-slate-300">Accounts Billing</span>
                    <span
                      onClick={() => handleElementClick('inc-1', 'email_sender', true)}
                      className={`font-mono text-xs cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('email_sender')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      &lt;billing@acme-vendor-portal.top&gt;
                    </span>
                  </div>

                  {/* Recipient Field */}
                  <div 
                    onClick={() => handleElementClick('inc-1', 'email_recipient', false, 'To: finance-team@company.internal is your authentic corporate distribution address.')}
                    className="text-slate-500 cursor-pointer text-[11px]"
                  >
                    <strong className="text-slate-400">To:</strong> finance-team@company.internal
                  </div>

                  {/* Subject Line */}
                  <div 
                    onClick={() => handleElementClick('inc-1', 'email_subject', false, 'Subject line mentions an invoice number to appear credible, but check the sender and wire details.')}
                    className="cursor-pointer"
                  >
                    <strong className="text-slate-400">Subject:</strong>{' '}
                    <span className="text-white font-bold">URGENT: Change of Bank Wire Details for Invoice #84102</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <p 
                    onClick={() => handleElementClick('inc-1', 'email_intro', false, 'The opening sentence establishes a plausible business pretext about an annual corporate transition.')}
                    className="cursor-pointer"
                  >
                    Dear Finance Team, Due to an annual corporate banking transition, our primary receiving account is temporarily unavailable.
                  </p>

                  <p className="leading-relaxed">
                    Please immediately update invoice #84102 to{' '}
                    {/* WIRE DIVERSION PHRASE */}
                    <span
                      onClick={() => handleElementClick('inc-1', 'email_wire', true)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('email_wire')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      wire the $48,200 payment to our alternate escrow account
                    </span>{' '}
                    details attached below.{' '}
                    {/* URGENCY DEADLINE PHRASE */}
                    <span
                      onClick={() => handleElementClick('inc-1', 'email_urgency', true)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('email_urgency')
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      This transfer must be initiated before 11:00 AM to prevent holds
                    </span>{' '}
                    on pending supply shipments.
                  </p>
                </div>

                {/* Attachment Row */}
                <div 
                  onClick={() => handleElementClick('inc-1', 'email_attachment', false, 'The PDF attachment contains forged bank wiring instructions designed to look authentic.')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Updated_Wire_Instructions_2026.pdf (142 KB)</span>
                </div>
              </div>
            )}

            {/* ARTIFACT 2: CEO CHAT */}
            {currentIncident.id === 'inc-2' && (
              <div className="p-5 sm:p-6 space-y-4 font-sans text-xs sm:text-sm select-none">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                      SM
                    </div>
                    <div>
                      <div 
                        onClick={() => handleElementClick('inc-2', 'chat_name', false, 'Display names and profile pictures in chat can easily be copied or spoofed by attackers.')}
                        className="font-bold text-white cursor-pointer"
                      >
                        Sarah Miller (Chief Executive Officer)
                      </div>
                      {/* PRETEXT STATUS */}
                      <span
                        onClick={() => handleElementClick('inc-2', 'chat_pretext', true)}
                        className={`text-[11px] font-mono cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                          currentDiscovered.includes('chat_pretext')
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        ● In Offsite Board Meeting (Cannot take calls)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Corporate DM</span>
                </div>

                {/* Chat Bubble Message */}
                <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl rounded-tl-sm border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl space-y-3">
                  <p 
                    onClick={() => handleElementClick('inc-2', 'chat_greeting', false, 'Opening conversation casually to check if the employee is responsive.')}
                    className="cursor-pointer text-slate-300"
                  >
                    Hey, are you at your desk? I am currently trapped in an emergency offsite client meeting with terrible cell reception.
                  </p>

                  <p className="leading-relaxed">
                    I need a confidential favor right away. Please{' '}
                    {/* GIFT CARD DEMAND PHRASE */}
                    <span
                      onClick={() => handleElementClick('inc-2', 'chat_giftcards', true)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('chat_giftcards')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      purchase 5 × $100 Apple / Google Play gift cards
                    </span>{' '}
                    for the client appreciation dinner.{' '}
                    {/* SCRATCH OFF CODES PHRASE */}
                    <span
                      onClick={() => handleElementClick('inc-2', 'chat_codes', true)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('chat_codes')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      Scratch off the backs and send clear photos of the claim codes here as soon as you have them
                    </span>
                    . I will sign off on your expense reimbursement this afternoon.
                  </p>
                </div>
              </div>
            )}

            {/* ARTIFACT 3: SMARTPHONE MFA */}
            {currentIncident.id === 'inc-3' && (
              <div className="p-5 sm:p-6 space-y-4 select-none">
                <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
                  {/* Authenticator App Title */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div 
                      onClick={() => handleElementClick('inc-3', 'mfa_service', true)}
                      className={`flex items-center gap-2 cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                        currentDiscovered.includes('mfa_service')
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                          : 'text-slate-300 font-bold'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Corporate Single Sign-On (SSO) Authenticator</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Live Push</span>
                  </div>

                  {/* SPAM / FATIGUE FREQUENCY BADGE */}
                  <div 
                    onClick={() => handleElementClick('inc-3', 'mfa_fatigue', true)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-colors text-[11px] font-mono flex items-center gap-2 ${
                      currentDiscovered.includes('mfa_fatigue')
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <BellRing className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Alert: 7 repeated approval requests received in the last 2 minutes</span>
                  </div>

                  {/* METADATA BOX: LOCATION & DEVICE */}
                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                    {/* Location Row */}
                    <div 
                      onClick={() => handleElementClick('inc-3', 'mfa_location', true)}
                      className={`flex items-center gap-2 cursor-pointer rounded p-1 transition-colors ${
                        currentDiscovered.includes('mfa_location')
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Location: São Paulo, Brazil • IP: 177.136.241.9</span>
                    </div>

                    {/* Device Row */}
                    <div 
                      onClick={() => handleElementClick('inc-3', 'mfa_device', false, 'The user agent indicates a remote Windows desktop session on Chrome.')}
                      className="flex items-center gap-2 cursor-pointer p-1 text-slate-500"
                    >
                      <Laptop className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Device: Chrome 124 / Windows 11</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARTIFACT 4: DOWNLOADS FOLDER */}
            {currentIncident.id === 'inc-4' && (
              <div className="p-5 sm:p-6 space-y-4 font-sans text-xs select-none">
                {/* File Explorer Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <div 
                    onClick={() => handleElementClick('inc-4', 'file_path', false, 'Folder location: C:\\Users\\Alex\\Downloads. Standard local storage.')}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>C:\Users\Alex\Downloads</span>
                  </div>
                  <span>Modified: Today 4:32 PM</span>
                </div>

                {/* File Explorer Item Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        {/* DOUBLE EXTENSION FILENAME */}
                        <div 
                          onClick={() => handleElementClick('inc-4', 'file_double_ext', true)}
                          className={`font-mono text-xs sm:text-sm font-bold cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                            currentDiscovered.includes('file_double_ext')
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                              : 'text-white'
                          }`}
                        >
                          Q3_Company_Bonus_and_Salary_Schedule.pdf.exe
                        </div>

                        {/* FILE TYPE COLUMN */}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            onClick={() => handleElementClick('inc-4', 'file_type', true)}
                            className={`font-mono text-[11px] cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                              currentDiscovered.includes('file_type')
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            Type: Application (.exe)
                          </span>
                          <span 
                            onClick={() => handleElementClick('inc-4', 'file_size', false, 'Size: 2.8 MB. Attackers often inflate binary sizes so files resemble genuine document sizes.')}
                            className="font-mono text-[11px] text-slate-500 cursor-pointer"
                          >
                            • 2.8 MB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INGRESS ORIGIN METADATA */}
                  <div 
                    onClick={() => handleElementClick('inc-4', 'file_origin', true)}
                    className={`p-2.5 rounded-lg font-mono text-[11px] cursor-pointer transition-colors ${
                      currentDiscovered.includes('file_origin')
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Source: Downloaded via script from calendar invite hyperlink
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DEFENSE PROTOCOL SELECTION (Symmetrical, Neutral, Zero Giveaway) */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Decide your defense response for this encounter:</span>
              {selectedProtocols[currentIncident.id] && (
                <span className="text-cyan-400">Response Selected</span>
              )}
            </div>

            <div className="space-y-2">
              {currentIncident.protocols.map((protocol) => {
                const isSelected = selectedProtocols[currentIncident.id] === protocol.id;

                return (
                  <button
                    key={protocol.id}
                    type="button"
                    disabled={submitted}
                    onClick={() => handleProtocolSelect(currentIncident.id, protocol.id)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${
                      submitted
                        ? isSelected
                          ? protocol.isSafe
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                          : 'bg-slate-950/40 border-slate-900 text-slate-600'
                        : isSelected
                        ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-sans leading-relaxed">{protocol.text}</span>
                    </div>

                    {submitted && isSelected && (
                      <span className={`text-[11px] font-mono font-bold shrink-0 ${protocol.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {protocol.isSafe ? 'Safe Defense ✓' : 'Compromised ✗'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Forensic feedback in submitted mode */}
            {submitted && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans space-y-1">
                <div className="font-bold text-cyan-300 font-mono text-[11px] uppercase">Forensic Debrief:</div>
                <p>
                  {currentIncident.protocols.find(p => p.id === selectedProtocols[currentIncident.id])?.feedback ||
                   currentIncident.protocols.find(p => p.isSafe)?.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Navigation & Submit Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
            <button
              type="button"
              disabled={activeIncidentIndex === 0}
              onClick={() => {
                sounds.playClick();
                setActiveIncidentIndex(prev => prev - 1);
              }}
              className={`px-4 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeIncidentIndex > 0
                  ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'border-slate-900 text-slate-700 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Encounter</span>
            </button>

            {activeIncidentIndex < 3 ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveIncidentIndex(prev => prev + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Next Encounter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : !submitted ? (
              <button
                type="button"
                disabled={!allIncidentsTriaged}
                onClick={handleFinalSubmit}
                className={`px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2 ${
                  allIncidentsTriaged
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Workday Security Evaluation ({Object.keys(selectedProtocols).length}/4)</span>
              </button>
            ) : (
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Workday Evaluation Recorded</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
