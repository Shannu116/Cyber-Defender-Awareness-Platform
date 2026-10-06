# Cybersecurity Awareness Quiz - Challenges Specification & Changes Log

## CHALLENGE 1: SPOT THE PHISH (EMAIL INVESTIGATION)
- Email inbox simulation with 4 clues to discover.
- Neutralized decision actions (Report Phish, Delete Message, Reply to Email).

---

## CHALLENGE 2: INVESTIGATE THE MESSAGE (SMISHING INBOX)
- SMS chat simulation with odd-one-out sender ID (+91 vs banking headers).
- Neutralized decision actions (Delete & Block Number, Pay ₹25 fee via link, Reply to Message).

---

## CHALLENGE 3: VERIFY THE BOSS (EXECUTIVE IMPERSONATION)
- Slack/Teams mockup with urgent gift card request.
- Out-of-band "Call Director" verification tool.
- Neutralized decision actions (Report Executive Impersonation, Agree to Buy Gift Cards, Send Codes over Chat).

---

## CHALLENGE 4: MFA NOTIFICATION STORM (AUTHENTICATOR DEFENSE)
- Lock screen push fatigue storm simulator.
- Impossible travel anomaly (Frankfurt, Germany via Tor proxy).
- 3-Phase containment: Deny Push Request → Report Security Incident → Reset Account Password.
- Neutralized choices without spoiler breadcrumbs.

---

## CHALLENGE 5: THE PASSWORD & PASSPHRASE WHEEL (AKSHARA CHAKRAM BUILDER)
- Category: Strong Authentication & Password Hygiene
- Target Audience: Sales & Management Professionals (Non-Technical, Average Age ~40)
- Design Paradigm: Classic "అక్షర చక్రం" (Akshara Chakram) - Concentric Rotating Mechanical Wheels
- Industrial Compliance: Aligned with NIST SP 800-63B Enterprise Standards

### 1. Dual-Path Architecture (Upfront Selection)
- When entering the challenge, the user is prompted to choose their format:
  1. **Traditional Password** (4 Concentric Circles: Higher Case, Small Case, Numbers, Special Characters).
  2. **Enterprise Passphrase** (3 Concentric Circles: Words, Numbers, Special Characters + Custom Words - NIST Recommended).

### 2. Password Mode (4 Concentric Circles)
- Concentric Circles Layout:
  - **Circle 1 (Outer):** Higher Case Letters (`A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`)
  - **Circle 2 (Middle-Outer):** Small Case Letters (`a b c d e f g h i j k l m n o p q r s t u v w x y z`)
  - **Circle 3 (Middle-Inner):** Numbers (`0 1 2 3 4 5 6 7 8 9`)
  - **Circle 4 (Inner):** Special Characters (`! @ # $ % ^ & * _ - + = ?`)
- **Middle Region (Central Selection Region):**
  - Displays the active character aligned at the 12 o'clock sight-line needle.
  - Buttons to focus on any of the 4 circles.
  - **"Add to Password"** gateway button to append aligned character into the live password string.

