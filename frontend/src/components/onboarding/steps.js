import { Wifi, PhoneCall, MessageSquare, Wallet, Globe2, Users } from 'lucide-react';

export const STEPS = [
  {
    key: 'dataNeed',
    icon: Wifi,
    title: 'How much mobile data do you use in a month?',
    subtitle: 'Think about streaming, social media, and maps combined.',
    type: 'choice',
    options: [
      { value: 'low', label: 'Light', hint: 'Under 5GB — mostly texting & calls' },
      { value: 'medium', label: 'Moderate', hint: '5–20GB — social media & some streaming' },
      { value: 'high', label: 'Heavy', hint: '20GB+ — daily streaming, gaming, hotspot' },
    ],
  },
  {
    key: 'callingNeed',
    icon: PhoneCall,
    title: 'How much do you talk on calls?',
    subtitle: 'Include work calls, family calls, and customer support.',
    type: 'choice',
    options: [
      { value: 'low', label: 'Light', hint: 'Under 150 mins — mostly messaging' },
      { value: 'medium', label: 'Moderate', hint: '150–600 mins — regular calls' },
      { value: 'high', label: 'Heavy', hint: '600+ mins — calls are your main channel' },
    ],
  },
  {
    key: 'smsNeed',
    icon: MessageSquare,
    title: 'How often do you send SMS text messages?',
    subtitle: 'OTPs and app notifications count too.',
    type: 'choice',
    options: [
      { value: 'low', label: 'Rarely', hint: 'A handful a month' },
      { value: 'medium', label: 'Sometimes', hint: 'A few a day' },
      { value: 'high', label: 'Often', hint: 'Texting is a daily habit' },
    ],
  },
  {
    key: 'budget',
    icon: Wallet,
    title: "What's a comfortable monthly budget?",
    subtitle: 'Drag to set the most you\'d like to pay per month.',
    type: 'slider',
    min: 99,
    max: 1999,
    step: 10,
    default: 649,
  },
  {
    key: 'roamingRequired',
    icon: Globe2,
    title: 'Do you need roaming coverage?',
    subtitle: 'Domestic travel or international trips.',
    type: 'toggle',
    options: [
      { value: true, label: 'Yes, I travel often', hint: 'Domestic or international roaming matters to me' },
      { value: false, label: 'No, I mostly stay local', hint: "I rarely need coverage outside my home circle" },
    ],
  },
  {
    key: 'familyOrIndividual',
    icon: Users,
    title: 'Is this plan for you, or the whole family?',
    subtitle: 'This helps us prioritize shared-data and multi-line plans.',
    type: 'choice',
    options: [
      { value: 'individual', label: 'Just me', hint: 'A single-line personal plan' },
      { value: 'family', label: 'Family', hint: 'Shared data or multiple connections' },
    ],
  },
];

export const NEED_TO_GB = { low: 3, medium: 12, high: 35 };
export const NEED_TO_MIN = { low: 150, medium: 500, high: 1200 };
