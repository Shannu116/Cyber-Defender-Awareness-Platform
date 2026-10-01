import React, { useState } from 'react';
import { Question } from '../../types';
import { 
  Laptop, 
  Wifi, 
  Plane,
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Server,
  Puzzle,
  Zap,
  Check,
  X,
  EyeOff,
  Globe,
  Share2,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface LaptopSecurityChallengeProps {
  question: Question;
  submitted: boolean;
  onSubmitAnswer: (response: any) => void;
}

interface DefenseBlock {
  id: string;
  name: string;
  subtitle: string;
  isGenuine: boolean;
  icon: React.ComponentType<{ className?: string }>;
  failureReason?: string;
  successNote?: string;
}

export const LaptopSecurityChallenge: React.FC<LaptopSecurityChallengeProps> = ({
  question,
  submitted,
  onSubmitAnswer,
}) => {
  // Access point choices (cellular hotspot is unavailable at 35,000 ft or in transit!)
  const [selectedAp, setSelectedAp] = useState<string>('flight_wifi');

  // 2 Empty Slots in the security pipeline
  const [slot1, setSlot1] = useState<DefenseBlock | null>(null);
  const [slot2, setSlot2] = useState<DefenseBlock | null>(null);

  // Drag-and-drop & click-to-place tracking
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [selectedBlockForPlacement, setSelectedBlockForPlacement] = useState<DefenseBlock | null>(null);
  const [testedRoute, setTestedRoute] = useState<boolean>(false);

  // Master list of available blocks (Genuine defenses + Decoy/Fake blocks)
  const allBlocks: DefenseBlock[] = [
    {
      id: 'corp_vpn',
      name: 'Corporate VPN Tunnel',
      subtitle: 'AES-256 Encrypted Tunnel',
      isGenuine: true,
      icon: Lock,
      successNote: 'Encapsulates all outbound packets into an authenticated cryptographic tunnel directly to corporate gateways.'
    },
    {
      id: 'dns_shield',
      name: 'Encrypted DNS Shield',
      subtitle: 'DNS over HTTPS / DNSSEC',
      isGenuine: true,
      icon: ShieldCheck,
      successNote: 'Encrypts domain lookup queries, preventing the in-flight Wi-Fi gateway from snooping destination servers.'
    },
    {
      id: 'incognito',
      name: 'Incognito / Private Window',
      subtitle: 'Local Browser History Only',
      isGenuine: false,
      icon: EyeOff,
      failureReason: 'Incognito Mode only deletes local browser cookies upon closing. It transmits 100% unencrypted cleartext across the in-flight Wi-Fi for packet sniffers to capture.'
    },
    {
      id: 'free_proxy',
      name: 'Free Public Web Proxy',
      subtitle: 'Untrusted Third-Party Node',
      isGenuine: false,
      icon: Globe,
      failureReason: 'Free public web proxies inspect, log, and decrypt your data. Attackers frequently host free proxies to steal corporate credentials via Man-in-the-Middle (MITM).'
    },
    {
      id: 'ad_blocker',
      name: 'Browser Ad-Blocker Plugin',
      subtitle: 'Cosmetic Web Script Filter',
      isGenuine: false,
      icon: ShieldAlert,
      failureReason: 'Ad blockers only filter banner advertisements in HTML. They provide ZERO cryptographic encryption for network database traffic.'
    },
    {
      id: 'direct_socks',
      name: 'Unverified SOCKS5 Route',
      subtitle: 'Cleartext Port Forwarding',
      isGenuine: false,
      icon: Share2,
      failureReason: 'Basic SOCKS5 forwarding lacks TLS/IPSec encryption. Packets remain exposed to sniffing on the shared public access point.'
    }
  ];

  // Helper to determine if a block is currently slotted
  const isBlockUsed = (blockId: string) => slot1?.id === blockId || slot2?.id === blockId;

  // Validation: both slots must be filled with the two genuine blocks (corp_vpn & dns_shield)
  const isSlot1Filled = slot1 !== null;
  const isSlot2Filled = slot2 !== null;
  const bothSlotsFilled = isSlot1Filled && isSlot2Filled;

  const hasFakeBlock = (slot1 && !slot1.isGenuine) || (slot2 && !slot2.isGenuine);
  const hasBothGenuine = (slot1?.id === 'corp_vpn' && slot2?.id === 'dns_shield') ||
                         (slot1?.id === 'dns_shield' && slot2?.id === 'corp_vpn');

  const isPuzzleSolved = bothSlotsFilled && hasBothGenuine && !hasFakeBlock;

  // Place a block into target slot
  const placeBlock = (slotNumber: 1 | 2, block: DefenseBlock) => {
    if (submitted) return;
    sounds.playClick();

    // If block is already in the other slot, swap or remove from other
    if (slotNumber === 1) {
      if (slot2?.id === block.id) setSlot2(null);
      setSlot1(block);
    } else {
      if (slot1?.id === block.id) setSlot1(null);
      setSlot2(block);
    }

    setSelectedBlockForPlacement(null);
    setDraggedBlockId(null);
    setTestedRoute(false);
  };

  const removeSlot = (slotNumber: 1 | 2) => {
    if (submitted) return;
    sounds.playClick();
    if (slotNumber === 1) setSlot1(null);
    else setSlot2(null);
    setTestedRoute(false);
  };

  const resetAllSlots = () => {
    if (submitted) return;
    sounds.playClick();
    setSlot1(null);
    setSlot2(null);
    setSelectedBlockForPlacement(null);
    setTestedRoute(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    if (submitted) return;
    setDraggedBlockId(blockId);
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSlot = (e: React.DragEvent, slotNumber: 1 | 2) => {
    e.preventDefault();
    if (submitted) return;
    const blockId = e.dataTransfer.getData('text/plain') || draggedBlockId;
    if (blockId) {
      const block = allBlocks.find(b => b.id === blockId);
      if (block) placeBlock(slotNumber, block);
    }
  };

  const handleTestRoute = () => {
    if (submitted) return;
    setTestedRoute(true);
    if (isPuzzleSolved) {
      sounds.playSuccess();
    } else {
      sounds.playWarning();
    }
  };

  const handleFinalSubmit = () => {
    if (submitted || !isPuzzleSolved) return;
    sounds.playClick();

    const isCorrect = isPuzzleSolved;
    const scoreAwarded = isCorrect ? question.points : 0;
    const bonusAwarded = isCorrect ? (question.bonusPoints || 20) : 0;

    onSubmitAnswer({
      selectedAp,
      slot1: slot1?.id,
      slot2: slot2?.id,
      isPuzzleSolved,
      isCorrect,
      scoreAwarded,
      bonusAwarded
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Scenario & Puzzle Objective Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-md flex-wrap">
        <div className="flex items-start gap-3">
          <Puzzle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Solve the Puzzle: Build a Secure Encrypted Route Across Untrusted Public Wi-Fi.
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Personal hotspot is unavailable (in-flight / transit). Drag and drop the 2 authentic defense blocks into the empty pipeline slots to neutralize packet sniffers and establish a secure connection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(slot1 !== null || slot2 !== null || selectedBlockForPlacement !== null || testedRoute) && !submitted && (
            <button
              type="button"
              onClick={resetAllSlots}
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}

          {/* Puzzle Status Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Connection Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              isPuzzleSolved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : hasFakeBlock
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isPuzzleSolved 
                ? 'Route 100% Secured ✓' 
                : hasFakeBlock 
                ? 'Unsafe Connection ✗' 
                : 'Incomplete Defense (Slots Empty)'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN INTERACTIVE NETWORK PIPELINE CANVAS */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 border-2 border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">In-Flight / Public Transit Network Grid (35,000 ft)</span>
          </div>
          {(slot1 || slot2) && !submitted && (
            <button
              type="button"
              onClick={resetAllSlots}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Slots</span>
            </button>
          )}
        </div>

        {/* Visual Route Pipeline Grid */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            
            {/* NODE 1: ORIGIN WORK LAPTOP */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Your Laptop</div>
                <div className="text-[10px] font-mono text-slate-400">Customer Files</div>
              </div>
              <span className="inline-block text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Origin
              </span>
            </div>

            {/* NODE 2: UNTRUSTED PUBLIC WI-FI ACCESS POINT */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Public Access Point</div>
                <div className="text-[10px] font-mono text-amber-400">Untrusted Gateway</div>
              </div>
              <select
                disabled={submitted}
                value={selectedAp}
                onChange={(e) => setSelectedAp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] font-mono text-slate-300 outline-none"
              >
                <option value="flight_wifi">SkyFlyer-InFlight-WiFi</option>
                <option value="airport_wifi">Airport-Terminal-Free</option>
                <option value="cafe_wifi">Transit-Station-Guest</option>
              </select>
            </div>

            {/* NODE 3: DEFENSE SLOT 1 (DRAG OR CLICK DROP TARGET) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnSlot(e, 1)}
              onClick={() => selectedBlockForPlacement && placeBlock(1, selectedBlockForPlacement)}
              className={`p-3.5 rounded-2xl border-2 border-dashed transition-all text-center min-h-[140px] flex flex-col items-center justify-between cursor-pointer ${
                slot1
                  ? slot1.isGenuine
                    ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/70 text-rose-200'
                  : selectedBlockForPlacement
                  ? 'bg-cyan-950/30 border-cyan-400/80 animate-pulse text-cyan-200'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Defense Slot 1</div>
              {slot1 ? (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    slot1.isGenuine ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    <slot1.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{slot1.name}</div>
                    <div className="text-[9px] font-mono opacity-80">{slot1.subtitle}</div>
                  </div>
                  {!submitted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(1);
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-mono"
                    >
                      ✕ Remove
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-1 my-auto">
                  <div className="text-xl opacity-40">+</div>
                  <div className="text-[10px] font-mono leading-tight">
                    {selectedBlockForPlacement ? 'Click to Place Here' : 'Drop Defense Block 1'}
                  </div>
                </div>
              )}
            </div>

            {/* NODE 4: DEFENSE SLOT 2 (DRAG OR CLICK DROP TARGET) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnSlot(e, 2)}
              onClick={() => selectedBlockForPlacement && placeBlock(2, selectedBlockForPlacement)}
              className={`p-3.5 rounded-2xl border-2 border-dashed transition-all text-center min-h-[140px] flex flex-col items-center justify-between cursor-pointer ${
                slot2
                  ? slot2.isGenuine
                    ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/70 text-rose-200'
                  : selectedBlockForPlacement
                  ? 'bg-cyan-950/30 border-cyan-400/80 animate-pulse text-cyan-200'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Defense Slot 2</div>
              {slot2 ? (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    slot2.isGenuine ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    <slot2.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{slot2.name}</div>
                    <div className="text-[9px] font-mono opacity-80">{slot2.subtitle}</div>
                  </div>
                  {!submitted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(2);
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-mono"
                    >
                      ✕ Remove
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-1 my-auto">
                  <div className="text-xl opacity-40">+</div>
                  <div className="text-[10px] font-mono leading-tight">
                    {selectedBlockForPlacement ? 'Click to Place Here' : 'Drop Defense Block 2'}
                  </div>
                </div>
              )}
            </div>

            {/* NODE 5: TARGET CORPORATE SERVER */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${
                isPuzzleSolved
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Company Servers</div>
                <div className="text-[10px] font-mono text-slate-400">Encrypted Target</div>
              </div>
              <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                isPuzzleSolved
                  ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30'
                  : 'text-slate-500 bg-slate-950 border-slate-800'
              }`}>
                {isPuzzleSolved ? 'Connected ✓' : 'Protected'}
              </span>
            </div>
          </div>

          {/* ACTIVE THREAT ALERTS / FAILURE DIAGNOSTICS */}
          {hasFakeBlock && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 animate-fadeIn space-y-2">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Unsafe Connection Alert: Ineffective Security Block Detected!</span>
              </div>
              {slot1 && !slot1.isGenuine && (
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  <strong>Slot 1 ({slot1.name}):</strong> {slot1.failureReason}
                </p>
              )}
              {slot2 && !slot2.isGenuine && (
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  <strong>Slot 2 ({slot2.name}):</strong> {slot2.failureReason}
                </p>
              )}
            </div>
          )}

          {!bothSlotsFilled && !hasFakeBlock && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 animate-fadeIn space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hazard Active: Unencrypted Public Wi-Fi Packet Sniffers Listening!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Both defense slots must be filled with authentic enterprise protection layers to shield confidential data from public access point eavesdroppers. Drag and drop blocks from the tray below.
              </p>
            </div>
          )}

          {isPuzzleSolved && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 animate-fadeIn space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Puzzle Solved: 100% Encrypted Defense Tunnel Established!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Corporate VPN encapsulates all traffic inside an authenticated AES-256 tunnel, while Encrypted DNS shields all host lookups. Attackers on the public access point see only scrambled ciphertext.
              </p>
            </div>
          )}
        </div>

        {/* TRAY OF DRAGGABLE / CLICKABLE DEFENSE BLOCKS (REAL + DECOYS) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Security Blocks Tray (Drag or Click to Slot):
            </span>
            <span className="text-[11px] text-slate-500">
              {selectedBlockForPlacement ? `Selected: "${selectedBlockForPlacement.name}" → Click Slot 1 or 2 above` : 'Pick the genuine security layers'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allBlocks.map((block) => {
              const used = isBlockUsed(block.id);
              const isSelected = selectedBlockForPlacement?.id === block.id;

              return (
                <div
                  key={block.id}
                  draggable={!submitted && !used}
                  onDragStart={(e) => handleDragStart(e, block.id)}
                  onClick={() => {
                    if (submitted) return;
                    sounds.playClick();
                    if (used) {
                      if (slot1?.id === block.id) setSlot1(null);
                      if (slot2?.id === block.id) setSlot2(null);
                    } else if (selectedBlockForPlacement?.id === block.id) {
                      setSelectedBlockForPlacement(null);
                    } else {
                      setSelectedBlockForPlacement(block);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    used
                      ? 'bg-slate-950/60 border-slate-900 opacity-50 cursor-default'
                      : isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      <block.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{block.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{block.subtitle}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    used
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                      : isSelected
                      ? 'text-cyan-300 bg-cyan-950 border-cyan-400'
                      : 'text-slate-500 bg-slate-900 border-slate-800'
                  }`}>
                    {used ? 'Slotted' : isSelected ? 'Selected' : 'Pick'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTestRoute}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center gap-2 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Route Security</span>
          </button>

          {!submitted ? (
            <button
              type="button"
              disabled={!isPuzzleSolved}
              onClick={handleFinalSubmit}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 ${
                isPuzzleSolved
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:scale-[1.02] shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Secure Route Solution</span>
            </button>
          ) : (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Network Defense Solution Recorded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
