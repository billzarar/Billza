export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  lead: string;
  updatedText: string;
  readTime: string;
  usualReasonsHeading: string;
  reasons: {
    bold: string;
    normal?: string;
  }[];
  howToFixHeading: string;
  steps: {
    number: number;
    title: string;
    text: string;
  }[];
  calloutText: string;
  relatedArticleIds: string[];
}

export const HELP_ARTICLES: Record<string, HelpArticle> = {
  'why-payment-failed': {
    id: 'why-payment-failed',
    title: 'Why did my payment fail?',
    category: 'Paying with Stellar',
    lead: 'When a payment fails, no money moves. The most common cause is a wallet balance that was short of the bill amount plus the Stellar network fee and base reserve.',
    updatedText: 'Updated Mon 19 Oct 2026',
    readTime: '2 min read',
    usualReasonsHeading: 'The usual reasons',
    reasons: [
      {
        bold: 'Not enough in the wallet.',
        normal: ' The most common cause is missing the base reserve of 1 XLM or trustline minimums.',
      },
      {
        bold: 'You declined it in Freighter, or the app timed out.',
      },
      {
        bold: 'The network was busy. Rare on Testnet; try again.',
      },
    ],
    howToFixHeading: 'How to fix it',
    steps: [
      {
        number: 1,
        title: 'Check what your wallet holds',
        text: 'Open Settings → Stellar wallet. Your USDC and XLM balances are shown there.',
      },
      {
        number: 2,
        title: 'Remember the reserve',
        text: 'Stellar keeps 1 XLM in every wallet, plus 0.5 XLM for the USDC trustline. If you have 38.50 USDC, you also need ~1.50 XLM in reserve.',
      },
      {
        number: 3,
        title: 'Add money if you’re short',
        text: 'Send USDC or XLM to your wallet address or use the Testnet friendbot to top up.',
      },
      {
        number: 4,
        title: 'Try again',
        text: 'Open the bill and tap Try again. If you declined in Freighter, approve it this time.',
      },
    ],
    calloutText: 'A failed payment is saved in Payment history with a red badge so you have a record.',
    relatedArticleIds: ['xlm-reserve', 'test-usdc', 'marking-bill-paid'],
  },
  'xlm-reserve': {
    id: 'xlm-reserve',
    title: 'What is the XLM reserve?',
    category: 'Paying with Stellar',
    lead: 'Every Stellar account requires a minimum native XLM balance to prevent network spam and maintain open trustlines for assets like USDC.',
    updatedText: 'Updated Sun 18 Oct 2026',
    readTime: '3 min read',
    usualReasonsHeading: 'How reserves work',
    reasons: [
      {
        bold: 'Base reserve is 1.0 XLM.',
        normal: ' This locks the minimum existence requirement for any active Stellar account.',
      },
      {
        bold: 'Each trustline adds 0.5 XLM.',
        normal: ' Holding USDC or other tokens locks an additional reserve increment.',
      },
      {
        bold: 'Reserve balance is non-spendable.',
        normal: ' Even if your wallet shows 10 XLM, only 8.5 XLM is available for outgoing transfers.',
      },
    ],
    howToFixHeading: 'Managing your reserve',
    steps: [
      {
        number: 1,
        title: 'Review wallet reserves in Settings',
        text: 'Open Settings → Stellar wallet to see your available vs reserved Lumen balances.',
      },
      {
        number: 2,
        title: 'Keep extra XLM buffer',
        text: 'Maintain at least 5–10 XLM above your required reserve to cover network transaction fees smoothly.',
      },
      {
        number: 3,
        title: 'Close unneeded trustlines',
        text: 'Removing zero-balance trustlines unlocks 0.5 XLM back to your spendable pool.',
      },
      {
        number: 4,
        title: 'Top up with Friendbot anytime',
        text: 'Use the Friendbot faucet to receive 10,000 test XLM whenever your sandbox balance dips.',
      },
    ],
    calloutText: 'Reserved XLM is never lost or spent; it unlocks automatically if trustlines are closed.',
    relatedArticleIds: ['why-payment-failed', 'test-usdc', 'network-fees'],
  },
  'test-usdc': {
    id: 'test-usdc',
    title: 'How do I get test USDC?',
    category: 'Testnet and test money',
    lead: 'On Stellar Testnet, test USDC is a mock digital dollar issued by Circle’s test faucet. You can use it to test recurring bill payments with zero financial risk.',
    updatedText: 'Updated Fri 16 Oct 2026',
    readTime: '2 min read',
    usualReasonsHeading: 'Prerequisites for test USDC',
    reasons: [
      {
        bold: 'An active funded Stellar Testnet wallet.',
        normal: ' Your wallet must have at least 1.5 XLM to enable the USDC trustline.',
      },
      {
        bold: 'An authorized USDC trustline.',
        normal: ' Stellar requires explicit approval before an account can receive custom assets.',
      },
      {
        bold: 'Testnet assets are strictly educational.',
        normal: ' They carry zero commercial or cash exchange value.',
      },
    ],
    howToFixHeading: 'Step-by-step USDC setup',
    steps: [
      {
        number: 1,
        title: 'Connect your wallet',
        text: 'Ensure Freighter or Albedo is switched to the Stellar Testnet network.',
      },
      {
        number: 2,
        title: 'Fund with test XLM first',
        text: 'Tap Friendbot in your wallet or Billza settings to receive test Lumens for base reserve.',
      },
      {
        number: 3,
        title: 'Add the test USDC trustline',
        text: 'Approve the USDC asset trustline prompt inside Freighter or Albedo extension.',
      },
      {
        number: 4,
        title: 'Claim 500 test USDC',
        text: 'Use the Circle Testnet faucet to mint 500 test USDC directly to your public G-address.',
      },
    ],
    calloutText: 'Billza automatically verifies your USDC trustline before initiating any bill payment.',
    relatedArticleIds: ['why-payment-failed', 'xlm-reserve', 'marking-bill-paid'],
  },
  'marking-bill-paid': {
    id: 'marking-bill-paid',
    title: 'Marking a bill as paid',
    category: 'Bills you pay yourself',
    lead: 'For utilities or rent paid via your bank app, cash, or standing order, marking them paid keeps your October budget and calendar up to date.',
    updatedText: 'Updated Wed 14 Oct 2026',
    readTime: '2 min read',
    usualReasonsHeading: 'When to mark bills paid manually',
    reasons: [
      {
        bold: 'Bills settled through banking apps.',
        normal: ' Like municipal water, city tax, or SEPA landlord transfers.',
      },
      {
        bold: 'Subscriptions paid via credit card.',
        normal: ' Such as streaming services or mobile plans charged automatically.',
      },
      {
        bold: 'Split household bills settled in person.',
      },
    ],
    howToFixHeading: 'How to mark a bill paid',
    steps: [
      {
        number: 1,
        title: 'Open the Bills tab',
        text: 'Locate the bill card displaying an Overdue or Due Soon status.',
      },
      {
        number: 2,
        title: 'Tap Mark paid',
        text: 'Click the “Mark paid” button on the card or inside the bill detail screen.',
      },
      {
        number: 3,
        title: 'Confirm the settlement date',
        text: 'Select today’s date or the exact day your bank transferred the funds.',
      },
      {
        number: 4,
        title: 'Check Payment history',
        text: 'A manual payment record is generated with a blue “Manual” badge for your monthly audit.',
      },
    ],
    calloutText: 'Marking a bill paid resets its status to upcoming for the following billing cycle.',
    relatedArticleIds: ['why-payment-failed', 'xlm-reserve', 'test-usdc'],
  },
  'network-fees': {
    id: 'network-fees',
    title: 'Network transaction fees on Stellar',
    category: 'Paying with Stellar',
    lead: 'Stellar network fees are among the lowest in blockchain technology, costing a fraction of a cent per bill transaction.',
    updatedText: 'Updated Tue 13 Oct 2026',
    readTime: '1 min read',
    usualReasonsHeading: 'Understanding fee mechanics',
    reasons: [
      {
        bold: 'Base fee is 100 stroops (0.00001 XLM).',
        normal: ' That equates to less than $0.00001 per payment.',
      },
      {
        bold: 'Fees are deducted in XLM, never USDC.',
        normal: ' Always keep a tiny XLM reserve to pay gas.',
      },
      {
        bold: 'Zero priority fee spikes on normal days.',
      },
    ],
    howToFixHeading: 'Best practices for fee management',
    steps: [
      {
        number: 1,
        title: 'Maintain a 5 XLM buffer',
        text: 'This small buffer can fund hundreds of thousands of bill settlements.',
      },
      {
        number: 2,
        title: 'Review the fee in Freighter',
        text: 'Every transaction confirmation displays the exact 0.00001 XLM charge before signing.',
      },
      {
        number: 3,
        title: 'Check your transaction receipt',
        text: 'The receipt modal displays the exact network fee recorded on ledger sequence.',
      },
    ],
    calloutText: 'Billza does not charge any surcharge or platform fee on top of Stellar network fees.',
    relatedArticleIds: ['why-payment-failed', 'xlm-reserve', 'test-usdc'],
  },
};
