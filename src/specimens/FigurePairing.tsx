import { Kpi, Kpis, partStyles as p } from './Parts';
import charts from './Charts.module.css';
import { fmt } from './data';
import { Fit } from './charts';

const sample = [1111.11, 8888.88, 4072.5, 731.04, 15.2, 2260.77];
const rows = [['Country A', 1111.11], ['Country B', 8888.88], ['Country C', 4072.5], ['Country D', 731.04], ['Country E', 15.2], ['Country F', 1.11]] as const;

const column = (face: 'ui' | 'figure') => (
  <table className={p.table}>
    <caption>{face === 'ui' ? 'UI face (proportional digits)' : 'Figure face (tabular digits)'}</caption>
    <thead><tr><th scope="col">Country</th><th scope="col" className={p.num} style={face === 'ui' ? { fontFamily: 'var(--syn-family-ui)', fontFeatureSettings: 'normal' } : undefined}>GtCO₂</th></tr></thead>
    <tbody>
      {rows.map(([n, v]) => (
        <tr key={n}><th scope="row">{n}</th><td className={p.num} style={face === 'ui' ? { fontFamily: 'var(--syn-family-ui)', fontFeatureSettings: 'normal' } : undefined}>{v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
      ))}
    </tbody>
  </table>
);

export function FigurePairing() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--syn-layout-gutter)', padding: 'var(--syn-space-6)', maxWidth: 'var(--syn-layout-content-max)' }}>
      <h1 className={p.sampleUi}>Figure face pairing</h1>
      <p className={p.cardSupport}>Poppins carries text; Inter carries figures, tabular and lining, scaled so capital heights match.</p>

      <section aria-label="Key figures">
        <h2 className={p.pairingTitle}>Key figures in three sizes</h2>
        <Kpis>
          <Kpi label="Annual CO₂ emissions" value="37.4" unit="GtCO₂ a year" delta="+0.8%" note="on 2023" direction="up" tone="negative" />
          <Kpi label="Emissions per person" value="4.7" unit="tCO₂" delta="−0.4%" note="on 2023" direction="down" tone="positive" />
          <Kpi label="Atmospheric CO₂" value="422.8" unit="ppm" delta="+2.6" note="ppm on 2023" direction="up" tone="negative" />
        </Kpis>
        <div className={p.card} style={{ marginTop: 'var(--syn-layout-gutter)' }}>
          <div className={p.compare}>
            {(['figureLg', 'figureMd', 'figureSm'] as const).map((role) => (
              <div key={role}>
                <p className={p.pairingTitle}>{role === 'figureLg' ? 'figure-lg' : role === 'figureMd' ? 'figure-md' : 'figure-sm'}</p>
                <p style={{ font: `var(--syn-type-${role === 'figureLg' ? 'figure-lg' : role === 'figureMd' ? 'figure-md' : 'figure-sm'}-weight) var(--syn-type-${role === 'figureLg' ? 'figure-lg' : role === 'figureMd' ? 'figure-md' : 'figure-sm'}-size) / var(--syn-type-${role === 'figureLg' ? 'figure-lg' : role === 'figureMd' ? 'figure-md' : 'figure-sm'}-line) var(--syn-family-figure)`, fontFeatureSettings: 'var(--syn-figure-feature-settings)', color: 'var(--syn-color-text-primary)' }}>
                  1,234.56 <span style={{ font: 'var(--syn-type-text-sm-weight) var(--syn-type-text-sm-size) / var(--syn-type-text-sm-line) var(--syn-family-ui)', color: 'var(--syn-color-text-muted)' }}>MtCO₂</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Numeric table column">
        <h2 className={p.pairingTitle}>Right-aligned numeric column</h2>
        <div className={p.compare}>
          <div className={p.tableWrap}>{column('ui')}</div>
          <div className={p.tableWrap}>{column('figure')}</div>
        </div>
      </section>

      <section aria-label="Chart axis">
        <h2 className={p.pairingTitle}>Chart axis</h2>
        <div className={p.panel}>
          <Fit>{(w) => {
            const xs = (i: number) => 40 + (i * (w - 80)) / 5;
            const shown: number[] = [];
            for (const i of [0, 1, 2, 3, 4, 5]) if (!shown.length || xs(i) - xs(shown[shown.length - 1]) >= 84) shown.push(i);
            return (
              <svg className={charts.chart} width={w} height={120} viewBox={`0 0 ${w} 120`} role="img" aria-label="A horizontal axis with tick labels set in the figure face">
                {shown.map((i) => (
                  <g key={i}>
                    <line className={charts.grid} x1={xs(i)} x2={xs(i)} y1="10" y2="70" />
                    <text className={charts.tick} x={xs(i)} y="90" textAnchor="middle">{fmt(sample[i], 2)}</text>
                  </g>
                ))}
                <text className={charts.axisTitle} x="40" y="112">GtCO₂ a year</text>
              </svg>
            );
          }}</Fit>
        </div>
      </section>
    </main>
  );
}
