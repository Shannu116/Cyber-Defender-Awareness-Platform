# 🛡️ Cyber Defender — Online Cybersecurity Awareness Quiz

**Cyber Defender** is a modern, interactive cybersecurity awareness web application designed specifically for **non-technical employees**. Rather than functioning like a boring corporate compliance questionnaire, Cyber Defender feels like an engaging mini-game that teaches employees how to recognize and respond safely to real-world threats including phishing, executive impersonation, MFA push fatigue, rogue USBs, weak credentials, and accidental security incidents.

All questions, submissions, and aggregated metrics are backed by **MongoDB**.

---

## 🌟 Key Highlights

- **Corporate Mini-Game Aesthetic**: Sleek dark cybersecurity theme (slate-950, deep indigo, neon cyan, electric purple accents), subtle glows, progress rings, and smooth micro-animations. Zero stereotypical "hacker text" or skulls.
- **Diverse Interactive Challenges (10 Missions)**:
  1. **Spot the Phish**: Interactive webmail client with clickable hotspots (lookalike sender domain, artificial urgency, unsecure HTTP link, sensitive payroll verification demand).
  2. **Real or Suspicious?**: 4 realistic messages (Internal company picnic announcement, Bank fraud alert with bit.ly link, Package redelivery SMS, Outlook calendar invite) with 1-click classification.
  3. **Manager Impersonation**: Simulated corporate instant chat thread where an external "Director" demands urgent gift cards while in an executive meeting.
  4. **MFA Bombardment**: Simulated mobile push fatigue attack with 6 consecutive login alerts in 30 seconds from Frankfurt, Germany.
  5. **Password Challenge**: Interactive sorting board categorizing passwords into **STRONGER CHOICE** vs. **WEAKER CHOICE**.
  6. **Unknown USB Drive**: Parking lot baiting scenario with a USB labeled *"CONFIDENTIAL: Executive Compensation 2025"*.
  7. **QR Code Trap**: Breakroom bulletin poster with QR code inspector (Quishing awareness).
  8. **Public Wi-Fi Security**: Café scenario with available networks testing VPN and secure cellular hotspot protocols.
  9. **You Clicked the Link**: Reassuring, supportive incident response scenario emphasizing early, blameless reporting.
  10. **Final Cybersecurity Decision**: Coordinated multi-vector attack combining an overdue invoice email, 1-hour deadline, and follow-up phone call from "Dave from IT Support".
- **Dynamic Gamification**: Live Cyber Score counter (`/ 1000`), bonus points for spotting all phishing indicators, and 4 tiered achievement badges:
  - 🏆 **Cyber Champion** (850–1000 pts)
  - 🛡️ **Cyber Defender** (700–849 pts)
  - 👁️ **Security Aware** (400–699 pts)
  - 📚 **Needs Practice** (0–399 pts)
- **Comprehensive Results Report**:
  - Detailed accuracy percentages across 5 categories: *Phishing Detection*, *Social Engineering*, *Password Safety*, *Incident Response*, and *Remote Work Safety*.
  - 2–3 personalized learning recommendations tailored to the employee's actual answers.
  - Confetti victory celebration.
  - Printable report card.
- **Replay & Targeted Practice**:
  - **Try Again**: Replays the entire 10-challenge mission.
  - **Practice My Weak Areas**: Instantly launches a customized mini-quiz filtering only the categories where the employee scored under 80%.
- **Live Admin Dashboard (`/admin`)**:
  - Total Participants, Average Score, Completion Rate, Average Completion Time, Most Commonly Missed Question.
  - Interactive visual charts for category performance, level distribution, and risk alerts.
  - Live table of recent quiz attempts with one-click inspector modal.
  - "Reset Demo Records" button to restore fresh baseline data at any time.

---

## 🗄️ MongoDB Architecture

The entire platform is backed by **MongoDB**:
- **`Question` Collection**: Stores structured challenge definitions with scenarios, question types, point values, bonus triggers, and non-technical explanations.
- **`QuizAttempt` Collection**: Records each employee's session, department, answers, question time stamps, category score breakdowns, and personalized recommendations.
- **MongoDB Aggregation Pipelines**: Powers the Admin Console to compute real-time averages, completion rates, most-missed vulnerabilities, and distribution metrics.
- **Zero-Friction Fallback**: Connects to `process.env.MONGODB_URI` (or local MongoDB daemon `mongodb://127.0.0.1:27017/cyber_defender`). If a local daemon is not running, it automatically boots a high-performance MongoDB instance in memory and seeds the 10 challenges and demo analytics immediately.

---

## 🚀 Quick Start

### 1. Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 2. Run the Application

You can run the server and client concurrently with a single command:

```bash
npm run dev
```

- **Frontend Client (Vite Dev Server)**: [http://localhost:3000](http://localhost:3000)
- **Backend API & MongoDB Server**: [http://localhost:5000](http://localhost:5000)

Alternatively, to build and run the unified production server on a single port:

```bash
npm run build
npm start
```
Then visit [http://localhost:5000](http://localhost:5000) (and [http://localhost:5000/admin](http://localhost:5000/admin) for the Admin Dashboard).

### 3. Administrator Authentication

The Admin Console and quiz analytics are **strictly protected by authentication** and are not accessible to regular quiz takers:
- **Default Username**: `admin`
- **Default Password**: `CyberAdmin2025!`
- **Access**: Navigate to `/admin` or click the discreet **Administrator Portal** link in the footer.
- **Auto-Fill**: The login modal provides a 1-click **"Auto Fill"** helper button for quick demo evaluation.
- All admin endpoints (`/api/admin/stats`, `/api/admin/attempts`, `/api/admin/reset-demo`) enforce JWT Bearer authentication.

---

## 🧭 Application Routes & Navigation

| Route | View | Description | Access |
|---|---|---|---|
| `/` | **Welcome Screen** | Mission intro, estimated time (8–10 min), beginner badge, optional name/department customization. | Public |
| `/` (Step 2) | **Mission Briefing** | Normal workday scenario, 3 Core Rules (Stop & think, Verify requests, Report activity). | Public |
| `/` (Step 3–12) | **10 Interactive Missions** | 10 varied challenge components with immediate non-technical feedback and scoring. | Public |
| `/` (Step 13) | **Results Report** | Final score, Cyber Level badge, category breakdown bars, personalized tips, Print & Weak-Area practice. | Public |
| `/admin` | **Admin Login** | Secure credential authentication screen with show/hide password and demo auto-fill. | Restricted |
| `/admin` (Auth) | **Admin Console** | Real-time MongoDB metrics, completion rates, category accuracy charts, attempt history, and logout. | Protected (JWT) |

---

## 🔒 Security & Privacy Guarantee

- **Simulation Only**: Completely safe, fictional workplace training scenarios.
- **Zero Credential Requests**: Never prompts for real passwords, MFA codes, or banking details.
- **Safe URLs**: All suspicious links point to safe demo placeholders (e.g. `.xyz`, `.top`) with unrouted destinations.
- **Blameless Culture**: Reinforces that prompt reporting of accidental mistakes is safe, supportive, and protects the entire organization.
