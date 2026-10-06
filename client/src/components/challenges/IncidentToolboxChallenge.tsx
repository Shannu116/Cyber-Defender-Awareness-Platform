import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Question, 
  IncidentToolboxSubmission, 
  StoryCard, 
  StopLeakAction, 
  ReportBlankOption, 
  SafeDeviceOption, 
  IncidentChecklistItem 
} from '../../types';
import { 
  Laptop, 
  Smartphone, 
  WifiOff, 
  Wifi, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Send, 
  Key, 
  Lock, 
  Users, 
  Check, 
  X, 
  Star, 
  Sparkles, 
  HelpCircle, 
  ArrowRight,
  Trash2,
  Power,
  Clock,
  ExternalLink,
  MessageSquare,
  Shield,
  Volume2
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useEcho } from '../../context/EchoContext';

interface IncidentToolboxChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: IncidentToolboxSubmission) => void;
}

type SceneId = 'wallet' | 'leak' | 'report' | 'doors' | 'finish';

// Fallback scene data if question.details is missing or partial
const DEFAULT_WALLET_CARDS: StoryCard[] = [
  { id: 'cancel_cards', text: 'Cancel the cards', icon: '💳' },
  { id: 'tell_someone', text: 'Tell someone', icon: '🗣️' },
  { id: 'call_bank', text: 'Call the bank', icon: '📞' }
];

const DEFAULT_LEAK_ACTIONS: StopLeakAction[] = [
  {
    id: 'wifi_off',
    label: 'Turn off Wi-Fi',
    icon: '🔌',
    effect: 'stops_leak',
    isBest: true,
    points: 25,
    comparison: 'Turning off Wi-Fi is like turning off the water tap before the bathroom floods! The bad link is completely cut off.'
  },
  {
    id: 'close_page',
    label: 'Close the page',
    icon: '❌',
    effect: 'slows_leak',
    isBest: false,
    points: 15,
    comparison: 'Closing the page is like catching some water with a bucket—it helps a little, but the leak is still trickling in the background! Try turning off Wi-Fi.'
  },
  {
    id: 'power_off',
    label: 'Turn the laptop off',
    icon: '💻',
    effect: 'stops_with_penalty',
    isBest: false,
    penalty: 10,
    points: 15,
    comparison: 'Turning off the laptop stops the leak, but our Security Team may need to see what happened on the screen to help you! Next time, just turn off Wi-Fi.'
  },
  {
    id: 'delete_history',
    label: 'Delete my history',
    icon: '🗑️',
    effect: 'no_effect',
    isBest: false,
    penalty: 10,
    points: 0,
    comparison: 'Deleting history is like wiping the bathroom mirror while the tap is still running—it only hides the clues, but doesn\'t stop the leak!'
  },
  {
    id: 'do_nothing',
    label: 'Do nothing',
    icon: '⏳',
    effect: 'fills_meter',
    isBest: false,
    penalty: 15,
    points: 0,
    comparison: 'Doing nothing lets the water rise! Pick an action to protect your laptop.'
  }
];

const DEFAULT_REPORT_BLANKS = {
  time: [
    { id: 'time_now', text: '2:30 PM (just now)', isCorrect: true },
    { id: 'time_yesterday', text: 'Yesterday morning', isCorrect: false, hint: 'Pick the time this actually happened so the team can look at the right logs!' },
    { id: 'time_last_summer', text: 'Last summer', isCorrect: false, hint: 'Last summer? ☀️ Let\'s pick when it just happened!' },
    { id: 'time_midnight', text: 'Midnight while asleep', isCorrect: false, hint: 'Let\'s tell them when it happened today during work!' }
  ],
  sender: [
    { id: 'sender_fake_hr', text: 'a strange address claiming to be HR', isCorrect: true },
    { id: 'sender_santa', text: 'Santa Claus at the North Pole', isCorrect: false, hint: 'Haha, Santa? 🎅 Could you pick who the email actually claimed to be from so we can check it?' },
    { id: 'sender_pet', text: 'my pet cat', isCorrect: false, hint: 'As cute as cats are 🐱, let\'s pick the sender from the email!' },
    { id: 'sender_friend', text: 'my best friend from high school', isCorrect: false, hint: 'The email was about payroll from an unknown address, not a friend!' }
  ],
  subject: [
    { id: 'subj_payroll', text: 'an urgent payroll update', isCorrect: true },
    { id: 'subj_treasure', text: 'a secret pirate treasure map', isCorrect: false, hint: 'Ahoy! 🏴‍☠️ But the email was about payroll—let\'s pick that!' },
    { id: 'subj_pizza', text: 'free pizza for life', isCorrect: false, hint: 'We wish! 🍕 But the email subject was about payroll.' }
  ],
  passwordTyped: [
    { id: 'pwd_did_not', text: 'did not', isCorrect: true },
    { id: 'pwd_did', text: 'did', isCorrect: true },
    { id: 'pwd_secret', text: 'prefer not to say', isCorrect: false, hint: 'Could you tell us if you typed your password? It helps us a lot!' }
  ],
  laptopState: [
    { id: 'state_wifi_off', text: 'disconnected from Wi-Fi', isCorrect: true },
    { id: 'state_bathtub', text: 'swimming in the bathtub', isCorrect: false, hint: 'Don\'t put your laptop in water! 🛁 Tell them its connection state.' },
    { id: 'state_fire', text: 'on fire', isCorrect: false, hint: 'If it\'s on fire call the fire department! 🔥 Otherwise pick its Wi-Fi state.' },
    { id: 'state_running', text: 'still connected to the internet', isCorrect: false, hint: 'Remember to turn off Wi-Fi first, then let the team know!' }
  ]
};

