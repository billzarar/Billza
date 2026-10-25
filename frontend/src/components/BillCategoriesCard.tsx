import {
  Currency,
  CategoryBreakdownItem,
  BillItem,
} from '../data/initialData';

interface BillCategoriesCardProps {
  currency: Currency;
  bills?: BillItem[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectCurrency: (curr: Currency) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Internet: 'bg-[#77839F]',
  Electricity: 'bg-[#18264e]',
  Subscriptions: 'bg-[#0B1530]',
  Insurance: 'bg-[#2F4FBF]',
  Rent: 'bg-[#4164D9]',
  Water: 'bg-[#2B9460]',
  Education: 'bg-[#B8740A]',
  'Business utilities': 'bg-[#3E517A]',
  'Business Utilities': 'bg-[#3E517A]',
  BUSINESS_UTILITIES: 'bg-[#3E517A]',
  ELECTRICITY: 'bg-[#18264e]',
  INTERNET: 'bg-[#77839F]',
  WATER: 'bg-[#2B9460]',
  RENT: 'bg-[#4164D9]',
  SUBSCRIPTIONS: 'bg-[#0B1530]',
  Other: 'bg-[#94A3B8]',
  OTHER: 'bg-[#94A3B8]',
};

export const BillCategoriesCard: React.FC<BillCategoriesCardProps> = ({
  currency,
  bills = [],
  selectedCategory,
  onSelectCategory,
  onSelectCurrency,
}) => {
  // Compute category breakdown from real live bills
  const currencyBills = bills.filter((b) => b.currency === currency);
  const totalAmount = currencyBills.reduce((sum, b) => sum + b.amount, 0);
  const totalBillsCount = currencyBills.length;

  const categoryGroups = currencyBills.reduce((acc, b) => {
    const cat = b.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = { count: 0, amount: 0 };
    }
    acc[cat].count += 1;
    acc[cat].amount += b.amount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const categories: CategoryBreakdownItem[] = Object.entries(categoryGroups).map(([cat, data]) => ({
    category: cat,
    billsCount: data.count,
    amount: data.amount,
    percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    color: CATEGORY_COLORS[cat] || 'bg-[#4164D9]',
    currency,
  }));

  return (
    <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:px-[29px] sm:pt-[31px] sm:pb-[27px] flex flex-col justify-between gap-[18px]">
      <div className="flex flex-col gap-[18px] w-full">
        {/* Header */}
        <div className="flex flex-col gap-[3.5px]">
          <h2 className="font-extrabold text-[24px] sm:text-[28px] leading-[32px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
            Bill categories
          </h2>
          <p className="font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#4A5675] tabular-nums">
            October, {(totalAmount || 0).toFixed(2)} {currency} across {totalBillsCount}{' '}
            {totalBillsCount === 1 ? 'bill' : 'bills'}
          </p>
        </div>

        {/* Share of October by category bar */}
        <div
          className="flex items-start gap-[2px] w-full h-[14px]"
          role="img"
          aria-label={`Share of October ${currency} by category`}
        >
          {categories.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() =>
                onSelectCategory(selectedCategory === cat.category ? null : cat.category)
              }
              title={`${cat.category}: ${(cat.amount || 0).toFixed(2)} ${currency} (${(cat.percentage || 0).toFixed(1)}%)`}
              style={{
                backgroundColor: cat.color,
                borderColor: cat.borderColor || 'transparent',
                borderWidth: cat.borderColor ? '1px' : '0px',
              }}
              className={`h-[14px] flex-1 rounded-[3px] transition-opacity ${
                selectedCategory && selectedCategory !== cat.category
                  ? 'opacity-40'
                  : 'opacity-100 hover:opacity-90'
              }`}
            />
          ))}
        </div>

        {/* Category Rows */}
        <div className="flex flex-col w-full divide-y divide-[#EEF1F6]/60">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.category)}
                className={`flex items-center justify-between w-full h-[48px] px-1 rounded-[6px] transition-colors text-left ${
                  isSelected ? 'bg-[#EEF1F6]/70' : 'hover:bg-[#F8F9FC]'
                }`}
              >
                {/* Left: Color Square + Name + Bill Count */}
                <div className="flex items-center gap-[10px] min-w-0">
                  <span
                    className="w-[10px] h-[10px] rounded-[2px] shrink-0"
                    style={{
                      backgroundColor: cat.color,
                      borderColor: cat.borderColor || 'transparent',
                      borderWidth: cat.borderColor ? '1px' : '0px',
                    }}
                  />
                  <div className="flex items-baseline gap-[6px] min-w-0">
                    <span className="font-normal text-[16px] leading-[24px] text-[#0B1530] truncate">
                      {cat.category}
                    </span>
                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] whitespace-nowrap shrink-0">
                      {cat.billsCount} {cat.billsCount === 1 ? 'bill' : 'bills'}
                    </span>
                  </div>
                </div>

                {/* Right: Amount + Percentage */}
                <div className="flex items-center shrink-0 tabular-nums">
                  <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    {(cat.amount || 0).toFixed(2)}
                  </span>
                  <span className="w-[56px] text-right font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    {(cat.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Also in October, in other currencies dashed box */}
      <div className="w-full bg-[#F8F9FC] border border-dashed border-[#B7C2D9] rounded-[10px] px-[15px] py-[13px] flex flex-col gap-[8px]">
        <span className="font-semibold text-[12px] leading-[16px] text-[#4A5675]">
          Also in October, in other currencies
        </span>

        {currency !== 'XLM' && (
          <button
            type="button"
            onClick={() => onSelectCurrency('XLM')}
            className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-baseline gap-[4px] min-w-0">
              <span className="font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                Insurance
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                1 bill, in XLM
              </span>
            </div>
            <div className="flex items-baseline gap-[4px] shrink-0 tabular-nums">
              <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">140.00</span>
              <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">XLM</span>
            </div>
          </button>
        )}

        {currency !== 'USDC' && (
          <button
            type="button"
            onClick={() => onSelectCurrency('USDC')}
            className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-baseline gap-[4px] min-w-0">
              <span className="font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                Rent & utilities
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                5 bills, in USDC
              </span>
            </div>
            <div className="flex items-baseline gap-[4px] shrink-0 tabular-nums">
              <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">561.50</span>
              <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">USDC</span>
            </div>
          </button>
        )}

        {currency !== 'EUR' && (
          <button
            type="button"
            onClick={() => onSelectCurrency('EUR')}
            className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-baseline gap-[4px] min-w-0">
              <span className="font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                Water
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                1 bill, in EUR, marked paid
              </span>
            </div>
            <div className="flex items-baseline gap-[4px] shrink-0 tabular-nums">
              <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">45.00</span>
              <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">EUR</span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
};
