/**
 * components/MapPanel.tsx
 * Stylized ambulance dispatch map simulation
 */
import type { SymbolTable } from '../types';

interface Props { symbolTable: SymbolTable }

const POSITIONS = [
  { top: '30%', left: '25%' },
  { top: '55%', left: '60%' },
  { top: '20%', left: '65%' },
  { top: '70%', left: '35%' },
  { top: '40%', left: '80%' },
];

const HOSPITAL_POSITIONS = [
  { top: '25%', left: '70%' },
  { top: '65%', left: '55%' },
  { top: '45%', left: '20%' },
];

function getStateIcon(state: string) {
  if (state === 'COMPLETED' || state === 'ARRIVED') return '✅';
  if (state === 'DISPATCHED') return '🚨';
  if (state === 'CANCELLED')  return '❌';
  return '🚑';
}

function sevColour(sev: string) {
  const map: Record<string, string> = {
    CRITICAL: '#ff4040', HIGH: '#ff8c00', MEDIUM: '#ffd700', LOW: '#4caf50',
  };
  return map[sev] || '#8be9fd';
}

export function MapPanel({ symbolTable }: Props) {
  const { patients, ambulances, hospitals } = symbolTable;

  const hasData = patients.length || ambulances.length || hospitals.length;

  return (
    <div className="map-container">
      <div className="map-bg" />

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.5rem 0.75rem',
        fontSize: '0.72rem', color: 'var(--text-muted)',
        display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          MAP LEGEND
        </div>
        {[
          { icon: '🧑‍⚕️', label: 'Patient' },
          { icon: '🚑', label: 'Ambulance' },
          { icon: '🏥', label: 'Hospital' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>{l.icon}</span>{l.label}
          </div>
        ))}
      </div>

      {!hasData && (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <div className="empty-state-title">Map will populate after compilation</div>
          <div className="empty-state-desc">Patients, ambulances, and hospitals appear on the map once compiled.</div>
        </div>
      )}

      {/* Routes (SVG lines) */}
      <svg className="map-route">
        {ambulances.map((amb, i) => {
          const patIdx  = patients.findIndex(p => p.id === amb.patient);
          const hospIdx = hospitals.findIndex(h => h.id === amb.hospital);
          if (patIdx < 0 || hospIdx < 0) return null;
          const from = POSITIONS[patIdx % POSITIONS.length];
          const to   = HOSPITAL_POSITIONS[hospIdx % HOSPITAL_POSITIONS.length];

          const fx = parseFloat(from.left);
          const fy = parseFloat(from.top);
          const tx = parseFloat(to.left);
          const ty = parseFloat(to.top);

          return (
            <line
              key={i}
              x1={`${fx}%`} y1={`${fy}%`}
              x2={`${tx}%`} y2={`${ty}%`}
              stroke={amb.state === 'COMPLETED' ? 'var(--success)' : 'var(--accent)'}
              strokeWidth="2"
              strokeDasharray={amb.state === 'DISPATCHED' ? '6 4' : 'none'}
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Patient markers */}
      {patients.map((p, i) => {
        const pos = POSITIONS[i % POSITIONS.length];
        return (
          <div key={p.id} className="map-marker patient" style={{ top: pos.top, left: pos.left }}>
            <div className="map-marker-icon" style={{
              background: `linear-gradient(135deg, ${sevColour(p.severity)}, ${sevColour(p.severity)}88)`,
            }}>
              <span>🧑‍⚕️</span>
            </div>
            <div className="map-marker-label">
              {p.id}
              {p.severity && (
                <span style={{ color: sevColour(p.severity), marginLeft: '4px', fontSize: '0.65rem' }}>
                  {p.severity}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Ambulance markers — positioned between patient and hospital */}
      {ambulances.map((a, i) => {
        const patIdx  = patients.findIndex(p => p.id === a.patient);
        const hospIdx = hospitals.findIndex(h => h.id === a.hospital);

        let pos = POSITIONS[(i + 2) % POSITIONS.length];

        if (patIdx >= 0 && hospIdx >= 0) {
          const from = POSITIONS[patIdx % POSITIONS.length];
          const to   = HOSPITAL_POSITIONS[hospIdx % HOSPITAL_POSITIONS.length];
          const progress = a.state === 'ARRIVED' || a.state === 'COMPLETED' ? 0.85 :
                           a.state === 'DISPATCHED' ? 0.45 : 0.15;

          const fx = parseFloat(from.left), fy = parseFloat(from.top);
          const tx = parseFloat(to.left),   ty = parseFloat(to.top);
          pos = {
            left: `${fx + (tx - fx) * progress}%`,
            top:  `${fy + (ty - fy) * progress}%`,
          };
        }

        return (
          <div key={a.id} className="map-marker ambulance" style={{ top: pos.top, left: pos.left }}>
            <div className="map-marker-icon">
              <span>{getStateIcon(a.state)}</span>
            </div>
            <div className="map-marker-label">{a.id} · {a.state}</div>
          </div>
        );
      })}

      {/* Hospital markers */}
      {hospitals.map((h, i) => {
        const pos = HOSPITAL_POSITIONS[i % HOSPITAL_POSITIONS.length];
        return (
          <div key={h.id} className="map-marker hospital" style={{ top: pos.top, left: pos.left }}>
            <div className="map-marker-icon">
              <span>🏥</span>
            </div>
            <div className="map-marker-label">{h.id} · {h.name}</div>
          </div>
        );
      })}
    </div>
  );
}
