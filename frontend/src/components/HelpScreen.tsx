import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Zap,
  Coins,
  Receipt,
  Bell,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageSquare,
  HelpCircle,
  Mail,
  Send,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { HelpArticleView } from './HelpArticleView';
import { HELP_ARTICLES, HelpArticle } from '../data/helpArticlesData';

interface HelpScreenProps {
  onTriggerToast: (msg: string) => void;
  onNavigateToBills?: () => void;
  onOpenWalletModal?: () => void;
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  articlesCount: number;
  icon: 'book' | 'zap' | 'coins' | 'receipt' | 'bell' | 'currency';
  articles: { title: string; excerpt: string; articleId?: string }[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'topic-getting-started',
    title: 'Getting started',
    description: 'Add a bill, connect a wallet, set reminders',
    articlesCount: 6,
    icon: 'book',
    articles: [
      {
        title: 'How to add your first recurring bill',
        excerpt: 'Choose between Stellar automated bills and manually tracked bank utilities in less than two minutes.',
      },
      {
        title: 'Connecting Freighter or Albedo wallet',
        excerpt: 'Authorize Billza in one click without exposing your private recovery seed.',
      },
      {
        title: 'Configuring reminder timing and channels',
        excerpt: 'Set up push alerts and email dispatches to never miss a due date.',
      },
      {
        title: 'Understanding the Billza overview dashboard',
        excerpt: 'Navigate monthly expenses, category shares, and upcoming deadlines.',
      },
      {
        title: 'Editing and pausing recurring schedules',
        excerpt: 'Adjust billing frequencies, due dates, and provider recipient keys anytime.',
      },
      {
        title: 'Managing household vs personal billing profiles',
        excerpt: 'Organize personal and business expenses with distinct tagging and receipt exports.',
      },
    ],
  },
  {
    id: 'topic-stellar-payments',
    title: 'Paying with Stellar',
    description: 'Approving in Freighter, fees, receipts',
    articlesCount: 7,
    icon: 'zap',
    articles: [
      {
        title: 'Why did my payment fail?',
        excerpt: 'When a payment fails, no money moves. Learn the common causes and 4 quick steps to fix it.',
        articleId: 'why-payment-failed',
      },
      {
        title: 'How Stellar bill payments execute',
        excerpt: 'Understand ledger operations, Horizon checks, and memo attachments.',
      },
      {
        title: 'Network transaction fees on Stellar',
        excerpt: 'Why network fees on Stellar cost only 0.00001 XLM (fractions of a cent).',
        articleId: 'network-fees',
      },
      {
        title: 'Verifying receipts on Stellar Expert',
        excerpt: 'Locate transaction hashes and cryptographic proof of payment.',
      },
      {
        title: 'Understanding transaction memos and bill references',
        excerpt: 'How bill reference numbers ensure providers match payments to your account.',
      },
      {
        title: 'Approving transactions in browser extensions',
        excerpt: 'Reviewing sign requests in Freighter and ensuring correct asset selection.',
      },
      {
        title: 'Downloading official PDF payment receipts',
        excerpt: 'Exporting audit-ready receipts with ledger sequence and provider details.',
      },
    ],
  },
  {
    id: 'topic-testnet',
    title: 'Testnet and test money',
    description: 'What Testnet is and how to get test XLM',
    articlesCount: 4,
    icon: 'coins',
    articles: [
      {
        title: 'What is the XLM reserve?',
        excerpt: 'Why every Stellar account keeps 1 XLM base reserve plus 0.5 XLM per active asset trustline.',
        articleId: 'xlm-reserve',
      },
      {
        title: 'How do I get test USDC?',
        excerpt: 'Setting up the USDC trustline and claiming mock digital dollars from Circle’s test faucet.',
        articleId: 'test-usdc',
      },
      {
        title: 'What is Stellar Testnet?',
        excerpt: 'A complete sandbox environment mirroring public Stellar mainnet without financial risk.',
      },
      {
        title: 'Periodic Testnet ledger resets',
        excerpt: 'Understanding testnet cadence and how to re-fund test accounts if balances reset.',
      },
    ],
  },
  {
    id: 'topic-manual-bills',
    title: 'Bills you pay yourself',
    description: 'Marking paid, editing and removing records',
    articlesCount: 4,
    icon: 'receipt',
    articles: [
      {
        title: 'Marking a bill as paid',
        excerpt: 'Keep your monthly expenses chart accurate with one-click payment logging.',
        articleId: 'marking-bill-paid',
      },
      {
        title: 'Tracking direct debits and SEPA utilities',
        excerpt: 'Log municipal water, rent, and local bills you settle in your banking app.',
      },
      {
        title: 'Adding bank transfer reference notes',
        excerpt: 'Save payment confirmation codes and transfer timestamps for future reference.',
      },
      {
        title: 'Converting a manual bill to automated Stellar payments',
        excerpt: 'Switch providers to Stellar addresses when they support crypto payments.',
      },
    ],
  },
  {
    id: 'topic-reminders',
    title: 'Reminders',
    description: 'Timing, channels, overdue reminders',
    articlesCount: 5,
    icon: 'bell',
    articles: [
      {
        title: 'How reminder notifications work',
        excerpt: 'Receive scheduled alerts 3 days, 1 day, and on due date at 8:00 am WAT.',
      },
      {
        title: 'Overdue follow-up cadences',
        excerpt: 'Configure retry reminders every day, every 2 days, or every 3 days for late bills.',
      },
      {
        title: 'Low wallet balance alerts',
        excerpt: 'Get notified in advance when your Stellar wallet balance is below upcoming bills.',
      },
      {
        title: 'Customizing reminders per bill',
        excerpt: 'Override global defaults for critical bills like rent or tuition.',
      },
      {
        title: 'Managing email delivery preferences',
        excerpt: 'Ensure bill reminders reach your inbox and bypass spam filters.',
      },
    ],
  },
  {
    id: 'topic-currencies',
    title: 'Currencies',
    description: 'USDC, XLM, EUR and why totals stay separate',
    articlesCount: 3,
    icon: 'currency',
    articles: [
      {
        title: 'Why Billza does not convert currencies together',
        excerpt: 'Avoid volatile crypto conversion distortion by keeping token totals distinct.',
      },
      {
        title: 'Setting your primary preferred currency',
        excerpt: 'Choose USDC, XLM, or EUR as your default for new recurring obligations.',
      },
      {
        title: 'Adding multicurrency obligations',
        excerpt: 'Pay digital subscriptions in USDC while budgeting local expenses in EUR.',
      },
    ],
  },
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  articleId?: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Can Billza pay my electricity or water company directly?',
    answer:
      'No. Billza sends Stellar payments to the Stellar address your provider gives you, or reminds you to pay bills yourself in your bank or provider portal. Billza is not a bank and does not touch fiat bank rails directly.',
  },
  {
    id: 'faq-2',
    question: 'Is this real money?',
    answer:
      'No. Billza runs entirely on the Stellar Testnet. You use test XLM and test USDC from the Stellar Friendbot test faucet. No real money or bank accounts are touched.',
  },
  {
    id: 'faq-3',
    question: 'Why did my payment fail?',
    answer:
      'When a payment fails, no money moves. The most common cause is a wallet balance short of the bill amount plus Stellar network fee and base reserve (~1.50 XLM). Check your wallet holdings in Settings → Stellar wallet.',
    articleId: 'why-payment-failed',
  },
  {
    id: 'faq-4',
    question: 'Why are my totals split by currency?',
    answer:
      'Stellar bills are denominated in native XLM or USDC, while manual bills may be in EUR or local fiat. Billza keeps them distinct so you always know your exact token requirements without volatile conversion rate distortion.',
  },
  {
    id: 'faq-5',
    question: 'What does “Verifying” mean?',
    answer:
      'When a transaction is submitted to Stellar Horizon, it takes 3–5 seconds to close into a ledger block. "Verifying" indicates Billza is checking the Horizon consensus sequence before marking it confirmed.',
  },
];

