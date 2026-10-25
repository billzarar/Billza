import React, { useState, useMemo } from 'react';
import { ChevronDown, BarChart2, TrendingUp } from 'lucide-react';
import {
  Currency,
  PaymentHistoryItem,
  MonthlyExpensePoint,
} from '../data/initialData';

interface MonthlyExpensesChartProps {
  currency: Currency;
  octoberPaidAmount: number;
  payments?: PaymentHistoryItem[];
}

export const MonthlyExpensesChart: React.FC<MonthlyExpensesChartProps> = ({
  currency,
  octoberPaidAmount,
  payments = [],
}) => {
  const [range, setRange] = useState<'6m' | '12m'>('6m');

  const monthCount = range === '6m' ? 6 : 12;

  // Dynamically compute monthly expenses from live payment history
  const dataPoints: MonthlyExpensePoint[] = useMemo(() => {
    const now = new Date();
    const pts: MonthlyExpensePoint[] = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthNum = d.getMonth();
      const isCurrent = i === 0;

      const monthPayments = payments.filter((p) => {
        if (!p.date) return false;
        const pDate = new Date(p.date);
        return pDate.getFullYear() === year && pDate.getMonth() === monthNum;
      });

      const usdc = monthPayments
        .filter((p) => p.currency === 'USDC' && (p.status === 'paid' || p.status === 'manual'))
        .reduce((s, p) => s + p.amount, 0);
      const xlm = monthPayments
        .filter((p) => p.currency === 'XLM' && (p.status === 'paid' || p.status === 'manual'))
        .reduce((s, p) => s + p.amount, 0);
      const eur = monthPayments
        .filter((p) => p.currency === 'EUR' && (p.status === 'paid' || p.status === 'manual'))
        .reduce((s, p) => s + p.amount, 0);

      pts.push({
        month: monthName,
        fullMonth: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        USDC: isCurrent && octoberPaidAmount > 0 ? octoberPaidAmount : usdc,
        XLM: xlm,
        EUR: eur,
        isCurrentSoFar: isCurrent,
      });
    }

    return pts;
  }, [monthCount, payments, octoberPaidAmount]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(monthCount - 2);

  // Ensure selectedMonthIndex is valid when switching 6m / 12m
  const activeIdx = Math.min(selectedMonthIndex, dataPoints.length - 1);
  const activePoint = dataPoints[activeIdx] || dataPoints[0];

  // Safe currency extractor function preventing undefined lookup
  const getPtVal = (pt: any): number => {
    if (!pt) return 0;
    const val = pt[currency] ?? pt.USDC ?? pt.XLM ?? pt.EUR ?? 0;
    return typeof val === 'number' && !isNaN(val) ? val : 0;
  };

  // Historical points (excluding current month so far)
  const historicalPoints = dataPoints.filter((d) => !d.isCurrentSoFar);
  const values = historicalPoints.map((d) => getPtVal(d));
  const avgValue =
    values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;

  let highestPoint = historicalPoints[0] || dataPoints[0];
  for (const pt of historicalPoints) {
    if (pt && highestPoint && getPtVal(pt) >= getPtVal(highestPoint)) {
      highestPoint = pt;
    }
  }
  const highestValue = highestPoint ? getPtVal(highestPoint) : 0;
  const pctOverAvg = avgValue > 0 ? ((highestValue - avgValue) / avgValue) * 100 : 0;

  // Y-axis max scale per currency
  const maxY = currency === 'USDC' ? 600 : currency === 'XLM' ? 200 : 60;
  const midY = maxY / 2;

  // SVG Coordinate System (619.25 x 230 from Figma spec)
  const svgWidth = 619.25;
  const svgHeight = 230;
  const topLineY = 32.75; // corresponds to maxY (600)
  const midLineY = 131.5; // corresponds to midY (300)
  const bottomLineY = 230; // corresponds to 0
  const chartDrawableHeight = bottomLineY - topLineY; // 197.25px

  const getCoordinates = (index: number, val: number) => {
    const x =
      dataPoints.length > 1
        ? (index / (dataPoints.length - 1)) * svgWidth
        : svgWidth / 2;
    const clamped = Math.max(0, Math.min(maxY * 1.1, val));
    const y = bottomLineY - (clamped / maxY) * chartDrawableHeight;
    return { x, y };
  };

  const coords = dataPoints.map((pt, idx) => getCoordinates(idx, getPtVal(pt)));

  // Solid line up to second-to-last point (September)
  const solidCoords = coords.slice(0, coords.length - 1);
  const lastHistoricalCoord = solidCoords[solidCoords.length - 1];
  const currentOctCoord = coords[coords.length - 1];

  // Build smooth or clean SVG path for solid historical portion
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cpy1 = p0.y;
      const cpx2 = p0.x + (p1.x - p0.x) * 0.55;
      const cpy2 = p1.y;
      d += ` C ${cpx1.toFixed(2)} ${cpy1.toFixed(2)}, ${cpx2.toFixed(2)} ${cpy2.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    }
    return d;
  };

  const solidLinePath = buildSmoothPath(solidCoords);
  const solidAreaPath =
    solidCoords.length > 1 && lastHistoricalCoord && solidCoords[0]
      ? `${solidLinePath} L ${lastHistoricalCoord.x.toFixed(2)} ${bottomLineY} L ${solidCoords[0].x.toFixed(2)} ${bottomLineY} Z`
      : '';

  const dashedLinePath =
    lastHistoricalCoord && currentOctCoord
      ? `M ${lastHistoricalCoord.x.toFixed(2)} ${lastHistoricalCoord.y.toFixed(2)} L ${currentOctCoord.x.toFixed(2)} ${currentOctCoord.y.toFixed(2)}`
      : '';

  const activeCoord = coords[activeIdx] || { x: 0, y: 0 };
  const activeLeftPct = (activeCoord.x / svgWidth) * 100;
  const activeTopPct = (activeCoord.y / svgHeight) * 100;

  const toggleRange = () => {
    if (range === '6m') {
      setRange('12m');
      setSelectedMonthIndex(10); // Sep in 12m array
    } else {
      setRange('6m');
      setSelectedMonthIndex(4); // Sep in 6m array
    }
  };

  return (
    <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:px-[32px] sm:pt-[31px] sm:pb-[27px] flex flex-col justify-between gap-[18px]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 w-full">
        <div className="flex flex-col gap-[3.5px]">
          <h2 className="font-extrabold text-[24px] sm:text-[28px] leading-[32px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
            Monthly expenses
          </h2>
          <p className="font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#4A5675]">
            {currency} paid per month. Other currencies are tracked separately.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleRange}
          className="inline-flex items-center justify-between gap-[8px] h-[40px] pl-[15px] pr-[13px] py-[1px] bg-white border border-[#77839F] hover:border-[#0B1530] rounded-[10px] transition-colors self-start shrink-0 whitespace-nowrap"
        >
          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
            {range === '6m' ? '6 months' : '12 months'}
          </span>
          <ChevronDown
            size={16}
            className={`text-[#0B1530] transition-transform duration-150 ${
              range === '12m' ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* 2 Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] w-full">
        {/* Average Card */}
        <div className="flex items-center justify-between min-h-[56px] pl-[8px] pr-[9px] py-[6px] border border-[#DDE2EC] rounded-[10px] gap-2">
          <div className="flex items-center gap-[10px] min-w-0">
            <div className="w-[36px] h-[36px] rounded-[18px] bg-[#0B1530] flex items-center justify-center shrink-0">
              <BarChart2 size={17} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                Average, {range === '6m' ? 'May to Sep' : 'Nov to Sep'}
              </span>
              <div className="flex items-baseline gap-[3.5px] tabular-nums">
                <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-[#0B1530]">
                  {(avgValue || 0).toFixed(2)}
                </span>
                <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-[#0B1530]">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center h-[26px] px-[9px] bg-[#EEF1F6] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#4A5675] whitespace-nowrap shrink-0">
            Per month
          </span>
        </div>

        {/* Highest Month Card */}
        <div className="flex items-center justify-between min-h-[56px] pl-[8px] pr-[9px] py-[6px] border border-[#DDE2EC] rounded-[10px] gap-2">
          <div className="flex items-center gap-[10px] min-w-0">
            <div className="w-[36px] h-[36px] rounded-[18px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
              <TrendingUp size={17} className="text-[#0B1530]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                Highest month · {highestPoint?.month || 'Sep'}
              </span>
              <div className="flex items-baseline gap-[3.5px] tabular-nums">
                <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-[#0B1530]">
                  {(highestValue || 0).toFixed(2)}
                </span>
                <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-[#0B1530]">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center h-[26px] px-[9px] bg-[#E6ECFB] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#2F4FBF] whitespace-nowrap shrink-0 tabular-nums">
            +{(pctOverAvg || 0).toFixed(1)}% over avg
          </span>
        </div>
      </div>

      {/* Chart Area (with space on top for floating tooltip and left for Y-axis labels) */}
      <div className="w-full pt-[34px] pl-[34px] sm:pl-[40px] flex flex-col">
        <div className="relative w-full h-[200px] sm:h-[230px]">
          {/* Y-Axis Labels */}
          <span
            className="absolute -left-[34px] sm:-left-[40px] w-[26px] sm:w-[30px] text-right font-medium text-[12px] leading-[16px] text-[#4A5675] tabular-nums select-none"
            style={{ top: `${(topLineY / svgHeight) * 100}%`, transform: 'translateY(-50%)' }}
          >
            {maxY}
          </span>
          <span
            className="absolute -left-[34px] sm:-left-[40px] w-[26px] sm:w-[30px] text-right font-medium text-[12px] leading-[16px] text-[#4A5675] tabular-nums select-none"
            style={{ top: `${(midLineY / svgHeight) * 100}%`, transform: 'translateY(-50%)' }}
          >
            {midY}
          </span>
          <span
            className="absolute -left-[34px] sm:-left-[40px] w-[26px] sm:w-[30px] text-right font-medium text-[12px] leading-[16px] text-[#4A5675] tabular-nums select-none"
            style={{ top: '100%', transform: 'translateY(-50%)' }}
          >
            0
          </span>

          {/* SVG Graph */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label={`${currency} paid per month chart`}
          >
            {/* Horizontal Grid Lines */}
            <line
              x1={0}
              y1={topLineY}
              x2={svgWidth}
              y2={topLineY}
              stroke="#EEF1F6"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={midLineY}
              x2={svgWidth}
              y2={midLineY}
              stroke="#EEF1F6"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={bottomLineY}
              x2={svgWidth}
              y2={bottomLineY}
              stroke="#DDE2EC"
              strokeWidth={1}
            />

            {/* Solid Historical Area Fill */}
            {solidAreaPath && <path d={solidAreaPath} fill="#E6ECFB" />}

            {/* Vertical Dashed Line at September */}
            {lastHistoricalCoord && (
              <line
                x1={lastHistoricalCoord.x}
                y1={lastHistoricalCoord.y}
                x2={lastHistoricalCoord.x}
                y2={bottomLineY}
                stroke="#77839F"
                strokeWidth={1.02}
                strokeDasharray="4 4"
              />
            )}

            {/* Solid Line (May -> Sep) */}
            {solidLinePath && (
              <path
                d={solidLinePath}
                fill="none"
                stroke="#4164D9"
                strokeWidth={2.54}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Dashed Line (Sep -> Oct) */}
            {dashedLinePath && (
              <path
                d={dashedLinePath}
                fill="none"
                stroke="#4164D9"
                strokeWidth={2.54}
                strokeDasharray="6 5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Interactive Point Hit Targets */}
          {coords.map((ptCoord, idx) => {
            const leftPct = (ptCoord.x / svgWidth) * 100;
            const topPct = (ptCoord.y / svgHeight) * 100;
            const isSelected = idx === activeIdx;
            const ptData = dataPoints[idx];

            return (
              <button
                key={ptData.month}
                type="button"
                onClick={() => setSelectedMonthIndex(idx)}
                onMouseEnter={() => setSelectedMonthIndex(idx)}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-[28px] h-[28px] flex items-center justify-center rounded-full focus:outline-none group z-10"
                aria-label={`${ptData?.fullMonth || ''}: ${(getPtVal(ptData) || 0).toFixed(2)} ${currency}`}
              >
                <span
                  className={`rounded-full transition-transform duration-150 ${
                    isSelected
                      ? 'w-[12px] h-[12px] bg-white border-2 border-[#4164D9] scale-100 shadow-xs'
                      : 'w-[8px] h-[8px] bg-[#4164D9]/0 group-hover:bg-[#4164D9]/50'
                  }`}
                />
              </button>
            );
          })}

          {/* Floating Navy Tooltip matching Figma (150px x 61px, #0B1530) */}
          {activePoint && (
            <div
              style={{
                left: `clamp(75px, ${activeLeftPct}%, calc(100% - 75px))`,
                top: `${activeTopPct}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-[calc(100%+12px)] w-[150px] h-[61px] bg-[#0B1530] rounded-[10px] shadow-[0_12px_32px_rgba(11,21,48,0.16)] flex flex-col items-center justify-center pointer-events-none z-20 transition-all duration-150"
            >
              <span className="font-medium text-[12px] leading-[16px] text-[#A9B4CC]">
                {activePoint.fullMonth}
              </span>
              <div className="flex items-baseline gap-[3.5px] mt-[2px] tabular-nums">
                <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                  {(getPtVal(activePoint) || 0).toFixed(2)}
                </span>
                <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                  {currency}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Labels */}
        <div className="flex items-start justify-between pt-[10px] w-full select-none">
          {dataPoints.map((pt, idx) => {
            const isOct = pt.isCurrentSoFar;
            const isSelected = idx === activeIdx;
            return (
              <button
                key={pt.month}
                type="button"
                onClick={() => setSelectedMonthIndex(idx)}
                className={`text-[12px] leading-[16px] transition-colors ${
                  isOct
                    ? 'font-bold text-[#0B1530]'
                    : isSelected
                    ? 'font-bold text-[#4164D9]'
                    : 'font-medium text-[#4A5675] hover:text-[#0B1530]'
                }`}
              >
                {pt.month}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap items-center gap-[20px] w-full pt-1">
        <div className="flex items-center gap-[7px]">
          <span className="w-[14px] h-[3px] rounded-[1.5px] bg-[#4164D9]" />
          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">Paid</span>
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="w-[14px] h-0 border-t-[3px] border-dashed border-[#4164D9]" />
          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
            October so far, not in the average
          </span>
        </div>
      </div>
    </section>
  );
};