const DEFAULT_DEVICES: SafeDeviceOption[] = [
  {
    id: 'phone',
    label: 'Your Phone',
    sublabel: 'Clean device, not touched by the bad link',
    isSafe: true,
    echoComparison: 'Spot on! 🌟 Your phone is clean and safe to change your password on.'
  },
  {
    id: 'laptop',
    label: 'Your Laptop',
    sublabel: 'The computer where the bad link was opened',
    isSafe: false,
    echoComparison: 'You don\'t change the locks from inside a house with a burglar in it! The laptop might still have the bad page or someone watching keystrokes. Use your clean phone instead!'
  }
];

const DEFAULT_CHECKLIST: IncidentChecklistItem[] = [
  { id: 'step_change_pwd', text: 'Change my password' },
  { id: 'step_logout_all', text: 'Log out of everything' },
  { id: 'step_warn_team', text: 'Warn teammates who got the same email' }
];

export const IncidentToolboxChallenge: React.FC<IncidentToolboxChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer
}) => {
  const { postEchoMessage, openEcho, unreadCount, registerChecklist, clearChecklist } = useEcho();

  // Load data from details or fallbacks
  const storyDetails = question?.details?.storyDetails;
  const walletCardsList = useMemo(() => storyDetails?.walletCards || DEFAULT_WALLET_CARDS, [storyDetails]);
  const leakActionsList = useMemo(() => storyDetails?.leakActions || DEFAULT_LEAK_ACTIONS, [storyDetails]);
  const reportBlanksConfig = useMemo(() => storyDetails?.reportBlanks || DEFAULT_REPORT_BLANKS, [storyDetails]);
  const devicesList = useMemo(() => storyDetails?.devices || DEFAULT_DEVICES, [storyDetails]);
  const checklistItems = useMemo(() => storyDetails?.checklist || DEFAULT_CHECKLIST, [storyDetails]);

  // Scene state
  const [activeScene, setActiveScene] = useState<SceneId>(submitted ? 'finish' : 'wallet');

  // Scene 1: Wallet Cards Order
  const [placedWalletCards, setPlacedWalletCards] = useState<StoryCard[]>([]);
  const [unplacedWalletCards, setUnplacedWalletCards] = useState<StoryCard[]>(walletCardsList);
  const [scene1Completed, setScene1Completed] = useState<boolean>(false);

  // Register Echo checklist and greeting on mount
  useEffect(() => {
    registerChecklist([
      {
        id: 'goal_wallet',
        label: 'Step 1: Order the wallet cards',
        hint: 'Put the 3 cards in order: Cancel the cards, Tell someone, Call the bank!',
        severity: 'medium'
      },
      {
        id: 'goal_leak',
        label: 'Step 2: Turn off Wi-Fi to stop the leak',
        hint: 'Turning off your Wi-Fi is like turning off the water tap before the bathroom floods!',
        severity: 'critical'
      },
      {
        id: 'goal_report',
        label: 'Step 3: Tell the Security Team',
        hint: 'Fill in the message to the Security Team with honest details about what happened.',
        severity: 'high'
      },
      {
        id: 'goal_doors',
        label: 'Step 4: Lock accounts from clean phone',
        hint: 'Change your password from your clean phone, never on the laptop with the bad page!',
        severity: 'critical'
      }
    ]);

    postEchoMessage(
      "Hey friend! I'm Echo 👻 right here in your side bar. As you play Challenge 9, I'll log all my safety coaching tips and comparisons right here so you never miss them!",
      "Echo's Safety Guide"
    );

    return () => clearChecklist();
  }, [registerChecklist, clearChecklist, postEchoMessage]);

  // Scene 2: Stop the Leak (Trouble Meter)
  const [troubleMeter, setTroubleMeter] = useState<number>(15);
  const [isMeterRunning, setIsMeterRunning] = useState<boolean>(true);
  const [leakRate, setLeakRate] = useState<number>(1); // 1 = normal, 0.3 = slowed, 0 = stopped
  const [chosenLeakAction, setChosenLeakAction] = useState<StopLeakAction | null>(null);
  const [leakFeedback, setLeakFeedback] = useState<string | null>(null);
  const [isEchoSpeakingLeak, setIsEchoSpeakingLeak] = useState<boolean>(false);
  const [leakPenalty, setLeakPenalty] = useState<number>(0);

  // Scene 3: Tell the Help Team (Report blanks)
  const [selectedBlanks, setSelectedBlanks] = useState<{
    time?: string;
    sender?: string;
    subject?: string;
    passwordTyped?: string;
    laptopState?: string;
  }>({});
  const [helperNudge, setHelperNudge] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [reportAttempts, setReportAttempts] = useState<number>(0);

  // Scene 4: Lock the Doors (Safe device + checklist)
  const [chosenDevice, setChosenDevice] = useState<string | null>(null);
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null);
  const [devicePassed, setDevicePassed] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [devicePenalties, setDevicePenalties] = useState<number>(0);

  // Dragging state for Scene 1
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Synchronize when question submitted prop flips
  useEffect(() => {
    if (submitted) {
      setActiveScene('finish');
    }
  }, [submitted]);

  // Trouble Meter Interval (Scene 2)
  useEffect(() => {
    if (activeScene !== 'leak' || !isMeterRunning || isEchoSpeakingLeak || leakRate <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTroubleMeter(prev => {
        const next = prev + (leakRate === 1 ? 5 : 2);
        return next >= 100 ? 100 : next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeScene, isMeterRunning, isEchoSpeakingLeak, leakRate]);

  // -------------------------------------------------------------
  // Scene 1 Handlers: Wallet Ordering
  // -------------------------------------------------------------
  const handleSelectWalletCard = (card: StoryCard) => {
    sounds.playClick();
    setUnplacedWalletCards(prev => prev.filter(c => c.id !== card.id));
    const updatedPlaced = [...placedWalletCards, card];
    setPlacedWalletCards(updatedPlaced);

    if (updatedPlaced.length === walletCardsList.length) {
      sounds.playSuccess();
      setScene1Completed(true);
      postEchoMessage(
        "Spot on! 🌟 Just like losing your wallet: Act fast, tell people, and lock things down! Clicking a bad link is the exact same thing.",
        "Echo's Rule of Thumb",
        true
      );
    }
  };

  const handleRemoveWalletCard = (card: StoryCard) => {
    sounds.playClick();
    setPlacedWalletCards(prev => prev.filter(c => c.id !== card.id));
    setUnplacedWalletCards(prev => [...prev, card]);
    setScene1Completed(false);
  };

  const handleResetWalletCards = () => {
    sounds.playClick();
    setPlacedWalletCards([]);
    setUnplacedWalletCards(walletCardsList);
    setScene1Completed(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (cardId: string) => {
    setDraggedCardId(cardId);
  };

  const handleDropOnSlot = (slotIndex: number) => {
    if (!draggedCardId) return;
    const card = walletCardsList.find(c => c.id === draggedCardId);
    if (!card) return;

    sounds.playClick();
    // Reorder or place
    const currentlyPlaced = placedWalletCards.filter(c => c.id !== card.id);
    const newPlaced = [...currentlyPlaced];
    newPlaced.splice(slotIndex, 0, card);

    setPlacedWalletCards(newPlaced);
    setUnplacedWalletCards(walletCardsList.filter(c => !newPlaced.some(p => p.id === c.id)));
    setDraggedCardId(null);

    if (newPlaced.length === walletCardsList.length) {
      sounds.playSuccess();
      setScene1Completed(true);
      postEchoMessage(
        "Spot on! 🌟 Just like losing your wallet: Act fast, tell people, and lock things down! Clicking a bad link is the exact same thing.",
        "Echo's Rule of Thumb",
        true
      );
    }
  };

  // -------------------------------------------------------------
  // Scene 2 Handlers: Stop the Leak
  // -------------------------------------------------------------
  const handleChooseLeakAction = (action: StopLeakAction) => {
    sounds.playClick();
    setChosenLeakAction(action);
    setLeakFeedback(action.comparison);
    setIsEchoSpeakingLeak(true);

    // Send Echo's real-life comparison directly to the side Echo bar!
    postEchoMessage(
      action.comparison,
      `${action.label} (${action.isBest ? 'Best Choice! 🎯' : 'Action Test'})`,
      true
    );

    if (action.effect === 'stops_leak') {
      sounds.playSuccess();
      setIsMeterRunning(false);
      setLeakRate(0);
    } else if (action.effect === 'slows_leak') {
      sounds.playClick();
      setLeakRate(0.3);
    } else if (action.effect === 'stops_with_penalty') {
      sounds.playWarning();
      setIsMeterRunning(false);
      setLeakRate(0);
      setLeakPenalty(prev => prev + (action.penalty || 10));
    } else if (action.effect === 'no_effect') {
      sounds.playWarning();
      setLeakPenalty(prev => prev + (action.penalty || 10));
    } else if (action.effect === 'fills_meter') {
      sounds.playWarning();
      setTroubleMeter(prev => Math.min(100, prev + 15));
      setLeakPenalty(prev => prev + (action.penalty || 15));
    }

    // Auto clear Echo speaking pause after 4 seconds
    setTimeout(() => {
      setIsEchoSpeakingLeak(false);
    }, 4000);
  };

  // -------------------------------------------------------------
  // Scene 3 Handlers: Tell the Help Team
  // -------------------------------------------------------------
  const handleBlankChange = (blankKey: keyof typeof selectedBlanks, optionId: string) => {
    sounds.playClick();
    setSelectedBlanks(prev => ({ ...prev, [blankKey]: optionId }));
    setHelperNudge(null);
  };

  const handleSendReport = () => {
    sounds.playClick();
    setReportAttempts(prev => prev + 1);

    const triggerNudge = (nudgeMsg: string) => {
      sounds.playWarning();
      setHelperNudge(nudgeMsg);
      postEchoMessage(nudgeMsg, "Security Team Helper (Alex) 🛡️", true);
    };

    // Check completeness
    if (!selectedBlanks.time) {
      triggerNudge('Could you tell us roughly what time this happened? That helps our Security Team look at the right logs!');
      return;
    }
    if (!selectedBlanks.sender) {
      triggerNudge('Could you pick who the email claimed to be from? That helps us investigate the sender!');
      return;
    }
    if (!selectedBlanks.subject) {
      triggerNudge('Could you pick what the email was about?');
      return;
    }
    if (!selectedBlanks.passwordTyped) {
      triggerNudge('Could you tell us if you typed your password? It helps us a lot!');
      return;
    }
    if (!selectedBlanks.laptopState) {
      triggerNudge('Could you let us know if your Wi-Fi is turned off or still connected?');
      return;
    }

    // Check for silly options
    const timeOpt = reportBlanksConfig.time.find(o => o.id === selectedBlanks.time);
    if (timeOpt && !timeOpt.isCorrect) {
      triggerNudge(timeOpt.hint || 'Please pick the time this actually happened today!');
      return;
    }

    const senderOpt = reportBlanksConfig.sender.find(o => o.id === selectedBlanks.sender);
    if (senderOpt && !senderOpt.isCorrect) {
      triggerNudge(senderOpt.hint || 'Could you pick who the email claimed to be from?');
      return;
    }

    const subjectOpt = reportBlanksConfig.subject.find(o => o.id === selectedBlanks.subject);
    if (subjectOpt && !subjectOpt.isCorrect) {
      triggerNudge(subjectOpt.hint || 'The email was about an urgent payroll update—let\'s select that!');
      return;
    }

    const stateOpt = reportBlanksConfig.laptopState.find(o => o.id === selectedBlanks.laptopState);
    if (stateOpt && !stateOpt.isCorrect) {
      triggerNudge(stateOpt.hint || 'Make sure your laptop is disconnected from Wi-Fi!');
      return;
    }

    // Success!
    sounds.playSuccess();
    setHelperNudge(null);
    setReportSuccess(true);
    postEchoMessage(
      "Thank you for telling us! You did the right thing. Telling the Security Team quickly protects everyone.",
      "Report Received! 🎉",
      true
    );
  };

  // -------------------------------------------------------------
  // Scene 4 Handlers: Lock the Doors
  // -------------------------------------------------------------
  const handleSelectDevice = (device: SafeDeviceOption) => {
    sounds.playClick();
    setChosenDevice(device.id);

    if (device.isSafe) {
      sounds.playSuccess();
      setDevicePassed(true);
      setDeviceWarning(null);
      postEchoMessage(
        device.echoComparison,
        "Safe Device Selected ✅",
        true
      );
    } else {
      sounds.playWarning();
      setDevicePassed(false);
      setDeviceWarning(device.echoComparison);
      setDevicePenalties(prev => prev + 5);
      postEchoMessage(
        device.echoComparison,
        "Door Lock Warning ⚠️",
        true
      );
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    sounds.playClick();
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------------
  // Finish & Scoring Calculations
  // -------------------------------------------------------------
  const calculateFinalScores = () => {
    // Scene 2: 25 pts max
    let scene2Pts = 0;
    if (chosenLeakAction?.id === 'wifi_off') {
      scene2Pts = 25;
    } else if (chosenLeakAction?.id === 'close_page') {
      scene2Pts = 15;
    } else if (chosenLeakAction?.id === 'power_off') {
      scene2Pts = 15;
    }
    scene2Pts = Math.max(0, scene2Pts - leakPenalty);

    // Scene 3: 45 pts max (Reporting is the most important!)
    let scene3Pts = reportSuccess ? 45 : 10;
    if (reportAttempts > 2) {
      scene3Pts = Math.max(25, scene3Pts - 5);
    }

    // Scene 4: 30 pts max (15 for safe device, 15 for checklist)
    let scene4Pts = 0;
    if (devicePassed) {
      scene4Pts += Math.max(5, 15 - devicePenalties);
    }
    const checklistProgress = checkedItems.length / Math.max(1, checklistItems.length);
    scene4Pts += Math.round(checklistProgress * 15);

    const baseScore = Math.min(100, scene2Pts + scene3Pts + scene4Pts);

    // Bonus (+20): Clean run with no penalties
    const isCleanRun = leakPenalty === 0 && devicePenalties === 0 && reportAttempts <= 2 && chosenLeakAction?.id === 'wifi_off';
    const bonusScore = isCleanRun ? 20 : 0;

    // Pass requires: network disconnected or page closed, report sent, and no concealment
    const isPassing = (chosenLeakAction?.id === 'wifi_off' || chosenLeakAction?.id === 'close_page' || chosenLeakAction?.id === 'power_off') && reportSuccess;

    return {
      scene2Pts,
      scene3Pts,
      scene4Pts,
      baseScore,
      bonusScore,
      isPassing
    };
  };

  const scores = calculateFinalScores();

  const handleCompleteChallenge = () => {
    sounds.playSuccess();
    setActiveScene('finish');

    // Send Echo's closing golden rule to the side bar!
    postEchoMessage(
      "Mission accomplished! Everyone clicks sometimes. What matters is what you do next: 🔌 Unplug Wi-Fi, 📣 Tell someone, and 🔑 Change your password safely from a clean phone.",
      "Echo's Golden Rule 🌟",
      true
    );

    const submission: IncidentToolboxSubmission = {
      scene1Completed,
      leakActionChosen: chosenLeakAction?.id || 'none',
      meterStopped: !isMeterRunning,
      troubleMeterPercent: troubleMeter,
      reportSent: reportSuccess,
      reportChoices: {
        time: selectedBlanks.time || '',
        sender: selectedBlanks.sender || '',
        subject: selectedBlanks.subject || '',
        passwordTyped: selectedBlanks.passwordTyped || '',
        laptopState: selectedBlanks.laptopState || ''
      },
      safeDeviceChosen: chosenDevice || '',
      checklistCompleted: checkedItems,
      isCorrect: scores.isPassing,
      scoreAwarded: scores.baseScore,
      bonusAwarded: scores.bonusScore,
      containmentAction: chosenLeakAction?.label || 'Turn off Wi-Fi'
    };

    onSubmitAnswer(submission);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn font-sans">
      {/* Friendly Progress Indicator Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦊</span>
            <span className="font-bold text-sm text-cyan-300">Echo's Safety Guide</span>
            <span className="text-xs text-slate-400 hidden sm:inline">• Grade-6 Friendly Walkthrough</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick button to open Echo's side bar on the right */}
            <button
              type="button"
              onClick={openEcho}
              className="px-3 py-1 rounded-xl bg-slate-850 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Open Echo side bar on the right"
            >
              <span>👻 Echo Side Bar</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {(['wallet', 'leak', 'report', 'doors', 'finish'] as SceneId[]).map((scene, idx) => {
              const labels = ['1. Wallet', '2. Leak', '3. Report', '4. Lock', 'Summary'];
              const isActive = activeScene === scene;
              const isPast = ['wallet', 'leak', 'report', 'doors', 'finish'].indexOf(activeScene) > idx;

              return (
                <div
                  key={scene}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    isActive 
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' 
                      : isPast
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {isPast ? <Check className="w-3 h-3" /> : null}
                  <span>{labels[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCENE 1: THE LOST WALLET */}
      {/* ========================================================================= */}
      {activeScene === 'wallet' && (
        <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Echo Dialogue Card */}
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl flex items-center justify-center shrink-0 border border-cyan-400/40">
              🦊
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Scene 1: The Lost Wallet
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                Imagine you were walking outside and dropped your wallet on the sidewalk.
                <br />
                <span className="font-semibold text-cyan-200">What would you do first? Put these 3 cards in order!</span>
              </p>
            </div>
          </div>

          {/* Cards to Place */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Step 1: Tap or drag cards into order (1, 2, 3)
            </div>

            {/* Dropped / Placed Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((slotIdx) => {
                const card = placedWalletCards[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnSlot(slotIdx)}
                    className={`min-h-[96px] rounded-2xl p-4 border-2 transition-all flex flex-col justify-center items-center text-center ${
                      card
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg text-white'
                        : 'bg-slate-950/60 border-dashed border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                      Step {slotIdx + 1}
                    </div>
                    {card ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{card.icon || '📌'}</span>
                        <span className="font-bold text-sm sm:text-base text-slate-100">{card.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWalletCard(card)}
                          className="ml-1 p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"
                          title="Remove card"
                          aria-label={`Remove ${card.text}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Empty slot</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Available Cards */}
            {unplacedWalletCards.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-400">Tap a card to place it in the next slot:</div>
                <div className="flex flex-wrap gap-2.5">
                  {unplacedWalletCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      draggable
                      onDragStart={() => handleDragStart(card.id)}
                      onClick={() => handleSelectWalletCard(card)}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-400 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                    >
                      <span className="text-xl">{card.icon || '📌'}</span>
                      <span>{card.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset button */}
          {placedWalletCards.length > 0 && (
            <button
              type="button"
              onClick={handleResetWalletCards}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset card order</span>
            </button>
          )}

          {/* Echo Lesson Banner when completed */}
          {scene1Completed && (
            <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-300">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Echo's Rule of Thumb:</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                "A bad link is the exact same thing! <strong className="text-emerald-300">Act fast, tell people, and lock things down.</strong>"
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveScene('leak');
                    postEchoMessage(
                      "You clicked a strange link in an email and an unfamiliar loading page appeared. Think of it like a leaky tap filling up a bathtub! Pick an action to stop it before the Trouble Meter overflows.",
                      "Scene 2: Stop the Leak",
                      true
                    );
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Start Scene 2: Stop the Leak</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENE 2: STOP THE LEAK */}
      {/* ========================================================================= */}
      {activeScene === 'leak' && (
        <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Echo Instruction */}
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl flex items-center justify-center shrink-0 border border-cyan-400/40">
              🦊
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Scene 2: Stop the Leak
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                You clicked a strange link in an email and an unfamiliar loading page appeared.
                <br />
                The <strong className="text-amber-300">Trouble Meter</strong> fills slowly like water in a leaky bathtub.
                Pick an action to stop it!
              </p>
            </div>
          </div>

          {/* Trouble Meter Display */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="text-xl">🛁</span>
                <span>Trouble Meter (Leaky Bathtub Level):</span>
              </span>
              <span className={`font-mono font-bold ${
                troubleMeter > 70 ? 'text-rose-400' : troubleMeter > 40 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {troubleMeter}% Filled
                {!isMeterRunning && ' (Stopped! 🛑)'}
                {isEchoSpeakingLeak && ' (Paused while Echo talks)'}
              </span>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  troubleMeter > 70 
                    ? 'bg-rose-500' 
                    : troubleMeter > 40 
                      ? 'bg-amber-500' 
                      : 'bg-cyan-500'
                }`}
                style={{ width: `${troubleMeter}%` }}
                role="progressbar"
                aria-valuenow={troubleMeter}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Trouble Meter"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {isMeterRunning 
                ? '💧 Water is slowly rising every 3 seconds. Pick a big button below to stop the flow.'
                : '✅ Flow is stopped! You contained the strange link.'}
            </p>
          </div>

          {/* Simple Laptop Illustration */}
          <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden shadow-xl max-w-lg mx-auto">
            {/* Top window bar */}
            <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="px-3 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 max-w-xs truncate">
                http://unfamiliar-portal-check.net/login ⚠️
              </div>
              <div className="text-xs text-slate-400">
                {chosenLeakAction?.id === 'wifi_off' ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>

            {/* Screen content */}
            <div className="p-8 text-center space-y-3 bg-slate-900/60">
              {chosenLeakAction?.id === 'power_off' ? (
                <div className="py-6 space-y-2">
                  <Power className="w-10 h-10 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-400">Laptop Screen is Dark (Powered Off)</div>
                </div>
              ) : chosenLeakAction?.id === 'wifi_off' ? (
                <div className="py-6 space-y-2">
                  <WifiOff className="w-10 h-10 text-cyan-400 mx-auto" />
                  <div className="text-sm font-bold text-cyan-300">Wi-Fi Disconnected</div>
                  <p className="text-xs text-slate-400">No internet connection. Strange link cannot send or receive data.</p>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
                  <div className="text-sm font-bold text-amber-300">Loading strange page...</div>
                  <p className="text-xs text-slate-400">Page is attempting to load content in the background.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              What do you do right now? (Tap a button):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leakActionsList.map((action) => {
                const isSelected = chosenLeakAction?.id === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleChooseLeakAction(action)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all shadow-md flex items-center gap-3.5 ${
                      isSelected
                        ? action.isBest
                          ? 'bg-cyan-950/80 border-cyan-400 text-white ring-2 ring-cyan-400/40'
                          : 'bg-amber-950/60 border-amber-400 text-white'
                        : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{action.icon}</span>
                    <div>
                      <div className="font-bold text-sm sm:text-base">{action.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {action.isBest ? 'Recommended best choice' : 'Tap to test effect'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Friendly Feedback Message */}
          {leakFeedback && (
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 animate-fadeIn ${
              chosenLeakAction?.isBest
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>🦊 Echo says:</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-100">
                "{leakFeedback}"
              </p>
            </div>
          )}

          {/* Advance button once leak is halted or tried */}
          {(chosenLeakAction?.id === 'wifi_off' || chosenLeakAction?.id === 'power_off' || chosenLeakAction?.id === 'close_page') && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveScene('report');
                  postEchoMessage(
                    "Now that the leak is stopped, it's time to tell our friendly Security Team! They are here to help, never to get you in trouble. Fill in the message below so they know how to protect you.",
                    "Scene 3: Tell the Security Team",
                    true
                  );
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Great job! Let's Tell the Help Team ➡️</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENE 3: TELL THE HELP TEAM */}
      {/* ========================================================================= */}
      {activeScene === 'report' && (
        <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Echo Intro */}
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl flex items-center justify-center shrink-0 border border-cyan-400/40">
              🦊
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Scene 3: Tell the Security Team
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                The Security Team is friendly and here to help—never to get you in trouble!
                <br />
                <span className="text-cyan-200 font-semibold">
                  Fill in the message below so they know how to protect you:
                </span>
              </p>
            </div>
          </div>

          {/* Interactive Message Builder */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border-2 border-slate-700 space-y-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>To: Security Team Helpdesk 🛡️</span>
            </div>

            <div className="text-base sm:text-lg text-slate-200 leading-loose space-y-4 font-sans">
              <p>
                "Hi Security Team!
                <br className="mb-2" />
                At{' '}
                <select
                  value={selectedBlanks.time || ''}
                  onChange={(e) => handleBlankChange('time', e.target.value)}
                  className="mx-1 px-3 py-1.5 rounded-xl bg-slate-800 border-2 border-cyan-500/50 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  aria-label="Select incident time"
                >
                  <option value="">[ ⏰ Pick a time ]</option>
                  {reportBlanksConfig.time.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                {' '}I clicked a link in an email from{' '}
                <select
                  value={selectedBlanks.sender || ''}
                  onChange={(e) => handleBlankChange('sender', e.target.value)}
                  className="mx-1 px-3 py-1.5 rounded-xl bg-slate-800 border-2 border-cyan-500/50 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  aria-label="Select email sender"
                >
                  <option value="">[ 👤 Pick a sender ]</option>
                  {reportBlanksConfig.sender.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                {' '}about{' '}
                <select
                  value={selectedBlanks.subject || ''}
                  onChange={(e) => handleBlankChange('subject', e.target.value)}
                  className="mx-1 px-3 py-1.5 rounded-xl bg-slate-800 border-2 border-cyan-500/50 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  aria-label="Select email subject"
                >
                  <option value="">[ 📄 Pick a subject ]</option>
                  {reportBlanksConfig.subject.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                .
              </p>

              <p>
                I{' '}
                <select
                  value={selectedBlanks.passwordTyped || ''}
                  onChange={(e) => handleBlankChange('passwordTyped', e.target.value)}
                  className="mx-1 px-3 py-1.5 rounded-xl bg-slate-800 border-2 border-cyan-500/50 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  aria-label="Select if password was typed"
                >
                  <option value="">[ 🔑 did / did not ]</option>
                  {reportBlanksConfig.passwordTyped.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                {' '}type my password.
              </p>

              <p>
                My laptop is currently{' '}
                <select
                  value={selectedBlanks.laptopState || ''}
                  onChange={(e) => handleBlankChange('laptopState', e.target.value)}
                  className="mx-1 px-3 py-1.5 rounded-xl bg-slate-800 border-2 border-cyan-500/50 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  aria-label="Select laptop state"
                >
                  <option value="">[ 💻 Pick laptop state ]</option>
                  {reportBlanksConfig.laptopState.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                . Can you help?"
              </p>
            </div>

            {/* Send Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendReport}
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send to Security Team</span>
              </button>
            </div>
          </div>

          {/* Gentle Nudge from Security Helper */}
          {helperNudge && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 flex items-start gap-3 animate-fadeIn">
              <span className="text-2xl shrink-0">🛡️</span>
              <div className="space-y-1">
                <div className="font-bold text-sm text-amber-300">Security Team Helper (Alex):</div>
                <p className="text-sm text-slate-200">{helperNudge}</p>
              </div>
            </div>
          )}

          {/* Report Success Banner */}
          {reportSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <div className="font-bold text-base text-emerald-300">
                    Security Team Helper: "Thank you for telling us. You did the right thing!"
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Telling the team quickly is worth more points than anything else!
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveScene('doors');
                    postEchoMessage(
                      "Now we need to change your password to lock out any strangers. Which device is safe to change your password on: Your Phone or Your Laptop?",
                      "Scene 4: Lock the Doors",
                      true
                    );
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Next: Lock the Doors 🔐 ➡️</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENE 4: LOCK THE DOORS */}
      {/* ========================================================================= */}
      {activeScene === 'doors' && (
        <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Echo Intro */}
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl flex items-center justify-center shrink-0 border border-cyan-400/40">
              🦊
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Scene 4: Lock the Doors
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                Now we need to change your password to lock out any strangers.
                <br />
                <strong className="text-cyan-200">Which device is safe to change your password on?</strong>
              </p>
            </div>
          </div>

          {/* Two Device Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devicesList.map((dev) => {
              const isSelected = chosenDevice === dev.id;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => handleSelectDevice(dev)}
                  className={`p-6 rounded-3xl border-2 text-center transition-all shadow-xl flex flex-col items-center gap-3 ${
                    isSelected
                      ? dev.isSafe
                        ? 'bg-emerald-950/70 border-emerald-400 text-white ring-2 ring-emerald-400/50'
                        : 'bg-rose-950/70 border-rose-400 text-white'
                      : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl">
                    {dev.id === 'phone' ? '📱' : '💻'}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white">{dev.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{dev.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Device Warning if picked laptop */}
          {deviceWarning && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="font-bold text-rose-300">🦊 Echo's Door Lock Rule:</div>
                <p className="text-slate-200 leading-relaxed">"{deviceWarning}"</p>
                <div className="text-xs text-cyan-300 font-semibold pt-1">
                  👉 Tap "Your Phone" above to continue safely!
                </div>
              </div>
            </div>
          )}

          {/* Checklist when phone selected */}
          {devicePassed && (
            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-emerald-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Phone is safe! Now tick these 3 easy steps to finish:</span>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item) => {
                  const isChecked = checkedItems.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-5 h-5 rounded text-cyan-500 focus:ring-0"
                      />
                      <span className="font-medium text-sm sm:text-base">{item.text}</span>
                    </label>
                  );
                })}
              </div>

              {checkedItems.length === checklistItems.length && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleCompleteChallenge}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Finish & See My Badges ⭐ ➡️</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINISH / DEBRIEF SCREEN */}
      {/* ========================================================================= */}
      {activeScene === 'finish' && (
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mission Accomplished: You Handled It!
            </h3>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              You turned an accidental click into a safe, calm win for the whole team.
            </p>
          </div>

          {/* 3 Stars / Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-3xl">🔌</div>
              <div className="font-bold text-white text-base">Unplug</div>
              <p className="text-xs text-slate-400">Turned off Wi-Fi to stop the leak fast.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-3xl">📣</div>
              <div className="font-bold text-white text-base">Tell Someone</div>
              <p className="text-xs text-slate-400">Sent an honest note to the Security Team right away.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-3xl">🔑</div>
              <div className="font-bold text-white text-base">Lock Safely</div>
              <p className="text-xs text-slate-400">Used your clean phone to change your password.</p>
            </div>
          </div>

          {/* Echo Closing Line */}
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-2xl flex items-center justify-center shrink-0 border border-cyan-400/40">
              🦊
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Echo's Golden Rule
              </div>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                "Everyone clicks sometimes. What matters is what you do next."
              </p>
            </div>
          </div>

          {/* Plain Language Takeaways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Safe Takeaway (Grade-6):</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {question.safeTakeaway || 'Accidents happen to everyone! When you click a bad link, don\'t panic or hide it. Turn off your Wi-Fi, tell the Security Team right away, and change your password from a clean phone.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Common Mistake to Avoid:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {question.commonMistake || 'Staying quiet because you feel embarrassed, or trying to fix it yourself by deleting history or turning off the computer completely.'}
              </p>
            </div>
          </div>

          {/* Score Summary Pill */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-400">
              Score Breakdown: Leak ({scores.scene2Pts}/25) + Report ({scores.scene3Pts}/45) + Safe Lock ({scores.scene4Pts}/30)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm">+{scores.baseScore} Base</span>
              {scores.bonusScore > 0 && (
                <span className="text-cyan-400 font-bold text-sm">+{scores.bonusScore} Bonus (Clean Run!)</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
