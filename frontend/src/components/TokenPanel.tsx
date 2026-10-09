/**
 * components/TokenPanel.tsx
 * Displays the token stream produced by the Flex lexer
 */
import type { Token } from '../types';

interface Props { tokens: Token[] }

function tokenClass(type: string) {
  return `tok-${type}`;
}

function friendlyType(type: string): string {
  return type
    .replace('KEYWORD_', '')
    .replace('SEVERITY_', '')
    .replace('PRIORITY_', '')
    .replace('OP_', '');
}

export function TokenPanel({ tokens }: Props) {
  if (!tokens.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔠</div>
        <div className="empty-state-title">No tokens yet</div>
        <div className="empty-state-desc">Compile a MedRoute program to see the token stream.</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {tokens.length} tokens generated
      </div>
      <table className="token-table">
        <thead>
          <tr>
            <th style={{ width: '3.5rem' }}>LINE</th>
            <th>LEXEME</th>
            <th>TOKEN TYPE</th>
            <th>CATEGORY</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tok, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{tok.line}</td>
              <td>
                <span className={`mono ${tokenClass(tok.type)}`}>{tok.lexeme}</span>
              </td>
              <td>
                <span className={`mono ${tokenClass(tok.type)}`} style={{ fontSize: '0.76rem' }}>
                  {tok.type}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                {friendlyType(tok.type)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
