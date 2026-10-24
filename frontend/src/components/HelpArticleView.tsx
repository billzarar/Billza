import React, { useState } from 'react';
import { ChevronLeft, Info, MessageSquare, Check } from 'lucide-react';
import { HelpArticle, HELP_ARTICLES } from '../data/helpArticlesData';

interface HelpArticleViewProps {
  article: HelpArticle;
  onBackToHelp: () => void;
  onSelectArticle: (articleId: string) => void;
  onOpenContactSupport: () => void;
  onTriggerToast: (msg: string) => void;
}

export const HelpArticleView: React.FC<HelpArticleViewProps> = ({
  article,
  onBackToHelp,
  onSelectArticle,
  onOpenContactSupport,
  onTriggerToast,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  const handleFeedback = (type: 'yes' | 'no') => {
    setFeedbackGiven(type);
    if (type === 'yes') {
      onTriggerToast('Thanks for your feedback!');
    } else {
      onTriggerToast('Feedback recorded. We are continuously improving our guides.');
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[28px] animate-in fade-in duration-200">
      {/* 1. Breadcrumb: < Help / Category (1128px x 20px) */}
      <div className="w-full max-w-[1128px] flex items-center gap-[8px] select-none">
        <button
          type="button"
          onClick={onBackToHelp}
          className="inline-flex items-center gap-[4px] font-onest font-bold text-[14px] leading-[20px] text-[#2F4FBF] hover:underline cursor-pointer group"
        >
          <ChevronLeft
            size={18}
            strokeWidth={2.4}
            className="text-[#2F4FBF] group-hover:-translate-x-0.5 transition-transform"
          />
          <span>Help</span>
        </button>

        <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#B7C2D9]">
          /
        </span>

        <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
          {article.category}
        </span>
      </div>

      {/* 2. Main Two-Column Frame (1128px wide, 24px gap) */}
      <div className="w-full max-w-[1128px] flex flex-col lg:flex-row items-start gap-[24px]">
        {/* Left Card: Article Content (760px desktop) */}
        <article className="w-full lg:w-[760px] bg-white border border-[#DDE2EC] rounded-[12px] p-6 sm:p-[37px_41px] flex flex-col gap-[20px] shadow-xs shrink-0">
          {/* Header */}
          <div className="flex flex-col items-start gap-[8.5px] w-full">
            <h1 className="font-onest font-extrabold text-[28px] sm:text-[40px] leading-[34px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
              {article.title}
            </h1>

            <p className="font-onest font-medium text-[16px] sm:text-[18px] leading-[26px] sm:leading-[28px] text-[#4A5675]">
              {article.lead}
            </p>

            <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
              {article.updatedText} · {article.readTime}
            </span>
          </div>

          {/* Section 1: The usual reasons */}
          <section className="flex flex-col items-start gap-[10.5px] w-full">
            <h2 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
              {article.usualReasonsHeading}
            </h2>

            <ul className="flex flex-col gap-[8px] pl-[20px] list-disc marker:text-[#4164D9] w-full">
              {article.reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="font-onest text-[16px] leading-[24px] text-[#0B1530]"
                >
                  <strong className="font-bold">{reason.bold}</strong>
                  {reason.normal && (
                    <span className="font-normal text-[#4A5675]">{reason.normal}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: How to fix it (Numbered Steps) */}
          <section className="flex flex-col items-start gap-[14.5px] w-full">
            <h2 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
              {article.howToFixHeading}
            </h2>

            <div className="flex flex-col gap-[16px] w-full">
              {article.steps.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-row items-start gap-[14px] w-full"
                >
                  {/* Circular step badge (28px x 28px navy) */}
                  <div className="w-[28px] h-[28px] rounded-full bg-[#0B1530] flex items-center justify-center shrink-0">
                    <span className="font-onest font-bold text-[14px] leading-[20px] text-white">
                      {step.number}
                    </span>
                  </div>

                  {/* Step text */}
                  <div className="flex flex-col items-start gap-[2px] flex-1">
                    <h3 className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530]">
                      {step.title}
                    </h3>
                    <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Note Callout Banner (676px x 38px, bg #F3F6FE, border #C9D4F7) */}
          <div className="w-full bg-[#F3F6FE] border border-[#C9D4F7] rounded-[10px] p-[11px_13px] flex items-center gap-[8px]">
            <Info size={16} strokeWidth={2.2} className="text-[#2F4FBF] shrink-0" />
            <span className="font-onest font-medium text-[12px] leading-[16px] text-[#0B1530]">
              {article.calloutText}
            </span>
          </div>

          {/* Feedback Row */}
          <div className="w-full border-t border-[#EEF1F6] pt-[17px] flex items-center justify-between">
            <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
              Was this helpful?
            </span>

            {feedbackGiven ? (
              <div className="flex items-center gap-[6px] text-[#1B7A4B] font-onest font-bold text-[14px] animate-in fade-in">
                <Check size={16} strokeWidth={2.5} />
                <span>
                  {feedbackGiven === 'yes' ? 'Thank you!' : 'Feedback received'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => handleFeedback('yes')}
                  className="h-[39px] px-[15px] bg-white hover:bg-[#F3F5F9] active:scale-98 border border-[#DDE2EC] hover:border-[#4164D9] rounded-[10px] font-onest font-bold text-[14px] leading-[20px] text-[#0B1530] transition-all cursor-pointer shadow-2xs"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback('no')}
                  className="h-[39px] px-[15px] bg-white hover:bg-[#F3F5F9] active:scale-98 border border-[#DDE2EC] hover:border-[#D2453A] rounded-[10px] font-onest font-bold text-[14px] leading-[20px] text-[#0B1530] transition-all cursor-pointer shadow-2xs"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Right Sidebar (300px desktop) */}
        <aside className="w-full lg:w-[300px] flex flex-col gap-[16px] shrink-0">
          {/* Card 1: Related (300px x 152px) */}
          <div className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[21px] flex flex-col gap-[10px] shadow-xs">
            <h4 className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
              Related
            </h4>

            <div className="flex flex-col gap-[10px]">
              {article.relatedArticleIds.map((relId) => {
                const relArticle = HELP_ARTICLES[relId];
                if (!relArticle) return null;
                return (
                  <button
                    key={relId}
                    type="button"
                    onClick={() => {
                      onSelectArticle(relId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="font-onest font-semibold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#1A338B] transition-colors cursor-pointer text-left block"
                  >
                    {relArticle.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Still stuck? (300px x 150px, Navy #0B1530) */}
          <div className="w-full bg-[#0B1530] rounded-[12px] p-[18px_16px] flex flex-col gap-[16px] shadow-md">
            <div className="flex items-center gap-[14px]">
              <div className="w-[44px] h-[44px] rounded-[12px] bg-white/10 flex items-center justify-center shrink-0">
                <MessageSquare size={20} strokeWidth={2} className="text-white" />
              </div>

              <div className="flex flex-col gap-[2.5px]">
                <h5 className="font-onest font-bold text-[16px] leading-[20px] text-white">
                  Still stuck?
                </h5>
                <p className="font-onest font-medium text-[12px] leading-[16px] text-[#A9B4CC]">
                  Write to us. We reply within 1 working day.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenContactSupport}
              className="w-full sm:w-[163px] h-[44px] px-[18px] bg-white hover:bg-[#F3F5F9] active:scale-98 rounded-[10px] font-onest font-bold text-[16px] leading-[24px] text-[#0B1530] transition-all cursor-pointer text-center inline-flex items-center justify-center"
            >
              Contact support
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
