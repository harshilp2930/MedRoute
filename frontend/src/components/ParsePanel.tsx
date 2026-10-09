/**
 * components/ParsePanel.tsx
 * Displays parse-tree nodes from the Bison parser
 */
import type { ParseNode, CompilerError } from '../types';

interface Props {
  nodes: ParseNode[];
  errors: CompilerError[];
  statementCount: number;
  parseOk: boolean;
}

function stmtIcon(stmt: string) {
  const map: Record<string, string> = {
    PATIENT: '🧑‍⚕️', LOCATION: '📍', SEVERITY: '⚠️',
    AMBULANCE: '🚑', HOSPITAL: '🏥', DISPATCH: '🚨',
    ROUTE: '🛣️', PRIORITY: '🔺', STATUS: '📊',
    ARRIVE: '✅', TRANSFER: '🔄', CANCEL: '❌', REPORT: '📋',
  };
  return map[stmt] || '●';
}

function stmtColour(stmt: string) {
  const map: Record<string, string> = {
    PATIENT: 'var(--tok-identifier)', AMBULANCE: 'var(--accent)',
    HOSPITAL: 'var(--success)', DISPATCH: 'var(--danger)',
    ARRIVE: 'var(--success)', TRANSFER: 'var(--warning)',
    CANCEL: 'var(--danger)', REPORT: 'var(--info)',
    SEVERITY: 'var(--tok-severity)', PRIORITY: 'var(--tok-severity)',
    LOCATION: 'var(--text-secondary)', ROUTE: 'var(--text-secondary)',
    STATUS: 'var(--text-secondary)',
  };
  return map[stmt] || 'var(--text-primary)';
}

export function ParsePanel({ nodes, errors, statementCount, parseOk }: Props) {
  const syntaxErrors = errors.filter(e => e.type === 'SYNTAX');

  return (
    <div className="fade-in">
      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div className={`badge ${parseOk ? 'badge-success' : 'badge-error'}`}>
          {parseOk ? '✓ SYNTAX OK' : '✗ SYNTAX FAILED'}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Statements parsed: <strong style={{ color: 'var(--text-primary)' }}>{statementCount}</strong>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Syntax errors: <strong style={{ color: syntaxErrors.length ? 'var(--danger)' : 'var(--success)' }}>
            {syntaxErrors.length}
          </strong>
        </span>
      </div>

      {/* Syntax errors */}
      {syntaxErrors.map((err, i) => (
        <div key={i} className="error-entry" style={{ marginBottom: '0.5rem' }}>
          <div className="error-header">
            <span className="error-type">SYNTAX ERROR</span>
            <span className="error-line">Line {err.line}</span>
          </div>
          <div className="error-message">{err.message}</div>
        </div>
      ))}

      {/* Parse tree nodes */}
      {nodes.length > 0 && (
        <>
          <div className="sym-section-title" style={{ marginTop: '0.5rem' }}>Parse Tree Nodes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {nodes.map((node, i) => (
              <div key={i} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${stmtColour(node.stmt)}`,
                borderRadius: '6px',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.82rem',
              }}>
                <span>{stmtIcon(node.stmt)}</span>
                <span style={{ color: stmtColour(node.stmt), fontWeight: 700, minWidth: '80px' }}
                      className="mono">
                  {node.stmt}
                </span>
                <span style={{ color: 'var(--tok-identifier)' }} className="mono">
                  {node.id || node.ambulance || ''}
                </span>
                {(node.patient || node.hospital) && (
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                )}
                {node.patient && (
                  <span style={{ color: 'var(--tok-identifier)' }} className="mono">{node.patient}</span>
                )}
                {node.hospital && (
                  <span style={{ color: 'var(--tok-identifier)' }} className="mono">{node.hospital}</span>
                )}
                {node.severity && (
                  <span style={{ color: 'var(--tok-severity)' }} className="mono">{node.severity}</span>
                )}
                {node.priority && (
                  <span style={{ color: 'var(--tok-severity)' }} className="mono">{node.priority}</span>
                )}
                {node.location && (
                  <span style={{ color: 'var(--tok-string)' }}>"{node.location}"</span>
                )}
                {node.name && (
                  <span style={{ color: 'var(--tok-string)' }}>"{node.name}"</span>
                )}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  line {node.line}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!nodes.length && !syntaxErrors.length && (
        <div className="empty-state">
          <div className="empty-state-icon">🌲</div>
          <div className="empty-state-title">No parse tree yet</div>
          <div className="empty-state-desc">Compile a program to see parsed statements.</div>
        </div>
      )}
    </div>
  );
}
