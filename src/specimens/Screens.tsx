import { AnomalyChart, CompositionChart, Fit, HeatGrid, RankingChart, TrendChart } from './charts';
import { anomaly, fmt, observed, scenarios, signed } from './data';
import { SpecimenShell, layoutStyles } from './Layout';
import { Alert, ChartCard, Kpi, Kpis, Tag, partStyles as p } from './Parts';
import { Icon } from '../components/Icon/Icon';

const FOOT = 'Source: illustrative values for layout review, not measurements · As of October 2026';
const STRIP = 'Source: illustrative values for layout review · Period 1990 to 2050 · As of October 2026 · Methodology describes how projections and ranges are produced';

export function Overview() {
  return (
    <SpecimenShell
      current="Overview"
      title="Overview"
      purpose="The state of the climate system and the largest sources of emissions."
      controls={[
        { kind: 'field', label: 'Period', value: '1990 to 2024' },
        { kind: 'segments', label: 'Metric', options: ['Total', 'Per person', 'Intensity'], value: 'Total' },
      ]}
      strip={STRIP}
    >
      <Alert tone="info" title="Specimen data">Values on this screen are generated to review layout, colour and type. They are not measurements.</Alert>
      <Kpis>
        <Kpi label="Annual CO₂ emissions" value="37.4" unit="GtCO₂ a year" delta="+0.8%" note="on 2023" direction="up" tone="negative" />
        <Kpi label="Emissions per person" value="4.7" unit="tCO₂" delta="−0.4%" note="on 2023" direction="down" tone="positive" />
        <Kpi label="Atmospheric CO₂" value="422.8" unit="ppm" delta="+2.6" note="ppm on 2023" direction="up" tone="negative" />
        <Kpi label="Temperature anomaly" value="1.28" unit="°C above 1850 to 1900" delta="+0.07" note="°C on 2023" direction="up" tone="negative" />
      </Kpis>
      <div className={layoutStyles.rowWide}>
        <ChartCard
          title="Annual emissions and projection"
          support="Observed to 2024, then one scenario with its 66% range."
          keys={[{ name: 'Observed', color: '--syn-data-cat-1', kind: 'solid' }, { name: 'Current policies (projection)', color: '--syn-data-cat-1', kind: 'dashed' }, { name: '66% range', color: '--syn-data-cat-1', kind: 'band' }]}
          footer={FOOT}
        >
          <Fit>{(w) => <TrendChart width={w} height={340} label="Annual global CO₂ emissions in gigatonnes a year from 1990 to 2024, rising from about 22 to about 37, with a projection to 2050 that is roughly flat under current policies." />}</Fit>
        </ChartCard>
        <ChartCard title="Leading emitters" support="GtCO₂ in 2024, top eight." footer={FOOT} headingLevel={2}>
          <Fit>{(w) => <RankingChart width={w} label="Bar chart of annual CO₂ emissions in 2024 for eight countries, from about 12 gigatonnes for Country A down to about 0.65 for Country H." />}</Fit>
        </ChartCard>
      </div>
      <div className={layoutStyles.row}>
        <ChartCard title="Warming by region and decade" support="°C above the 1850 to 1900 baseline." footer={FOOT}>
          <Fit>{(w) => <HeatGrid width={w} label="Heat grid of warming for six regions across four decades; values rise toward the 2020s and one cell has no data." />}</Fit>
          <div className={p.heatLegend}>
            <span>Lower</span>
            <span className={p.ramp} aria-hidden="true">{[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n} style={{ background: `var(--syn-data-seq-${n})` }} />)}</span>
            <span>Higher</span>
          </div>
        </ChartCard>
        <ChartCard title="Global temperature anomaly" support="°C relative to the 1991 to 2020 baseline." footer={FOOT}>
          <Fit>{(w) => <AnomalyChart width={w} height={300} label="Bars of yearly temperature anomaly from 2004 to 2024 relative to a 1991 to 2020 baseline, below zero in the early years and above zero in the later years." />}</Fit>
        </ChartCard>
      </div>
    </SpecimenShell>
  );
}

