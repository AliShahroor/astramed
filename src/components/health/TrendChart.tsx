import { Bar, CartesianGrid, ComposedChart, Line, Area, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CAREER_DOSE_LIMIT_MSV, CO2_LIMIT_MMHG } from '../../data/evidence';
import { INDICATORS } from '../../data/indicators';
import { toDaily } from '../../engine/series';
import { fmt } from '../../engine/stats';
import type { Baseline, IndicatorId, Measurement } from '../../types';
import type { Range } from '../../app/store';

interface Props {
  indicator: IndicatorId;
  measurements: Measurement[];
  baseline?: Baseline;
  asOfDay: number;
  range: Range;
}

const C = { line: '#4B9C96', base: '#83A9D2', limit: '#E8866F', manual: '#D8AA58', grid: '#253239', text: '#A7B4BC' };

export function TrendChart({ indicator, measurements, baseline, asOfDay, range }: Props) {
  const def = INDICATORS[indicator];
  const daily = toDaily(indicator, measurements);
  const from = range === 'all' ? 1 : Math.max(1, asOfDay - Number(range) + 1);
  const data = daily.filter((d) => d.day >= from && d.day <= asOfDay);
  const limit = indicator === 'co2' ? CO2_LIMIT_MMHG : indicator === 'radiation' ? CAREER_DOSE_LIMIT_MSV : undefined;
  const last = data.at(-1);
  const summary = `${def.label}, Days ${from} to ${asOfDay}. ${last ? `Latest ${fmt(last.value, def.decimals)} ${def.unit} on Day ${last.day}.` : 'No data in range.'}${baseline ? ` Personal baseline ${fmt(baseline.value, def.decimals)} ${def.unit}.` : ''}`;
  const dot = (p: { cx?: number; cy?: number; payload?: { hasManual: boolean; hasLive: boolean; day: number } }) => {
    const { cx, cy, payload } = p;
    if (cx === undefined || cy === undefined || !payload) return <g key={`d-${payload?.day}`} />;
    const special = payload.hasManual || payload.hasLive;
    const sel = payload.day === asOfDay;
    return <circle key={`d-${payload.day}`} cx={cx} cy={cy} r={sel ? 5 : special ? 4 : 2.5} fill={special ? C.manual : C.line} stroke={sel ? '#E7EDF0' : 'none'} strokeWidth={2} />;
  };
  const domain: [number | string, number | string] | undefined = indicator === 'radiation' ? [0, CAREER_DOSE_LIMIT_MSV] : undefined;
  const yDomain = domain ?? ['auto', 'auto'] as [string, string];
  return (
    <div role="img" aria-label={summary}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" type="number" domain={[from, asOfDay]} allowDecimals={false} tick={{ fill: C.text, fontSize: 12 }} stroke={C.grid} label={{ value: 'Mission day', position: 'insideBottom', offset: -2, fill: C.text, fontSize: 12 }} height={36} />
            <YAxis domain={yDomain} tick={{ fill: C.text, fontSize: 12 }} stroke={C.grid} width={48} unit="" label={{ value: def.unit, angle: -90, position: 'insideLeft', fill: C.text, fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#121B20', border: '1px solid #253239', borderRadius: 6, color: '#E7EDF0', fontSize: 13 }}
              formatter={(v) => [`${fmt(Number(v), def.decimals)} ${def.unit}`, def.label]}
              labelFormatter={(d) => `Mission day ${d}`}
            />
            {baseline && indicator !== 'radiation' && <ReferenceLine y={baseline.value} stroke={C.base} strokeDasharray="5 4" label={{ value: `Baseline ${fmt(baseline.value, def.decimals)}`, fill: C.base, fontSize: 12, position: 'insideTopLeft' }} />}
            {limit !== undefined && <ReferenceLine y={limit} stroke={C.limit} strokeDasharray="2 3" label={{ value: indicator === 'co2' ? `NASA limit ${limit} mmHg (1-h avg)` : `NASA career limit ${limit} mSv`, fill: C.limit, fontSize: 12, position: 'insideTopRight' }} />}
            <ReferenceLine x={asOfDay} stroke="#E7EDF0" strokeOpacity={0.35} />
            {def.chart === 'bar' && <Bar dataKey="value" fill={C.line} fillOpacity={0.75} maxBarSize={14} isAnimationActive={false} />}
            {def.chart === 'area' && <Area dataKey="value" stroke={C.line} fill={C.line} fillOpacity={0.2} isAnimationActive={false} />}
            {def.chart === 'line' && <Line dataKey="value" stroke={C.line} strokeWidth={2} dot={dot} activeDot={{ r: 6 }} isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="label mt-1">
        Solid line: simulated observations. Dashed blue: personal baseline (simulated preflight). {limit !== undefined && 'Dotted red: NASA reference limit. '}
        {indicator === 'bone' && 'No expected trajectory is drawn: NASA sources reviewed do not give a validated cumulative value. '}
        Amber points: manual entries or live assessments. Vertical line: selected day.
      </p>
    </div>
  );
}