### 3. Passphrase Mode (3 Concentric Circles + Custom Words)
- Concentric Circles Layout:
  - **Circle 1 (Outer):** Words (`Breeze`, `Tiger`, `Mountain`, `Coffee`, `Silver`, `Galaxy`, `Window`, `River`, `Falcon`, `Ocean`, `Planet`, `Forest`)
  - **Circle 2 (Middle):** Numbers (`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `42`, `77`, `99`, `2026`)
  - **Circle 3 (Inner):** Special Characters (`-`, `!`, `#`, `$`, `@`, `_`, `*`, `&`, `%`, `+`, `~`, `?`)
- **User Input Words Option:**
  - Dedicated text field: "Type Your Own Custom Word" allows personal memorable anchors (e.g., `Hyderabad`) to be added.
- **Middle Region (Central Selection Region):**
  - Displays aligned component (Word, Number, or Special Char).
  - **"Add to Passphrase"** gateway button.

### 4. Manual Rotation Mechanics
- Users manually rotate the concentric circles by:
  1. **Direct Dragging:** Dragging any circle with mouse or touch spins the wheel smoothly around the center in real-time and snaps to nearest item upon release.
  2. **Manual Steppers:** `<` and `>` arrow controls below the wheel allow discrete step-by-step manual rotation for each circle.
  3. **Direct Character Click:** Clicking any character or word on any circle rotates that circle directly to align that item with the 12 o'clock sight-line.

### 5. Finalize & Check Workflow
- Live Assembly Bar displays compiled string, length counter, backspace (`⌫`), and clear (`↺`).
- Passphrase mode includes clickable token pills for easy removal.
- **"Finalize & Check" Button:**
  - Runs simulated automated dictionary attack against password/passphrase.
  - Verifies minimum length ($\ge 12$ for password, $\ge 14$ for passphrase).
  - Detects predictable sequential patterns (e.g., `123`, `789`).
  - Displays estimated crack time metrics (e.g. `0.04 Seconds` for weak vs `450+ Years` / `30,000+ Centuries` for resilient).
  - Echo AI Tutor provides gentle educational interventions if too short.
  - Successful evaluation enables **"Submit Finalized Authentication & Continue"**.

---

## CHALLENGE 7: INSPECT BEFORE YOU SCAN (AMAZON REBRAND, PHISH TRACKER QR & INSTANT FEEDBACK)
- **Category:** Phishing Detection & Physical Social Engineering (Quishing / QR Phishing)
- **Question Type:** `qr_inspect`
- **Component:** `client/src/components/challenges/QrInspectChallenge.tsx`
- **Data Sync:** `client/src/data/fallbackQuestions.ts` and `server/seedData.js`

### 1. Amazon Enterprise Rebranding
- **Authentic Notice:**
  - Header: `Amazon.com, Inc. • Human Resources - Notice #AMZ-2026-B`
  - Title: `2026 Annual Employee Benefits Enrollment`
  - Email: `benefits@amazon.com`
  - Web Address: `https://benefits.amazon.com/enroll`
  - QR Encodes: `https://www.amazon.com/` (`AUTHENTIC_QR_URL`)
  - Document ID: `AMZ-HR-BEN-2026`, Window `Oct 1 – Oct 31`
- **Rogue Breakroom Flyer (Identical layout/styling, differences in content only):**
  - Email: `benefits@arnazon.com` (visual `rn` vs `m` typosquat)
  - Web Address: `https://amazon-benefits.portal-auth.com/enroll` (lookalike subdomain prefix)
  - QR Encodes: `PHISH_TRACKER_URL` (external tracker domain mismatch)
  - Urgency Text: `Enroll within 24 hours or lose coverage` (vs real 30-day window)
  - Document ID: `AMZ-HR-BEN-2026-X` (unauthorized `-X` revision flag)
- **3 Amazon-Themed Decoys on Authentic Content:**
  - Campus PBX Internal Dial Extension: `Amazon HR Helpdesk: ext. 4-4321 / Tie-line #8-890`
  - Authorized Third-Party Administrator Alias: `TPA Support: fidelity-benefits@netbenefits.com` (`EDI-AMZ-8842`)
  - Automated Cloud System Cutoff: `Portal Cutoff: 2026-10-31T23:59:00Z (UTC)`

### 2. Rogue QR Target & Phone Verification
- Configured modular constant reading from `VITE_PHISH_TRACKER_URL` with fallback:
  `PHISH_TRACKER_URL = (import.meta.env.VITE_PHISH_TRACKER_URL as string | undefined) || "https://phish-tracker-1.onrender.com/track/click?token=1083c99e-e3b2-4e10-a92e-afc3ba949351"`
- Scannability: Rendered client-side with `qrcode` package ($\ge 220\text{px}$, Level M error correction, 4-module quiet zone, black-on-white, zero CSS filters/rotation/opacity). The client NEVER fetches or requests this URL.
- Added prompt disclaimer: *"Scans in this exercise are logged for security-awareness training."*
- Updated address verification: Accepts player input containing `"phish-tracker"` or `"onrender.com"` (case-insensitive). Includes fallback *"I can't scan right now"* button without point penalty.

### 3. Instant Feedback on Flagging & Element Locking (No Negative Marking & No Timer)
- **Initial Clean State:** No elements are highlighted, outlined, glowing, or tooltipped initially.
- **Immediate Status Reveal Upon Flagging:**
  - **Real Attack:** Red highlight (`border-rose-500 bg-rose-950/40 text-rose-100 ring-1 ring-rose-500/50`) + `Malicious` badge + one-line explanation.
  - **Authentic Element / Decoy:** Green highlight (`border-emerald-500/50 bg-emerald-950/30 text-emerald-100 ring-1 ring-emerald-500/30`) + `Legitimate` badge + one-line reason it is safe (no point deductions).
- **Permanent Lock:** Once clicked and revealed, an element is locked (cannot be un-flagged or re-scored).
- **No Negative Marking:** Removed all negative penalties across the challenge (no deductions for decoys, authentic sections, hints, or revealing the scanned URL).
- **No Countdown Timer:** Removed time limit and hint countdown lockouts, allowing stress-free self-paced learning.
- **Accessibility & Counters:** Text badges, `aria-live="polite"` feedback announcements, neutral `aria-label` before flagging, and counter displaying `"Flags raised: x"` only without revealing total count.

### 4. Decision Protocols & Incident Remediation
- 4 Operational Choices: Scan it yourself (0 pts), Ignore it (10 pts), Tear it down (50 pts), Report to IT Security & Facilities (100 pts).
- Consequence panels per choice.
- Coworker remediation follow-up question on credential compromise (*"Change corporate password immediately, notify IT Security, and revoke all active account sessions / check MFA tokens"* is correct; +15 bonus pts).
- Echo Tutor Threat Analysis and Subdomain Rule: *"Look only at the text before the first '/'. The real owner is the last two parts of that domain (e.g., portal-auth.com)."*
- Mobile-stacked layout under 768px (`[ 🛡️ 1. Official Notice ]` / `[ ⚠️ 2. Breakroom Flyer ]`).
- Responsive mobile switcher under 768px (`[ 🛡️ 1. Official Notice ]` / `[ ⚠️ 2. Breakroom Flyer ]`).

---

## CHALLENGE 9: YOU CLICKED IT (INTERACTIVE 4-PHASE INCIDENT SIMULATION)
- **Category:** Incident Response
- **Question Type:** `incident_toolbox`
- **Component:** `client/src/components/challenges/IncidentToolboxChallenge.tsx`
- **Data Sync:** `client/src/data/fallbackQuestions.ts` and `server/seedData.js`

### 1. 4-Scene Story Simulation (Zero-Jargon, Grade-6 Friendly)
Redesigned Challenge 9 for sales and marketing staff with zero cybersecurity background. The interactive experience is guided by Echo (the tutor mascot) through a 4-scene story with friendly coaching, emoji icons, big buttons, and everyday comparisons:

1. **Scene 1: "The Lost Wallet" (Intuitive Real-Life Comparison):**
   - Echo asks what you would do if you dropped your wallet on the sidewalk.
   - Player drags or taps 3 cards into order: `Cancel the cards` (or `Call the bank`), `Tell someone`, `Call the bank`.
   - Accessible via both HTML5 Drag & Drop and tap-to-slot placement with reset support.
   - Echo's takeaway: *"A bad link is the same! Act fast, tell people, lock things down."*

2. **Scene 2: "Stop the Leak" (Bathtub Metaphor & Trouble Meter):**
   - Displays a simplified laptop graphic showing an unfamiliar loading page (`http://unfamiliar-portal-check.net/login`).
   - Gentle **Trouble Meter** fills slowly like water in a leaky bathtub (+5% every ~3s, pausing automatically while Echo speaks).
   - 5 Big action buttons with real-life comparisons:
     - 🔌 `Turn off Wi-Fi`: Stops the meter immediately (Best practice: like turning off the water tap before the bathroom floods!). Award 25 pts.
     - ❌ `Close the page`: Slows the meter down (like catching water in a bucket; leak still trickles).
     - 💻 `Turn the laptop off`: Stops the meter, but explains the Security Team may need to see what happened on the screen (-10 pt penalty).
     - 🗑️ `Delete my history`: Ineffective; explains it only wipes the mirror while the tap is still running (-10 pt penalty).
     - ⏳ `Do nothing`: Lets water rise (-15 pt penalty).

3. **Scene 3: "Tell the Help Team" (Fill-in-the-Blanks Message Builder):**
   - Free-form fill-in-the-blanks note to the Security Team:
     *"Hi Security Team! At [time] I clicked a link in an email from [sender] about [subject]. I [did / did not] type my password. My laptop is [state]. Can you help?"*
   - Tap-to-pick dropdowns with 3–4 choices per blank, including silly distractors (Santa Claus, pet cat, unicorn invitation, swimming in the bathtub).
   - Security Team Helper (Alex) provides gentle real-time coaching for silly or missing entries without scolding.
   - Reporting counts for the highest point weight (45 pts); reporting honestly triggers celebration feedback.

4. **Scene 4: "Lock the Doors" (Safe Device Selection & Plain Checklist):**
   - Device choice: **Your Phone** vs **Your Laptop**.
   - Choosing laptop triggers Echo's analogy: *"You don't change the locks from inside a house with a burglar in it!"* (-5 pt penalty, immediate retry allowed).
   - Choosing phone succeeds; presents a 3-item plain checklist:
     1. Change my password
     2. Log out of everything
     3. Warn teammates who got the same email

5. **Finish Screen & 3 Star Badges:**
   - 3 Earned Star Badges:
     - 🔌 **Unplug:** Turned off Wi-Fi quickly.
     - 📣 **Tell someone:** Sent a clear note to the Security Team.
     - 🔑 **Change your password safely:** Used a clean device to lock the doors.
   - Echo's closing takeaway: *"Everyone clicks sometimes. What matters is what you do next."*
   - Plain language safe takeaway and common mistake summaries.

### 2. Scoring Structure (100 Base + 20 Bonus)
- **Scene 2 (Stop the Leak):** 25 pts max (Turn off Wi-Fi full 25 pts; close page partial 15 pts; penalties for destructive/do-nothing actions).
- **Scene 3 (Tell the Security Team):** 45 pts max (Prompt, honest reporting is the most heavily weighted behavior).
- **Scene 4 (Lock the Doors):** 30 pts max (15 pts safe device choice + 15 pts completing the 3-step checklist).
- **Bonus (+20 pts):** Awarded for a clean run with zero penalties (Wi-Fi off on first attempt, honest report, safe phone choice on first try).
- **Pass Criteria:** Network disconnected or page closed, report sent, and no concealment.

### 3. Accessibility & Quality
- Strict TypeScript with typed models (`StoryCard`, `StopLeakAction`, `ReportBlankOption`, `SafeDeviceOption`, `IncidentChecklistItem`), 0 `any` types.
- Zero jargon in player-facing UI: no "SOC", "endpoint", "payload", "forensics", "C2", or "token".
- Keyboard operable, ARIA live regions for Trouble Meter and Echo speech, high contrast, reduced-motion friendly, responsive layout stacked under 768px.
- Synchronized across `IncidentToolboxChallenge.tsx`, `fallbackQuestions.ts`, `seedData.js`, and live MongoDB Atlas.
- **Side Echo Bar Live Stream:** All of Echo's interactive coaching replies, analogies, and helper guidance throughout Challenge 9 (the wallet rule, leak action comparisons, Security Team Alex's nudges, door lock rule, and finish takeaway) are piped into the side Echo Tutor chat drawer on the right via `postEchoMessage` with dynamic unread notification indicators.
