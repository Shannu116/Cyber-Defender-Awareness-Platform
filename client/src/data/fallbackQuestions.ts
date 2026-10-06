import { Question } from '../types';

export const fallbackQuestions: Question[] = [
  // Challenge 1: The Email Investigation (NEW REALISTIC SIMULATION)
  {
    id: 'ch-1',
    order: 1,
    title: 'The Email Investigation',
    category: 'Phishing Detection',
    questionType: 'email_investigation',
    scenario: 'You receive an email during a normal workday regarding employee payroll records verification. Inspect the email carefully to find anything suspicious before taking action.',
    question: 'Inspect the email carefully using "Spot the Difference" to find suspicious elements before taking action.',
    points: 100,
    bonusPoints: 25,
    details: {},
    options: [
      {
        id: 'email-opt-report',
        text: 'Report Phish from the email toolbar.',
        isCorrect: true,
        explanation: 'Reporting alerts corporate defenders to block the malicious sender domain and prevent company-wide compromise.'
      }
    ],
    explanation: 'Email investigation complete. Key clues you could notice: 1. Sender: Display name looked like "Payroll Services", but actual address (@company-payroll-help.example) did not match your company domain. 2. Link: Button pointed to external domain "account-verification.example". 3. Urgency: Demanded action before the end of the day to avoid payment delays. 4. Generic Greeting: Addressed with "Hello," instead of your personal name.',
    safeTakeaway: 'Always pause when an email urges rapid action around money or credentials. Verify directly through official internal channels.',
    commonMistake: 'Clicking immediately out of panic because of the mention of salary disruption.'
  },

  // Challenge 2: Investigate the Message (NEW)
  {
    id: 'ch-2',
    order: 2,
    title: 'Investigate the Message',
    category: 'Phishing Detection',
    questionType: 'message_investigate',
    scenario: 'You receive an urgent SMS notification on your smartphone regarding an undelivered parcel. Review your message inbox to find what doesn\'t belong.',
    question: 'Review your message inbox using "Odd One Out" to find the fraudulent message and delete/block it.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'msg-opt-report',
        text: 'Delete & Block Number to prevent smishing attacks.',
        isCorrect: true,
        explanation: 'Deleting and blocking the unverified number stops delivery scam follow-ups and protects your device.'
      }
    ],
    explanation: '🔎 Good investigation. You didn\'t trust the message just because it looked official. Scammers prey on everyday expectations like package deliveries. Warning signs include unexpected payment requests (₹25 rescheduling fee), unverified personal 10-digit sender numbers (+91 98765 43210), and unofficial destination domains.',
    safeTakeaway: 'When in doubt, never click links in text messages. Track packages exclusively through the merchant\'s verified app or official website.',
    commonMistake: 'Trusting a text message simply because it mentions a delivery issue or looks official.'
  },

  // Challenge 3: Verify the Boss (NEW)
  {
    id: 'ch-3',
    order: 3,
    title: 'Verify the Boss',
    category: 'Social Engineering',
    questionType: 'chat_decision',
    scenario: 'You receive an urgent direct message from an account displaying your director’s name. Evaluate the conversation and decide how to respond.',
    question: 'Evaluate the conversation using "Shadow Matching", verify via Call Director, and report executive impersonation.',
    points: 100,
    bonusPoints: 15,
    details: {
      chatSender: {
        name: 'Director Robert Chen',
        avatarText: 'RC',
        role: 'Director of Operations',
        status: 'Active now (Guest / External)',
      }
    },
    options: [
      {
        id: 'boss-opt-verify',
        text: 'Use the Call Director tool to independently verify the request, then report executive impersonation.',
        isCorrect: true,
        explanation: 'Attackers rely on employees feeling pressured by executive authority. Always verify via an independent channel.'
      }
    ],
    explanation: '🚨 You detected an impersonation attempt. Attackers frequently impersonate managers or executives to pressure employees into bypassing financial controls. When a request involves gift cards, confidential data, or voice obstruction, always verify using a trusted independent channel like Call Director.',
    safeTakeaway: 'Legitimate business transactions never require buying consumer gift cards with personal funds. Always pause and verify out-of-band.',
    commonMistake: 'Believing the message because the sender profile picture and title look authentic.'
  },

  // Challenge 4: MFA Notification Storm (NEW)
  {
    id: 'ch-4',
    order: 4,
    title: 'MFA Notification Storm',
    category: 'Password Safety',
    questionType: 'mfa_alert',
    scenario: 'Your phone begins buzzing with repeated authenticator sign-in requests from a foreign location while you are away from your computer. Handle the alert storm safely.',
    question: 'Execute the 3-step escape path: Deny the prompt, Report the incident to IT, and Reset your password immediately.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'mfa-opt-deny-report',
        text: 'Execute the 3-step escape path: Deny the prompt, Report the incident to IT, and Reset your password immediately.',
        isCorrect: true,
        explanation: 'Denying stops the attacker from entering, while reporting and resetting your password eliminates their knowledge of your credentials.'
      }
    ],
    explanation: 'Repeated unexpected login requests occur when an attacker has acquired your password, but Multi-Factor Authentication prevents them from gaining entry. Denying the prompt stops them. Reporting to IT and updating your password immediately cuts off their access.',
    safeTakeaway: 'Never approve an MFA prompt you did not personally initiate. Deny the prompt, report to IT, and reset your password immediately.',
    commonMistake: 'Tapping "Approve" just to silence repetitive buzzing notifications.'
  },

  // Challenge 5: The Password & Passphrase Wheel (Akshara Chakram Builder)
  {
    id: 'ch-5',
    order: 5,
    title: 'The Password & Passphrase Wheel (Akshara Chakram Builder)',
    category: 'Password Safety',
    questionType: 'password_challenge',
    scenario: 'You need to create a secure credential for your enterprise CRM account. Choose between Traditional Password (4 concentric circles) or Enterprise Passphrase (3 concentric circles + custom word).',
    question: 'Manually rotate the concentric circles, align characters with the center Selection Region, add them to your credential, and click Finalize & Check to verify against automated attacks.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'pwd-opt-nist',
        text: 'Assemble a compliant password or passphrase by rotating concentric circles and verifying mathematical resilience against automated attacks.',
        isCorrect: true,
        explanation: 'Length and entropy produce astronomical crack times while remaining manageable for users to remember.'
      }
    ],
    explanation: 'NIST SP 800-63B enterprise standards emphasize that length and entropy provide vastly superior protection compared to short passwords. Rotating concentric circles allows you to craft combinations with exponential resistance to dictionary and brute-force attacks.',
    safeTakeaway: 'Focus on length and non-predictable patterns. A long combination or multi-token passphrase is mathematically unbreakable for automated botnets.',
    commonMistake: 'Relying on short words with predictable numbers or sequential patterns (like Ramesh2026! or 1234).'
  },

  // Challenge 6: The Office Incident (NEW PHYSICAL SECURITY MINI-GAME)
  {
    id: 'ch-6',
    order: 6,
    title: 'The Office Incident',
    category: 'Social Engineering',
    questionType: 'office_incident',
    scenario: '12:30 PM: You are leaving your desk for lunch. Make sure your workspace and devices are secure before leaving.',
    question: 'Below is your office desk before lunch. Drag and drop physical security hazards into their secure disposal and lock containers.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'office-opt-secure',
        text: 'Lock workstation, lock confidential documents in secure drawer, shred exposed password notes, and deliver unknown USB to IT Security.',
        isCorrect: true,
        explanation: 'Physical security safeguards company assets, credentials, and data from unauthorized in-person access.'
      }
    ],
    explanation: 'Workspace secured. You protected: 1. Workstation: Locking your screen prevents unauthorized physical access. 2. Confidential Documents: Clean Desk policies ensure sensitive employee information is stored in locked drawers. 3. Unknown Devices: Handing found USB drives to IT Security prevents malicious payload injection. 4. Passwords: Never write credentials on physical sticky notes.',
    safeTakeaway: 'Physical security matters too. A cybersecurity incident doesn\'t always start with an email or website.',
    commonMistake: 'Plugging in an unknown USB drive out of curiosity or leaving an unlocked laptop unattended.'
  },

  // Challenge 7: Inspect Before You Scan (NEW)
  {
    id: 'ch-7',
    order: 7,
    title: 'Inspect Before You Scan',
    category: 'Phishing Detection',
    questionType: 'qr_inspect',
    scenario: 'You discover a benefits enrollment flyer posted in the office breakroom that closely mimics the official HR notice.',
    question: 'Compare the official notice with the breakroom flyer side-by-side. Spot the subtle differences (such as email typosquatting, lookalike links, spoofed QR destination, urgency pressure, and mismatched document ID) that expose the counterfeit poster. Beware of legitimate decoys!',
    points: 100,
    bonusPoints: 25,
    details: {
      differencesCount: 5,
      posterHeader: 'Amazon.com, Inc. • Human Resources',
      posterNotice: 'Notice #AMZ-2026-B',
      officialPortalUrl: 'https://benefits.amazon.com/enroll',
      qrPreviewUrl: 'https://www.amazon.com/',
      qrDifferences: [
        {
          id: 'diff_email',
          type: 'email',
          title: 'Typosquatting Domain ("rn" vs "m")',
          officialValue: 'benefits@amazon.com',
          rogueValue: 'benefits@arnazon.com',
          explanation: 'Look for lookalike letter pairs: rn vs m, vv vs w, cl vs d. The rogue flyer lists benefits@arnazon.com, pairing "r" and "n" to visually mimic "m" in standard sans-serif screen fonts.'
        },
        {
          id: 'diff_link',
          type: 'subdomain',
          title: 'Lookalike Subdomain Phishing Gateway',
          officialValue: 'https://benefits.amazon.com/enroll',
          rogueValue: 'https://amazon-benefits.portal-auth.com/enroll',
          explanation: 'Look only at the text before the first \'/\'. The real owner is the last two parts of that domain (e.g., portal-auth.com). Attackers place "amazon-benefits" in the subdomain prefix to deceive users.'
        },
        {
          id: 'diff_qr',
          type: 'qr_dest',
          title: 'Spoofed QR Destination (Tracker / Hosting Domain Mismatch)',
          officialValue: 'https://www.amazon.com/',
          rogueValue: 'https://phish-tracker-1.onrender.com/track/click?token=1083c99e-e3b2-4e10-a92e-afc3ba949351',
          explanation: 'The QR code opened an unrelated hosting domain that doesn\'t match the address printed on the flyer. Always preview the URL your phone shows before opening it.'
        },
        {
          id: 'diff_urgency',
          type: 'urgency',
          title: 'Manufactured Urgency & Panic Pressure',
          officialValue: 'Open Enrollment Period: Oct 1 – Oct 31, 2026 (Annual Window)',
          rogueValue: 'Enroll within 24 hours or lose coverage',
          explanation: 'The rogue flyer threatens employees with immediate 24-hour loss of coverage. Genuine open enrollment periods at Amazon run for an entire month (Oct 1 – Oct 31).'
        },
        {
          id: 'diff_form_id',
          type: 'form_id',
          title: 'Mismatched Document ID Code',
          officialValue: 'Doc ID: AMZ-HR-BEN-2026',
          rogueValue: 'Doc ID: AMZ-HR-BEN-2026-X',
          explanation: 'Notice the mismatched document ID: "AMZ-HR-BEN-2026-X" carries an unauthorized "-X" suffix not found on the authentic Amazon HR template.'
        }
      ],
      qrDecoys: [
        {
          id: 'decoy_extension',
          title: 'Campus PBX Internal Dial Extension',
          value: 'Amazon HR Helpdesk: ext. 4-4321 / Tie-line #8-890',
          explanation: 'Standard corporate telephony: 5-digit campus extensions and PBX tie-lines are normal internal dialing procedures at Amazon, not an indicator of fraud.'
        },
        {
          id: 'decoy_tpa',
          title: 'Third-Party Administrator Support Alias',
          value: 'TPA Support: fidelity-benefits@netbenefits.com',
          explanation: 'Standard enterprise practice: Amazon officially partners with third-party administrators like Fidelity NetBenefits to manage 401(k) and health accounts.'
        },
        {
          id: 'decoy_timestamp',
          title: 'ISO 8601 UTC Cutoff Timestamp',
          value: 'Portal Cutoff: 2026-10-31T23:59:00Z (UTC)',
          explanation: 'Standard AWS / cloud infrastructure practice: Deadlines are recorded in UTC to prevent timezone ambiguity across Amazon fulfillment centers and corporate hubs.'
        }
      ],
      qrFollowUp: {
        question: 'A coworker already scanned the flyer and entered their corporate credentials. What should they do immediately?',
        options: [
          {
            id: 'fu_correct',
            text: 'Change corporate password immediately, notify IT Security, and revoke active sessions / check MFA tokens.',
            isCorrect: true,
            explanation: 'Immediate password resets and session terminations cut off credential harvesting before attackers can pivot.'
          },
          {
            id: 'fu_cache',
            text: 'Just clear browser history and cache on their phone, no need to alert anyone.',
            isCorrect: false,
            explanation: 'Clearing phone browser cache does not protect the corporate account once credentials have been sent to an attacker server.'
          },
          {
            id: 'fu_wait',
            text: 'Wait until open enrollment closes at the end of the month to check if their health benefits were updated.',
            isCorrect: false,
            explanation: 'Waiting weeks gives attackers uninhibited access to exfiltrate company data and compromise email.'
          },
          {
            id: 'fu_forward',
            text: 'Forward the flyer link to HR via personal email to ask if it is real.',
            isCorrect: false,
            explanation: 'Forwarding unvetted malicious links risks secondary infection and violates secure incident handling procedures.'
          }
        ]
      }
    },
    options: [
      {
        id: 'qr-opt-scan',
        text: 'Scan it yourself with your smartphone to inspect where the link redirects.',
        isCorrect: false,
        explanation: 'Never scan suspicious QR codes on your devices; doing so exposes your phone to zero-days and phishing gateways.'
      },
      {
        id: 'qr-opt-ignore',
        text: 'Ignore the flyer and leave it on the breakroom wall.',
        isCorrect: false,
        explanation: 'Fails collective defense; leaving the malicious flyer active puts all coworkers at risk.'
      },
      {
        id: 'qr-opt-teardown',
        text: 'Tear down the poster immediately and warn coworkers.',
        isCorrect: false,
        explanation: 'Partial credit: while this prevents immediate scans, it destroys physical evidence needed for forensic and CCTV review.'
      },
      {
        id: 'qr-opt-report',
        text: 'Report the counterfeit flyer to IT Security & Facilities, preserving physical evidence while alerting teams.',
        isCorrect: true,
        explanation: 'Best practice: IT Security coordinates forensic preservation, CCTV review, domain blocking, and physical sweeps.'
      }
    ],
    explanation: 'Attackers craft clone flyers to stage in-person Quishing (QR Phishing) and credential theft in office spaces. By copying legitimate logos and templates, they rely on employees failing to spot typosquatted email addresses ("rn" vs "m"), lookalike web domains, spoofed QR destinations, fake 24-hour urgency, and mismatched document tracking IDs. Always inspect URLs, verify domains before the first slash, and report physical counterfeits to IT Security.',
    safeTakeaway: 'Look closely for typosquatting, subdomain tricks, and fake urgency. Never scan physical QR codes without verifying the decoded destination URL, and report rogue posters to IT Security.',
    commonMistake: 'Scanning a physical flyer code out of curiosity or assuming a poster is safe simply because it is hung in an internal corporate breakroom.'
  },

  // Challenge 8: Secure the Laptop (NEW)
  {
    id: 'ch-8',
    order: 8,
    title: 'Secure the Laptop',
    category: 'Remote Work Safety',
    questionType: 'laptop_security',
    scenario: 'You are working from an in-flight public Wi-Fi access point at 35,000 feet where personal cellular hotspots are unavailable.',
    question: 'Solve the puzzle: Drag and drop the authentic security layers into the empty pipeline slots to shield corporate data from public access point sniffers.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'wifi-opt-vpn',
        text: 'Enforce end-to-end Corporate VPN and Encrypted DNS Shielding across untrusted public Wi-Fi access points before accessing company systems.',
        isCorrect: true,
        explanation: 'VPN encryption and encrypted DNS prevent packet sniffing, eavesdropping, and DNS hijacking over open public Wi-Fi.'
      }
    ],
    explanation: 'Public access points and in-flight Wi-Fi lack local network isolation, allowing nearby attackers to sniff unencrypted packets or redirect DNS requests. Incognito mode and ad blockers provide zero encryption. Engaging an authentic Corporate VPN tunnel and Encrypted DNS shield encapsulates all data in authenticated ciphertext.',
    safeTakeaway: 'Always activate your approved corporate VPN and encrypted DNS when working from untrusted public or in-flight Wi-Fi. Tools like Incognito mode do not encrypt network traffic.',
    commonMistake: 'Believing that "Incognito / Private Browsing" encrypts Wi-Fi network traffic or protects against packet sniffers.'
  },

  // Challenge 9: You Clicked It (Story Simulation for Sales & Marketing)
  {
    id: 'ch-9',
    order: 9,
    title: 'You Clicked It',
    category: 'Incident Response',
    questionType: 'incident_toolbox',
    scenario: '2:37 PM: You clicked a link in an email, and an unfamiliar page started loading on your screen. Don\'t panic—let\'s handle it together!',
    question: 'Follow the 4-scene story with Echo: learn what to do first, stop the leak on your laptop, tell the Security Team, and lock your accounts safely.',
    points: 100,
    bonusPoints: 20,
    details: {
      storyDetails: {
        walletCards: [
          { id: 'cancel_cards', text: 'Cancel the cards', icon: '💳' },
          { id: 'tell_someone', text: 'Tell someone', icon: '🗣️' },
          { id: 'call_bank', text: 'Call the bank', icon: '📞' }
        ],
        walletLesson: 'A bad link is the same. Act fast, tell people, lock things down.',
        leakActions: [
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
        ],
        reportBlanks: {
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
        },
        devices: [
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
        ],
        checklist: [
          { id: 'step_change_pwd', text: 'Change my password' },
          { id: 'step_logout_all', text: 'Log out of everything' },
          { id: 'step_warn_team', text: 'Warn teammates who got the same email' }
        ]
      }
    },
    options: [
      {
        id: 'story-opt-complete',
        text: 'Stop the leak by turning off Wi-Fi, report honestly to the Security Team, and change passwords safely from your phone.',
        isCorrect: true,
        explanation: 'Great job! You contained the problem quickly, helped the team with a clear report, and secured your account without touching the bad laptop.'
      }
    ],
    explanation: 'Accidental clicks happen to everyone. When it happens, turning off Wi-Fi stops the bad link without erasing clues. Sending a quick, honest note lets the Security Team protect the whole company. And changing your password from your clean phone makes sure your account is completely safe.',
    safeTakeaway: 'Everyone clicks sometimes. What matters is what you do next! Turn off Wi-Fi right away, tell the Security Team immediately, and change your password from a clean phone.',
    commonMistake: 'Staying quiet out of embarrassment, trying to delete history to hide the click, or turning off the computer completely.'
  },

  // Challenge 10: A Day at Work (Workplace Incident Triage)
  {
    id: 'ch-10',
    order: 10,
    title: 'A Day at Work',
    category: 'Incident Response',
    questionType: 'workday_timeline',
    scenario: 'Navigate a full employee workday through 4 realistic security incidents across morning, midday, and afternoon.',
    question: 'Below is your workplace incident console. Investigate the artifacts to uncover indicators of compromise and execute defensive triage protocols.',
    points: 100,
    bonusPoints: 25,
    details: {},
    options: [
      {
        id: 'workday-opt-complete',
        text: 'Complete all 4 workday incident investigations with proactive defense, independent verification, and prompt containment.',
        isCorrect: true,
        explanation: 'Consistent cyber vigilance across everyday routines ensures full organizational resilience.'
      }
    ],
    explanation: 'YOUR WORKDAY IS COMPLETE. You successfully investigated and contained real-world BEC wire alteration fraud, executive chat impersonation, foreign MFA push fatigue, and disguised binary downloads. Everyday cybersecurity is about stopping to think, investigating anomalies, and reporting promptly.',
    safeTakeaway: 'The Gold Standard Defense: 1. Stop and think. 2. Verify unexpected requests through independent official channels. 3. Contain and report suspicious activity promptly.',
    commonMistake: 'Lowering your guard during routine daily tasks when multitasking or in a rush.'
  }
];