export const HelpScreen: React.FC<HelpScreenProps> = ({
  onTriggerToast,
  onNavigateToBills,
  onOpenWalletModal,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-3');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('Payment question');

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return HELP_TOPICS;
    const q = searchQuery.toLowerCase();
    return HELP_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.articles.some((a) => a.title.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Filter FAQs based on search
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleToggleFaq = (faqId: string) => {
    setExpandedFaqId((prev) => (prev === faqId ? null : faqId));
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      onTriggerToast('Please write a message before sending');
      return;
    }
    setIsContactSupportOpen(false);
    setSupportMessage('');
    onTriggerToast('Support ticket submitted. We will reply to your email within 1 working day.');
  };

  const handleOpenArticle = (articleId: string) => {
    setSelectedTopic(null);
    setSelectedArticleId(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTopicIcon = (type: HelpTopic['icon']) => {
    switch (type) {
      case 'book':
        return <BookOpen size={18} strokeWidth={2} className="text-[#0B1530]" />;
      case 'zap':
        return <Zap size={18} strokeWidth={2} className="text-[#0B1530]" />;
      case 'coins':
        return <Coins size={18} strokeWidth={2} className="text-[#0B1530]" />;
      case 'receipt':
        return <Receipt size={18} strokeWidth={2} className="text-[#0B1530]" />;
      case 'bell':
        return <Bell size={18} strokeWidth={2} className="text-[#0B1530]" />;
      case 'currency':
        return <DollarSign size={18} strokeWidth={2} className="text-[#0B1530]" />;
      default:
        return <HelpCircle size={18} strokeWidth={2} className="text-[#0B1530]" />;
    }
  };

  // If an article is currently selected, render the dedicated HelpArticleView
  if (selectedArticleId) {
    const activeArticle: HelpArticle =
      HELP_ARTICLES[selectedArticleId] || HELP_ARTICLES['why-payment-failed'];

    return (
      <>
        <HelpArticleView
          article={activeArticle}
          onBackToHelp={() => {
            setSelectedArticleId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectArticle={(id) => {
            setSelectedArticleId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenContactSupport={() => setIsContactSupportOpen(true)}
          onTriggerToast={onTriggerToast}
        />

        {/* Contact Support Modal */}
        {isContactSupportOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/75 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsContactSupportOpen(false)}
          >
            <div
              className="w-full max-w-[480px] bg-white rounded-[16px] border border-[#DDE2EC] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-[#EEF1F6] flex items-center justify-between bg-[#F8F9FC]">
                <div className="flex items-center gap-2.5">
                  <Mail size={20} className="text-[#0B1530]" />
                  <h3 className="font-onest font-bold text-[18px] text-[#0B1530]">
                    Contact Billza Support
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactSupportOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendSupport} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0B1530]">Subject</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="h-[42px] px-3 border border-[#DDE2EC] rounded-[8px] text-[14px] text-[#0B1530] bg-white"
                  >
                    <option value="Payment question">Payment / Stellar transaction question</option>
                    <option value="Wallet connection">Wallet connection or Friendbot funding</option>
                    <option value="Reminder configuration">Reminder timing or email deliverability</option>
                    <option value="Feature suggestion">Feature request or feedback</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#0B1530]">Your message</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Tell us what you're experiencing or what question you have..."
                    className="p-3 border border-[#DDE2EC] rounded-[8px] text-[14px] text-[#0B1530] resize-none focus:outline-hidden focus:border-[#4164D9]"
                    required
                  />
                </div>

                <div className="p-3 bg-[#F3F5F9] rounded-[8px] flex items-center gap-2 text-[12px] text-[#4A5675]">
                  <ShieldCheck size={16} className="text-[#1B7A4B] shrink-0" />
                  <span>Replies will be sent to amara.okafor@gmail.com</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactSupportOpen(false)}
                    className="h-[40px] px-4 border border-[#DDE2EC] text-[#4A5675] text-[13px] font-bold rounded-[8px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-[40px] px-5 bg-[#0B1530] hover:bg-[#1A2A55] text-white text-[13px] font-bold rounded-[8px] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Send message</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full flex flex-col items-start gap-[28px]">
      {/* 1. Header Frame: Title, Subtitle, and Search bar (560px x 52px) */}
      <div className="w-full flex flex-col items-start gap-[14.5px]">
        <div className="flex flex-col items-start gap-[8.5px]">
          <h1 className="font-onest font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
            Help
          </h1>
          <p className="font-onest font-medium text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
            Answers about bills, reminders and paying on Stellar
          </p>
        </div>

        {/* Search input (560px x 52px) */}
        <div className="relative w-full max-w-[560px]">
          <Search
            size={18}
            strokeWidth={1.8}
            className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#4A5675]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help, e.g. “failed payment”"
            className="w-full h-[52px] pl-[44px] pr-[36px] bg-white border border-[#DDE2EC] rounded-[10px] font-onest text-[16px] text-[#0B1530] placeholder-[#757575] focus:outline-hidden focus:border-[#4164D9] focus:ring-2 focus:ring-[#4164D9]/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#0B1530]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Instant Search Result matching article */}
        {searchQuery.trim() && (
          <div className="w-full max-w-[560px] bg-white border border-[#DDE2EC] rounded-[10px] p-3 shadow-md flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#4A5675]">Suggested article:</span>
            <button
              type="button"
              onClick={() => handleOpenArticle('why-payment-failed')}
              className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#F3F6FE] text-left transition-colors group"
            >
              <div>
                <span className="font-onest font-bold text-[14px] text-[#0B1530] group-hover:text-[#4164D9]">
                  Why did my payment fail?
                </span>
                <p className="font-onest text-[12px] text-[#4A5675]">
                  4 steps to check reserves, Freighter approvals, and retry.
                </p>
              </div>
              <ArrowRight size={16} className="text-[#A9B4CC] group-hover:text-[#4164D9]" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Help Topics Grid: 2 rows of 3 columns (365.25px x 162px each, 1128px wide) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => setSelectedTopic(topic)}
            className="bg-white border border-[#DDE2EC] hover:border-[#4164D9] hover:shadow-md rounded-[12px] p-[21px] flex flex-col items-start gap-[10px] cursor-pointer transition-all duration-200 select-none group"
          >
            {/* Topic Icon Container (40px x 40px) */}
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0 group-hover:bg-[#E6ECFB] transition-colors">
              {renderTopicIcon(topic.icon)}
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-[4.5px] min-w-0">
              <h3 className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530] group-hover:text-[#4164D9] transition-colors">
                {topic.title}
              </h3>
              <p className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675] line-clamp-2">
                {topic.description}
              </p>
            </div>

            {/* Articles Count Badge Link */}
            <span className="font-onest font-bold text-[12px] leading-[16px] text-[#2F4FBF] group-hover:underline mt-auto">
              {topic.articlesCount} articles
            </span>
          </div>
        ))}
      </div>

      {/* 3. Section: Common Questions (Accordion FAQs, 1128px wide) */}
      <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[25px_29px_9px] flex flex-col gap-[16px] shadow-xs">
        <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
          Common questions
        </h3>

        <div className="w-full flex flex-col">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="w-full border-t border-[#EEF1F6] first:border-t-0 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => handleToggleFaq(faq.id)}
                  className="w-full flex items-center justify-between py-[16px] text-left cursor-pointer group"
                >
                  <span className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530] group-hover:text-[#4164D9] transition-colors pr-4">
                    {faq.question}
                  </span>
                  <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-[#4A5675] group-hover:text-[#0B1530]">
                    {isExpanded ? (
                      <ChevronUp size={18} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={18} strokeWidth={2} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="pb-[18px] text-[#4A5675] font-onest font-normal text-[16px] leading-[24px] max-w-[800px] animate-in fade-in duration-150 flex flex-col gap-3">
                    <p>{faq.answer}</p>
                    {faq.articleId && (
                      <button
                        type="button"
                        onClick={() => handleOpenArticle(faq.articleId!)}
                        className="inline-flex items-center gap-1.5 font-onest font-bold text-[14px] text-[#2F4FBF] hover:underline self-start cursor-pointer"
                      >
                        <span>Read full guide & 4-step fix</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Section: What Billza can and can't do (1128px x 234px) */}
      <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[25px_29px] flex flex-col gap-[16.5px] shadow-xs">
        <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
          What Billza can and can’t do
        </h3>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          {/* Column 1: Billza can */}
          <div className="flex flex-col items-start gap-[10px]">
            <span className="font-onest font-bold text-[14px] leading-[20px] text-[#1B7A4B]">
              Billza can
            </span>

            {[
              'Remind you before bills are due, by email and in-app',
              'Pay a bill’s Stellar address from your own wallet',
              'Check each payment on the Stellar ledger record',
              'Keep records of bills you pay yourself',
            ].map((item) => (
              <div key={item} className="flex items-center gap-[8px]">
                <div className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={2.5} className="text-[#1B7A4B]" />
                </div>
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Column 2: Billza can't */}
          <div className="flex flex-col items-start gap-[10px]">
            <span className="font-onest font-bold text-[14px] leading-[20px] text-[#B42318]">
              Billza can’t
            </span>

            {[
              'Pay utility companies or banks directly with fiat',
              'Hold your money or see your secret key',
              'Convert between USDC, XLM and EUR',
              'Move real money while on Testnet',
            ].map((item) => (
              <div key={item} className="flex items-center gap-[8px]">
                <div className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
                  <X size={14} strokeWidth={2.5} className="text-[#B42318]" />
                </div>
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Section: Still stuck? Banner (1128px x 92px, Navy #0B1530) */}
      <section className="w-full bg-[#0B1530] rounded-[12px] p-[24px_28px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
        <div className="flex items-center gap-[14px]">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-white/10 flex items-center justify-center shrink-0">
            <MessageSquare size={20} strokeWidth={2} className="text-white" />
          </div>

          <div className="flex flex-col gap-[2.5px]">
            <h4 className="font-onest font-bold text-[16px] leading-[20px] text-white">
              Still stuck?
            </h4>
            <p className="font-onest font-medium text-[12px] leading-[16px] text-[#A9B4CC]">
              Write to us. We reply within 1 working day.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsContactSupportOpen(true)}
          className="inline-flex items-center justify-center px-[18px] h-[44px] bg-white hover:bg-[#F3F5F9] active:scale-98 rounded-[10px] font-onest font-bold text-[16px] leading-[24px] text-[#0B1530] transition-all cursor-pointer select-none shrink-0"
        >
          Contact support
        </button>
      </section>

      {/* Modal 1: Topic Articles Drawer/Modal */}
      {selectedTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTopic(null)}
        >
          <div
            className="w-full max-w-[560px] bg-white rounded-[16px] border border-[#DDE2EC] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#EEF1F6] flex items-center justify-between bg-[#F8F9FC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#EEF1F6] flex items-center justify-center">
                  {renderTopicIcon(selectedTopic.icon)}
                </div>
                <div>
                  <h3 className="font-onest font-bold text-[18px] text-[#0B1530]">
                    {selectedTopic.title}
                  </h3>
                  <span className="text-[12px] text-[#4A5675]">
                    {selectedTopic.articlesCount} help articles
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Articles List */}
            <div className="p-6 overflow-y-auto flex flex-col gap-3">
              {selectedTopic.articles.map((art, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[10px] border border-[#EEF1F6] hover:border-[#4164D9] hover:bg-[#F8F9FC] transition-colors cursor-pointer group flex flex-col gap-1.5"
                  onClick={() => {
                    const articleId =
                      art.articleId ||
                      (art.title.toLowerCase().includes('fail')
                        ? 'why-payment-failed'
                        : art.title.toLowerCase().includes('reserve')
                        ? 'xlm-reserve'
                        : art.title.toLowerCase().includes('usdc')
                        ? 'test-usdc'
                        : art.title.toLowerCase().includes('mark')
                        ? 'marking-bill-paid'
                        : art.title.toLowerCase().includes('fee')
                        ? 'network-fees'
                        : 'why-payment-failed');
                    handleOpenArticle(articleId);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px] text-[#0B1530] group-hover:text-[#4164D9]">
                      {art.title}
                    </h4>
                    <ArrowRight size={14} className="text-[#A9B4CC] group-hover:text-[#4164D9]" />
                  </div>
                  <p className="text-[12px] text-[#4A5675] leading-[18px]">
                    {art.excerpt}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#EEF1F6] bg-[#F8F9FC] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="h-[38px] px-4 bg-white border border-[#DDE2EC] text-[#0B1530] text-[13px] font-bold rounded-[8px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Contact Support Dialog */}
      {isContactSupportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsContactSupportOpen(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-[16px] border border-[#DDE2EC] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#EEF1F6] flex items-center justify-between bg-[#F8F9FC]">
              <div className="flex items-center gap-2.5">
                <Mail size={20} className="text-[#0B1530]" />
                <h3 className="font-onest font-bold text-[18px] text-[#0B1530]">
                  Contact Billza Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContactSupportOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendSupport} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0B1530]">Subject</label>
                <select
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="h-[42px] px-3 border border-[#DDE2EC] rounded-[8px] text-[14px] text-[#0B1530] bg-white"
                >
                  <option value="Payment question">Payment / Stellar transaction question</option>
                  <option value="Wallet connection">Wallet connection or Friendbot funding</option>
                  <option value="Reminder configuration">Reminder timing or email deliverability</option>
                  <option value="Feature suggestion">Feature request or feedback</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0B1530]">Your message</label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Tell us what you're experiencing or what question you have..."
                  className="p-3 border border-[#DDE2EC] rounded-[8px] text-[14px] text-[#0B1530] resize-none focus:outline-hidden focus:border-[#4164D9]"
                  required
                />
              </div>

              <div className="p-3 bg-[#F3F5F9] rounded-[8px] flex items-center gap-2 text-[12px] text-[#4A5675]">
                <ShieldCheck size={16} className="text-[#1B7A4B] shrink-0" />
                <span>Replies will be sent to amara.okafor@gmail.com</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactSupportOpen(false)}
                  className="h-[40px] px-4 border border-[#DDE2EC] text-[#4A5675] text-[13px] font-bold rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] px-5 bg-[#0B1530] hover:bg-[#1A2A55] text-white text-[13px] font-bold rounded-[8px] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
