/**
 * components/SymbolTablePanel.tsx
 * Renders patients, ambulances, and hospitals tables
 */
import type { SymbolTable } from '../types';

interface Props { symbolTable: SymbolTable }

function StateChip({ state }: { state: string }) {
  const colour: Record<string, string> = {
    AVAILABLE:   'var(--success)',
    DISPATCHED:  'var(--warning)',
    ARRIVED:     'var(--info)',
    COMPLETED:   'var(--accent)',
    CANCELLED:   'var(--danger)',
    REGISTERED:  'var(--text-muted)',
    WAITING:     'var(--warning)',
    ASSIGNED:    'var(--info)',
    IN_TRANSIT:  'var(--warning)',
    TRANSFERRED: 'var(--success)',
    ACTIVE:      'var(--success)',
  };
  const c = colour[state] || 'var(--text-secondary)';
  return (
    <span style={{
      background: `${c}22`, color: c, padding: '1px 8px',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
      border: `1px solid ${c}55`,
    }}>
      {state}
    </span>
  );
}

function SeverityChip({ sev }: { sev: string }) {
  const colour: Record<string, string> = {
    CRITICAL: 'var(--critical)', HIGH: 'var(--danger)',
    MEDIUM: 'var(--warning)', LOW: 'var(--low)', UNKNOWN: 'var(--text-muted)',
  };
  const c = colour[sev] || 'var(--text-muted)';
  return (
    <span style={{
      background: `${c}22`, color: c, padding: '1px 8px',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
      border: `1px solid ${c}55`,
    }}>
      {sev || '—'}
    </span>
  );
}

export function SymbolTablePanel({ symbolTable }: Props) {
  const { patients, ambulances, hospitals } = symbolTable;

  if (!patients.length && !ambulances.length && !hospitals.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">Symbol table is empty</div>
        <div className="empty-state-desc">Compile a valid program to populate the symbol tables.</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* PATIENTS */}
      {patients.length > 0 && (
        <>
          <div className="sym-section-title">🧑‍⚕️ PATIENTS</div>
          <table className="sym-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>LOCATION</th>
                <th>SEVERITY</th>
                <th>STATE</th>
                <th>AMBULANCE</th>
                <th>HOSPITAL</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={i}>
                  <td className="mono text-accent">{p.id}</td>
                  <td style={{ color: 'var(--tok-string)' }}>{p.location || '—'}</td>
                  <td><SeverityChip sev={p.severity} /></td>
                  <td><StateChip state={p.state} /></td>
                  <td className="mono" style={{ color: 'var(--tok-identifier)' }}>{p.ambulance || '—'}</td>
                  <td className="mono" style={{ color: 'var(--tok-identifier)' }}>{p.hospital || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* AMBULANCES */}
      {ambulances.length > 0 && (
        <>
          <div className="sym-section-title">🚑 AMBULANCES</div>
          <table className="sym-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>STATE</th>
                <th>PATIENT</th>
                <th>HOSPITAL</th>
                <th>PRIORITY</th>
              </tr>
            </thead>
            <tbody>
              {ambulances.map((a, i) => (
                <tr key={i}>
                  <td className="mono text-accent">{a.id}</td>
                  <td><StateChip state={a.state} /></td>
                  <td className="mono" style={{ color: 'var(--tok-identifier)' }}>{a.patient || '—'}</td>
                  <td className="mono" style={{ color: 'var(--tok-identifier)' }}>{a.hospital || '—'}</td>
                  <td><SeverityChip sev={a.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* HOSPITALS */}
      {hospitals.length > 0 && (
        <>
          <div className="sym-section-title">🏥 HOSPITALS</div>
          <table className="sym-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, i) => (
                <tr key={i}>
                  <td className="mono text-accent">{h.id}</td>
                  <td style={{ color: 'var(--tok-string)' }}>{h.name}</td>
                  <td><StateChip state={h.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
