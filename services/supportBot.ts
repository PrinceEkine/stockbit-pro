/**
 * Offline fallback brain for StockBot (landing-page support chat).
 *
 * When the AI gateway is unreachable or not configured yet, the chat still
 * answers the questions visitors actually ask, using the same facts as the
 * live system prompt. Pure functions — safe to unit test.
 */

export const SUPPORT_CONTACT = {
  call: '07010698264',
  whatsapp: '07072127949',
  whatsappLink: 'https://wa.me/2347072127949',
} as const;

const CONTACT_LINE = `You can reach our team on ${SUPPORT_CONTACT.call} (calls) or WhatsApp ${SUPPORT_CONTACT.whatsapp}.`;

interface FaqRule {
  match: RegExp;
  answer: string;
}

const FAQ_RULES: FaqRule[] = [
  {
    // First: "Is barcode scanning supported?" contains "support", so scanning
    // questions must win over the contact rule below.
    match: /(barcode|scan|scanner|phone scann|smartphone|\bqr\b|strict sensor)/,
    answer:
      'Yes. StockBit turns any smartphone into a barcode scanner, so you can add products and ring up sales with your phone camera. No extra hardware needed.',
  },
  {
    // Word boundaries so "supported" or "smartphone" don't route here.
    match: /(human|agent|\bsupports?\b|\bcontact\b|\bphone\b|\bnumber\b|\bcall\b|whatsapp|helpline|help\s*line|talk to)/,
    answer:
      `You can reach StockBit support directly: call ${SUPPORT_CONTACT.call} any time, or chat with us on WhatsApp at ${SUPPORT_CONTACT.whatsapp}. We are happy to help with your shop.`,
  },
  {
    match: /(trial|free|how long|expire|60|two months|2 months|test)/,
    answer:
      'Every new shop gets a free 60-day trial with no payment required. After the trial, pick a plan to keep managing your shop, inventory and team.',
  },
  {
    match: /(price|pricing|plan|cost|how much|pay|subscription|package|enterprise|business|entry|beta|mega)/,
    answer:
      'StockBit Pro has three monthly plans, paid securely with Paystack: Entry ₦5,000 for starting vendors, Business ₦7,999 for growing retail stores, and Enterprise ₦12,999 for chains and large hubs. Annual billing saves 15%.',
  },
  {
    match: /(photo|picture|camera|extract|smart extractor|metadata|add product)/,
    answer:
      'Yes. Smart Extractor reads product photos and fills in details like the name, SKU and price for you, so adding stock takes seconds.',
  },
  {
    match: /(jumia|konga|marketplace|online store|sync|multi-channel|multichannel|ecommerce|e-commerce)/,
    answer:
      'Yes. The Business and Enterprise plans sync your inventory with Jumia Mall and Konga, so online orders deduct from your shop stock automatically.',
  },
  {
    match: /(staff|team|employee|invite|join|member|workforce|seat)/,
    answer:
      'Your boss sends you an invite code or link, and you join as staff with the code on the sign-up screen. Staff use the sales terminal while the owner keeps control of reports, pricing and billing. Entry allows 3 team members, Business 8, and Enterprise is unlimited.',
  },
  {
    match: /(sign up|signup|register|create account|account|login|sign in|password|email)/,
    answer:
      'Tap Start, then sign up with your name, business name, email and password. No phone number is needed. If you were invited by your boss, choose Join as staff and enter your invite code.',
  },
  {
    match: /(sustainab|eco|green|audit|mega pro)/,
    answer:
      'The Enterprise plan includes a Sustainability Audit that gives eco-scores to your inventory, plus multi-store control, API access and priority support.',
  },
  {
    match: /(offline|internet|network|data|connection|sync|backup|cloud|lose.*phone)/,
    answer:
      'Your records sync to the cloud, so they are safe even if you lose your phone. The app also shows whether you are online, and your shop data stays backed up.',
  },
  {
    match: /(language|yoruba|hausa|igbo|french|translate)/,
    answer:
      'StockBit Pro works in English, Yoruba, Hausa and Igbo. Use the language switcher at the top of the page to change it.',
  },
  {
    match: /(receipt|print|pos|sell|sales|invoice)/,
    answer:
      'Yes. Record sales in seconds at the point of sale and print professional receipts for your customers, with every sale tracked in your reports.',
  },
  {
    match: /(report|analytic|profit|loss|insight|forecast)/,
    answer:
      'Yes. See your profit and loss at a glance, and the Business plan and above add AI reports and inventory forecasting built for Nigerian retail.',
  },
  {
    match: /(what is stockbit|about|what.*do|feature|benefit|why)/,
    answer:
      'StockBit Pro is an inventory and point-of-sale app built for Nigerian retailers. It tracks your stock, records every sale, manages staff, and backs everything up to the cloud — starting with a free 60-day trial.',
  },
  {
    match: /^(hi|hello|hey|good (morning|afternoon|evening)|yo|how far|bawo|kedu|sannu)\b/,
    answer:
      'Hello, and welcome to StockBit Pro. Ask me about the free trial, plans, barcode scanning, or anything else about managing your shop.',
  },
];

const normalize = (input: string): string =>
  input.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Returns a locally-authored answer for common support questions, or null
 * when the question needs the live AI. Never returns null for empty input —
 * callers should guard that first.
 */
export const answerSupportOffline = (question: string): string | null => {
  const text = normalize(question);
  if (!text) return null;
  for (const rule of FAQ_RULES) {
    if (rule.match.test(text)) return rule.answer;
  }
  return null;
};

/**
 * Final safety net when the AI is unreachable and no FAQ rule matched:
 * a helpful reply that always includes the support contact.
 */
export const buildOfflineFallback = (): string =>
  `I cannot reach my AI service right now, but I can still help with basics like the free trial, plans, barcode scanning and staff invites. For anything else, ${CONTACT_LINE.charAt(0).toLowerCase() + CONTACT_LINE.slice(1)}`;
