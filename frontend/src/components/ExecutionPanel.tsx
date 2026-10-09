/**
 * components/ExecutionPanel.tsx
 * Displays the execution engine's log and final summary
 */
import type { ExecutionResult } from '../types';

interface Props { result: ExecutionResult | null }

export function ExecutionPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">▶️</div>
        <div className="empty-state-title">No execution yet</div>
        <div className="empty-state-desc">
          Execution runs after a semantically valid compilation with no errors.
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Result banner */}
      <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
        <span style={{ fontSize: '1.2rem' }}>{result.success ? '✅' : '❌'}</span>
        <div>
          <div className="result-banner-title">
            {result.success ? 'EXECUTION SUCCESSFUL' : 'EXECUTION FAILED'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {result.log.length} instructions executed
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '0.75rem',
      }}>
        {result.log.map((entry, i) => (
          <div key={i} className="exec-entry">
            <span className="exec-idx mono">{String(entry.index).padStart(3, '0')}</span>
            <span className={`exec-icon ${entry.success ? 'ok' : 'err'}`}>
              {entry.success ? '✓' : '✗'}
            </span>
            <span className="exec-msg">{entry.message}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {result.summary && Object.keys(result.summary).length > 0 && (
        <>
          <div className="sym-section-title">📋 EXECUTION SUMMARY</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.5rem',
          }}>
            {[
              { label: 'Total Patients',   value: result.summary.total_patients,   icon: '🧑‍⚕️' },
              { label: 'Total Ambulances', value: result.summary.total_ambulances, icon: '🚑' },
              { label: 'Total Hospitals',  value: result.summary.total_hospitals,  icon: '🏥' },
            ].filter(x => x.value !== undefined).map((item, i) => (
              <div key={i} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.7rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
