export const questionsData = [
  // Challenge 1: The Email Investigation (NEW REALISTIC SIMULATION)
  {
    id: 'ch-1',
    order: 1,
    title: 'The Email Investigation',
    category: 'Phishing Detection',
    questionType: 'email_investigation',
    scenario: 'You receive an email during a normal workday regarding employee payroll records verification.',
    question: 'Below is an email. Find the suspicious elements within it.',
    points: 100,
    bonusPoints: 25,
    details: {},
    options: [
      {
        id: 'email-opt-report',
        text: 'Report the email as suspicious phishing to IT Security.',
        isCorrect: true,
        explanation: 'Reporting alerts corporate defenders to block the malicious sender domain and prevent company-wide compromise.'
      }
    ],
    explanation: 'Email investigation complete. Key clues you could notice: 1. Sender: Display name looked like "Payroll Services", but actual address (@company-payroll-help.example) did not match your company domain. 2. Link: Button pointed to external domain "account-verification.example". 3. Urgency: Demanded action before the end of the day to avoid payment delays. 4. Independent Verification: Calling the official internal Payroll extension confirmed they never sent the email.',
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
    scenario: 'You receive an urgent SMS notification on your smartphone regarding an undelivered parcel demanding an immediate rescheduling fee.',
    question: 'Below is an SMS received on your smartphone. Find the suspicious elements within it.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'msg-opt-report',
        text: 'Report the message as a smishing scam to company security.',
        isCorrect: true,
        explanation: 'Reporting alerts security teams to block lookalike domains and warn other staff members.'
      }
    ],
    explanation: '🔎 Good investigation. You didn\'t trust the message just because it looked official. Scammers prey on everyday expectations like package deliveries. Warning signs include unexpected payment requests, urgency deadlines, unverified personal sender numbers, and unofficial destination domains.',
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
    scenario: 'You receive an urgent direct message from an account displaying your director’s name asking you to buy ₹10,000 in gift cards.',
    question: 'Below is a direct messaging chat claiming to be your manager. Find the suspicious elements within this conversation.',
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
        text: 'Call your director on their official extension to verify the request before taking any action.',
        isCorrect: true,
        explanation: 'Attackers rely on employees feeling pressured by executive authority. Always verify via an independent channel.'
      }
    ],
    explanation: '🚨 You detected an impersonation attempt. Attackers frequently impersonate managers or executives to pressure employees into bypassing financial controls. When a request involves gift cards, confidential data, or extreme urgency, always verify using a trusted independent channel.',
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
    scenario: 'Your phone begins buzzing with repeated authenticator sign-in requests from a foreign location while you are not attempting to log in.',
    question: 'Below is an incoming MFA authentication alert. Find the suspicious elements within it.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'mfa-opt-deny-report',
        text: 'Deny the unexpected login requests, report the attack to IT Security, and immediately update your password.',
        isCorrect: true,
        explanation: 'Denying stops the attacker from entering, while reporting and resetting your password eliminates their knowledge of your credentials.'
      }
    ],
    explanation: 'Repeated unexpected login requests occur when an attacker has acquired your password, but Multi-Factor Authentication prevents them from gaining entry. Denying the prompt stops them. Updating your password immediately cuts off their access.',
    safeTakeaway: 'Never approve an MFA prompt you did not personally initiate. Deny the prompt, report to IT, and reset your password immediately.',
    commonMistake: 'Tapping "Approve" just to silence repetitive buzzing notifications.'
  },

  // Challenge 5: Password Challenge (UNTOUCHED)
  {
    id: 'ch-5',
    order: 5,
    title: 'Password Challenge',
    category: 'Password Safety',
    questionType: 'drag_drop',
    scenario: 'Corporate policy requires strong credentials to safeguard customer and financial records.',
    question: 'Classify weak credential patterns versus resilient passphrases, then assemble high-entropy credentials (16–36 characters) using passphrase building blocks.',
    points: 100,
    bonusPoints: 20,
    details: {
      passwords: [
        {
          id: 'pwd-1',
          text: 'Summer2025!',
          correctCategory: 'weaker',
          reason: 'Common seasonal formula with capital letter and exclamation mark; easily cracked by dictionary tools in milliseconds.'
        },
        {
          id: 'pwd-2',
          text: 'purple-giraffe-dancing-under-stars',
          correctCategory: 'stronger',
          reason: 'Long passphrase (34 characters) using random words. Easy for humans to remember, extraordinarily difficult for computers to crack.'
        },
        {
          id: 'pwd-3',
          text: 'Welcome123',
          correctCategory: 'weaker',
          reason: 'One of the top 10 most common default passwords worldwide; present in every hacker wordlist.'
        },
        {
          id: 'pwd-4',
          text: 'MichaelSmith1992',
          correctCategory: 'weaker',
          reason: 'Built entirely from personal info (first name, last name, birth year) easily discovered on LinkedIn or social media.'
        },
        {
          id: 'pwd-5',
          text: 'coffee#Ocean-92!Telescope',
          correctCategory: 'stronger',
          reason: 'Long, diverse combination of unrelated nouns, symbols, and numbers.'
        },
        {
          id: 'pwd-6',
          text: 'correct-horse-battery-staple-9!',
          correctCategory: 'stronger',
          reason: 'Passphrase structure with high entropy, long length, and high resistance to brute force attacks.'
        }
      ]
    },
    options: [],
    explanation: 'Password length and uniqueness are far more important than arbitrary substitutions (like replacing "E" with "3"). Passphrases made of multiple unrelated words are both stronger and easier to remember.',
    safeTakeaway: 'Use long, unique passphrases or a company-approved password manager. Never reuse the same password across personal and work accounts.',
    commonMistake: 'Thinking that short words with simple substitutions (like "P@ssw0rd") are secure.'
  },

  // Challenge 6: The Office Incident
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
    question: 'Compare the official notice with the breakroom flyer side-by-side. Spot the subtle differences (such as email typosquatting, lookalike links, and spoofed QR codes) that expose the counterfeit poster.',
    points: 100,
    bonusPoints: 15,
    details: {},
    options: [
      {
        id: 'qr-opt-report',
        text: 'Report the counterfeit flyer to IT Security and Facilities, and access corporate systems exclusively through authentic company bookmarks.',
        isCorrect: true,
        explanation: 'QR codes and clone flyers are not automatically safe and can point to malicious credential harvesting websites.'
      }
    ],
    explanation: 'Attackers create near-identical clone flyers to stage in-person phishing ("Quishing") and credential theft. By copying legitimate logos and templates, they rely on employees failing to spot typosquatted email addresses ("rn" vs "m") and lookalike web domains. Always inspect links and domain names carefully.',
    safeTakeaway: 'Look closely for typosquatting and lookalike domains. Never scan physical QR codes or click printed links without verifying the exact destination URL.',
    commonMistake: 'Assuming a flyer is authentic simply because it uses the real company logo and matches the official layout.'
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

  // Challenge 9: You Clicked It (NEW)
  {
    id: 'ch-9',
    order: 9,
    title: 'You Clicked It',
    category: 'Incident Response',
    questionType: 'incident_toolbox',
    scenario: '2:37 PM: You accidentally clicked a suspicious link in an email and an unfamiliar loading page appeared in your browser.',
    question: 'Below is an incident response screen after clicking a suspicious link. Find the essential containment actions to neutralize the threat.',
    points: 100,
    bonusPoints: 20,
    details: {},
    options: [
      {
        id: 'inc-opt-report',
        text: 'Close the browser tab immediately, contact IT Security, and report the incident promptly.',
        isCorrect: true,
        explanation: 'Prompt reporting is the cornerstone of effective security. Quick reporting empowers defenders to neutralize threats in minutes.'
      }
    ],
    explanation: 'Mistakes happen. Reporting quickly can help your organization respond. Security teams rely on transparent, blameless reporting. Prompt notification allows defenders to revoke exposed tokens, isolate affected endpoints, and protect colleagues across the company.',
    safeTakeaway: 'If you click something suspicious, report it immediately! Prompt reporting is a sign of high responsibility, not failure.',
    commonMistake: 'Staying silent out of embarrassment or fear, giving attackers hours or days of quiet access.'
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
