/**
 * components/SemanticPanel.tsx
 * Displays semantic analysis results and errors
 */
import type { CompilerError } from '../types';

interface Props {
  errors: CompilerError[];
  statementCount: number;
}

export function SemanticPanel({ errors, statementCount }: Props) {
  const semErrors  = errors.filter(e => e.type === 'SEMANTIC');
  const ok = semErrors.length === 0;

  return (
    <div className="fade-in">
      {/* Summary row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className={`badge ${ok ? 'badge-success' : 'badge-error'}`}>
          {ok ? '✓ SEMANTIC OK' : '✗ SEMANTIC FAILED'}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Statements validated: <strong style={{ color: 'var(--text-primary)' }}>{statementCount}</strong>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Semantic errors: <strong style={{ color: ok ? 'var(--success)' : 'var(--danger)' }}>
            {semErrors.length}
          </strong>
        </span>
      </div>

      {/* Rules validated */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem',
        fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Rules Checked
        </div>
        {[
          { rule: 'No duplicate patient / ambulance / hospital registration', ok: true },
          { rule: 'All referenced entities must be pre-registered', ok: true },
          { rule: 'Ambulance must be AVAILABLE before dispatch', ok: true },
          { rule: 'Ambulance must be DISPATCHED before arrival', ok: true },
          { rule: 'Patient must be IN_TRANSIT before transfer', ok: true },
          { rule: 'Valid severity levels (LOW / MEDIUM / HIGH / CRITICAL)', ok: true },
          { rule: 'Valid priority levels (LOW / MEDIUM / HIGH)', ok: true },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            padding: '0.22rem 0', color: 'var(--text-secondary)',
          }}>
            <span style={{ color: 'var(--success)' }}>✓</span>
            {r.rule}
          </div>
        ))}
      </div>

      {/* Errors */}
      {semErrors.length > 0 && (
        <>
          <div className="sym-section-title">Semantic Errors</div>
          {semErrors.map((err, i) => (
            <div key={i} className="error-entry">
              <div className="error-header">
                <span className="error-type">SEMANTIC ERROR</span>
                <span className="error-line">Line {err.line}</span>
              </div>
              <div className="error-message">{err.message}</div>
              {err.expected && (
                <div className="error-detail">
                  Expected: <span className="error-expected">{err.expected}</span>
                </div>
              )}
              {err.received && err.received !== err.expected && (
                <div className="error-detail">
                  Got: <span className="error-received">{err.received}</span>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {ok && statementCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--success)', fontSize: '0.84rem', marginTop: '0.5rem',
        }}>
          <span>✓</span>
          All semantic constraints satisfied. Program is semantically valid.
        </div>
      )}

      {statementCount === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🧠</div>
          <div className="empty-state-title">No analysis yet</div>
          <div className="empty-state-desc">Compile a program to see semantic analysis results.</div>
        </div>
      )}
    </div>
  );
}
