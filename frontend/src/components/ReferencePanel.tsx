/**
 * components/ReferencePanel.tsx
 * Built-in MedRoute language reference documentation
 */

interface RefEntry {
  keyword: string;
  purpose: string;
  syntax: string;
  example: string;
  rules: string[];
}

const REFERENCE: RefEntry[] = [
  {
    keyword: 'PATIENT',
    purpose: 'Registers a new emergency patient in the system.',
    syntax: 'PATIENT <patient_id>',
    example: 'PATIENT P101',
    rules: ['patient_id must be a unique identifier.', 'Cannot register the same patient twice.'],
  },
  {
    keyword: 'LOCATION',
    purpose: "Sets the patient's physical address for ambulance dispatch.",
    syntax: 'LOCATION <patient_id> "<location>"',
    example: 'LOCATION P101 "Sardar Patel Road"',
    rules: ['Patient must already be registered.', 'Location must be a quoted string literal.'],
  },
  {
    keyword: 'SEVERITY',
    purpose: 'Assigns the medical severity level to a patient.',
    syntax: 'SEVERITY <patient_id> LOW|MEDIUM|HIGH|CRITICAL',
    example: 'SEVERITY P101 CRITICAL',
    rules: ['Patient must be registered.', 'Only LOW, MEDIUM, HIGH, CRITICAL are valid.'],
  },
  {
    keyword: 'AMBULANCE',
    purpose: 'Registers a new ambulance unit. Initial state: AVAILABLE.',
    syntax: 'AMBULANCE <ambulance_id>',
    example: 'AMBULANCE A12',
    rules: ['ambulance_id must be unique.', 'Initial state is always AVAILABLE.'],
  },
  {
    keyword: 'HOSPITAL',
    purpose: 'Registers a hospital as a valid dispatch destination.',
    syntax: 'HOSPITAL <hospital_id> "<name>"',
    example: 'HOSPITAL H01 "City Hospital"',
    rules: ['hospital_id must be unique.', 'Hospital name must be a quoted string.'],
  },
  {
    keyword: 'DISPATCH',
    purpose: 'Assigns an ambulance to respond to a patient.',
    syntax: 'DISPATCH <ambulance_id> <patient_id>',
    example: 'DISPATCH A12 P101',
    rules: [
      'Ambulance must be registered.',
      'Patient must be registered.',
      'Ambulance must be in AVAILABLE state.',
      'Patient must not already have an active ambulance.',
    ],
  },
  {
    keyword: 'ROUTE',
    purpose: "Assigns the destination hospital for the ambulance's route.",
    syntax: 'ROUTE <ambulance_id> <hospital_id>',
    example: 'ROUTE A12 H01',
    rules: [
      'Ambulance must be registered.',
      'Hospital must be registered.',
      'Ambulance must be in DISPATCHED state.',
    ],
  },
  {
    keyword: 'PRIORITY',
    purpose: 'Sets the emergency priority of an ambulance dispatch.',
    syntax: 'PRIORITY <ambulance_id> LOW|MEDIUM|HIGH',
    example: 'PRIORITY A12 HIGH',
    rules: [
      'Ambulance must be registered.',
      'Only LOW, MEDIUM, HIGH are valid priority levels.',
    ],
  },
  {
    keyword: 'STATUS',
    purpose: "Queries an ambulance's current state and assignments.",
    syntax: 'STATUS <ambulance_id>',
    example: 'STATUS A12',
    rules: ['Ambulance must be registered.'],
  },
  {
    keyword: 'ARRIVE',
    purpose: 'Marks an ambulance as arrived at the patient location.',
    syntax: 'ARRIVE <ambulance_id>',
    example: 'ARRIVE A12',
    rules: [
      'Ambulance must be registered.',
      'Ambulance must be in DISPATCHED state.',
      'Patient state transitions from ASSIGNED to IN_TRANSIT.',
    ],
  },
  {
    keyword: 'TRANSFER',
    purpose: 'Records patient transfer to the destination hospital.',
    syntax: 'TRANSFER <patient_id> <hospital_id>',
    example: 'TRANSFER P101 H01',
    rules: [
      'Patient must be registered.',
      'Hospital must be registered.',
      'Patient must be in IN_TRANSIT state (ambulance must have arrived).',
    ],
  },
  {
    keyword: 'CANCEL',
    purpose: 'Cancels an ambulance dispatch and resets patient state.',
    syntax: 'CANCEL <ambulance_id>',
    example: 'CANCEL A12',
    rules: [
      'Ambulance must be registered.',
      'Cannot cancel COMPLETED or already CANCELLED dispatches.',
    ],
  },
  {
    keyword: 'REPORT',
    purpose: 'Prints a full system state report including all entities.',
    syntax: 'REPORT',
    example: 'REPORT',
    rules: ['Always semantically valid.', 'Outputs current state of all registered entities.'],
  },
];

export function ReferencePanel() {
  return (
    <div style={{ padding: '1rem', overflowY: 'auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>
          MedRoute Language Reference
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Complete documentation for all {REFERENCE.length} keywords in the MedRoute DSL.
          Identifiers follow the pattern: <span className="mono" style={{ color: 'var(--tok-identifier)' }}>[A-Z][A-Z0-9_]*</span>
        </div>
      </div>

      <div className="ref-grid">
        {REFERENCE.map((entry) => (
          <div key={entry.keyword} className="ref-card">
            <div className="ref-keyword">{entry.keyword}</div>
            <div className="ref-purpose">{entry.purpose}</div>
            <div className="ref-syntax">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '2px' }}>
                SYNTAX
              </div>
              {entry.syntax}
            </div>
            <div className="ref-syntax" style={{ borderColor: 'var(--tok-string)', marginTop: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '2px' }}>
                EXAMPLE
              </div>
              <span style={{ color: 'var(--tok-string)' }}>{entry.example}</span>
            </div>
            <div className="ref-rules" style={{ marginTop: '0.4rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.74rem', marginBottom: '4px' }}>
                Semantic Rules:
              </div>
              <ul>
                {entry.rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