const rows: Array<{ name: string; unit: string; values: number[]; decimals: number; goodWhenDown: boolean; selected?: boolean }> = [
  { name: 'Total CO₂ emissions', unit: 'MtCO₂', values: [412, 468, 521, 449], decimals: 0, goodWhenDown: true, selected: true },
  { name: 'Emissions per person', unit: 'tCO₂', values: [7.7, 7.9, 8.1, 6.4], decimals: 1, goodWhenDown: true },
  { name: 'Emissions per unit of output', unit: 'kgCO₂ per $', values: [0.62, 0.51, 0.41, 0.27], decimals: 2, goodWhenDown: true },
  { name: 'Renewable share of electricity', unit: '%', values: [18.2, 20.5, 26.9, 43.7], decimals: 1, goodWhenDown: false },
];

export function CountryProfile() {
  return (
    <SpecimenShell
      current="Country profile"
      title="Country profile"
      purpose="How one country's emissions have changed and where current policy leads."
      controls={[
        { kind: 'field', label: 'Geography', value: 'Example country' },
        { kind: 'field', label: 'Period', value: '1990 to 2024' },
        { kind: 'segments', label: 'Gases', options: ['CO₂', 'All greenhouse gases'], value: 'CO₂' },
      ]}
      strip={STRIP}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syn-space-2)', alignItems: 'center' }}>
        <Tag accent>Example country</Tag><Tag>Upper-middle income</Tag><Tag>Population 54 million</Tag>
      </div>
      <Kpis>
        <Kpi label="CO₂ emissions, 2024" value="449" unit="MtCO₂" delta="−13.8%" note="since 2010" direction="down" tone="positive" />
        <Kpi label="Per person" value="6.4" unit="tCO₂" delta="−21.0%" note="since 2010" direction="down" tone="positive" />
        <Kpi label="Share of world emissions" value="1.2" unit="%" delta="+0.0" note="points on 2023" direction="up" tone="neutral" />
        <Kpi label="Projected change to 2050" value="−18" unit="% from 2024" delta="−2.0" note="points per decade" direction="down" tone="positive" />
      </Kpis>
      <ChartCard
        title="Emissions and projection"
        support="MtCO₂ a year; observed to 2024, then current policies with a 66% range."
        keys={[{ name: 'Observed', color: '--syn-data-cat-1', kind: 'solid' }, { name: 'Current policies (projection)', color: '--syn-data-cat-1', kind: 'dashed' }, { name: '66% range', color: '--syn-data-cat-1', kind: 'band' }]}
        footer={FOOT}
      >
        <Fit>{(w) => <TrendChart width={w} height={340} label="Annual emissions for the example country from 1990 to 2024 with a flat to slowly falling projection to 2050 and a widening range." />}</Fit>
      </ChartCard>
      <div className={layoutStyles.rowWide}>
        <div className={p.card}>
          <h2 className={p.cardTitle}>Selected indicators</h2>
          <div className={p.tableWrap} tabIndex={0} role="region" aria-label="Selected indicators, scrollable">
            <table className={p.table}>
              <caption>Indicators for the example country, 1990 to 2024. Illustrative values.</caption>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>Indicator</th>
                  <th scope="colgroup" colSpan={4} className={p.group}>Level</th>
                  <th scope="col" rowSpan={2} className={p.num}>Change since 1990</th>
                </tr>
                <tr>
                  {['1990', '2000', '2010', '2024'].map((y) => <th key={y} scope="col" className={p.num}>{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const change = ((r.values[3] - r.values[0]) / r.values[0]) * 100;
                  const good = r.goodWhenDown ? change < 0 : change > 0;
                  return (
                    <tr key={r.name} className={r.selected ? p.selectedRow : undefined} aria-selected={r.selected ? 'true' : undefined}>
                      <th scope="row">{r.name}<span className={p.unit}>{r.unit}</span></th>
                      {r.values.map((v, i) => <td key={i} className={p.num}>{fmt(v, r.decimals)}</td>)}
                      <td className={`${p.num} ${good ? p.positive : p.negative}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--syn-space-1)' }}>
                          <Icon name={change < 0 ? 'down' : 'up'} size="small" />{signed(change, 1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <ChartCard title="Composition by gas" support="Share of CO₂-equivalent, 1990 to 2024." keys={[{ name: 'Carbon dioxide', color: '--syn-data-cat-1', kind: 'bar' }, { name: 'Methane', color: '--syn-data-cat-2', kind: 'bar' }, { name: 'Nitrous oxide', color: '--syn-data-cat-3', kind: 'bar' }, { name: 'Other gases', color: '--syn-data-other', kind: 'bar' }]} footer={FOOT}>
          <Fit>{(w) => <CompositionChart width={w} height={300} label="Stacked areas showing carbon dioxide rising from about 70 to about 85 percent of emissions between 1990 and 2024 while methane falls." />}</Fit>
        </ChartCard>
      </div>
    </SpecimenShell>
  );
}

export function Forecasts() {
  const last = observed[observed.length - 1].value;
  const at = (s: (typeof scenarios)[number], year: number) => s.points.find((pt) => pt.year === year)!;
  return (
    <SpecimenShell
      current="Forecasts"
      title="Forecasts"
      purpose="Where emissions could go under different assumptions, and how uncertain each path is."
      controls={[
        { kind: 'field', label: 'Geography', value: 'World' },
        { kind: 'field', label: 'Scenarios', value: '3 selected' },
        { kind: 'field', label: 'Horizon', value: 'To 2050' },
      ]}
      strip={STRIP}
    >
      <Alert tone="warning" title="Scenarios, not predictions">Each path follows stated assumptions. The shaded range is the 66% interval for that path; outcomes outside it remain possible.</Alert>
      <ChartCard
        title="Emissions under three scenarios"
        support="GtCO₂ a year; observed to 2024, scenario paths dashed with their ranges."
        keys={[{ name: 'Observed', color: '--syn-data-text', kind: 'solid' }, ...scenarios.map((s, i) => ({ name: s.name, color: `--syn-data-cat-${i + 1}`, kind: 'dashed' as const })), { name: '66% range of each path, in its colour', color: '--syn-data-text-muted', kind: 'band' }]}
        footer={FOOT}
      >
        <Fit>{(w) => <TrendChart width={w} height={360} showScenarios={3} neutralObserved label="Observed global emissions to 2024 near 37 gigatonnes, then three scenario paths to 2050: current policies roughly flat, announced pledges falling to about 27, and a net zero pathway falling to about 9." />}</Fit>
      </ChartCard>
      <div className={layoutStyles.rowWide}>
        <div className={p.card}>
          <h2 className={p.cardTitle}>Scenario summary</h2>
          <div className={p.tableWrap} tabIndex={0} role="region" aria-label="Scenario summary, scrollable">
            <table className={p.table}>
              <caption>Emissions by scenario in GtCO₂ a year. Illustrative values.</caption>
              <thead>
                <tr>
                  <th scope="col">Scenario</th>
                  {[2030, 2040, 2050].map((y) => <th key={y} scope="col" className={p.num}>{y}</th>)}
                  <th scope="col" className={p.num}>Change 2024 to 2050</th>
                  <th scope="col" className={p.num}>66% range in 2050</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const end = at(s, 2050);
                  const change = ((end.value - last) / last) * 100;
                  return (
                    <tr key={s.name}>
                      <th scope="row">{s.name}</th>
                      {[2030, 2040, 2050].map((y) => <td key={y} className={p.num}>{fmt(at(s, y).value, 1)}</td>)}
                      <td className={`${p.num} ${p.positive}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--syn-space-1)' }}><Icon name="down" size="small" />{signed(change, 0)}%</span>
                      </td>
                      <td className={p.num}>{fmt(end.low, 1)} to {fmt(end.high, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <ChartCard title="Recent anomaly" support="°C relative to the 1991 to 2020 baseline." footer={FOOT}>
          <Fit>{(w) => <AnomalyChart width={w} height={300} label={`Yearly temperature anomaly from 2004 to 2024; the latest year is ${signed(anomaly[anomaly.length - 1].value, 2)} degrees against the baseline.`} />}</Fit>
        </ChartCard>
      </div>
    </SpecimenShell>
  );
}
