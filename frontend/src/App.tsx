import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { compileSource, fetchFiles, saveFile, deleteFile } from './api';
import { registerMedRouteLanguage } from './medroute-language';
import type { CompileResult } from './types';

const DEFAULT_CODE = `// MedRoute — Critical Emergency Scenario

PATIENT P101
LOCATION P101 "Sardar Patel Road"
SEVERITY P101 CRITICAL

AMBULANCE A12
HOSPITAL H01 "City Hospital"

DISPATCH A12 P101
ROUTE A12 H01
PRIORITY A12 HIGH

STATUS A12
TRANSFER P101 H01
STATUS A12
REPORT
`;

interface SavedFile { name: string; content: string; savedAt: Date; }

type OTab = 'exec' | 'tokens' | 'ir' | 'sym' | 'errors';

const SEV_C: Record<string, string> = {
  CRITICAL: '#e5534b', HIGH: '#e09440', MEDIUM: '#c9a73d', LOW: '#57ab5a',
};
const STATE_C: Record<string, string> = {
  AVAILABLE: '#57ab5a', DISPATCHED: '#c9a73d',
  COMPLETED: '#57ab5a', REGISTERED: '#768390',
  IN_TRANSIT: '#e09440', TRANSFERRED: '#57ab5a', ACTIVE: '#57ab5a',
};
const IR_C: Record<string, string> = {
  REGISTER_PATIENT: '#539bf5', SET_LOCATION: '#768390', SET_SEVERITY: '#e09440',
  REGISTER_AMBULANCE: '#57ab5a', REGISTER_HOSPITAL: '#57ab5a', DISPATCH: '#e5534b',
  ASSIGN_ROUTE: '#539bf5', SET_PRIORITY: '#e09440', STATUS: '#768390',
  DISTANCE: '#57ab5a', TRANSFER: '#c9a73d', SPEED: '#e5534b', REPORT: '#8b949e',
};

function Badge({ val, map }: { val: string; map: Record<string, string> }) {
  const c = map[val] || '#768390';
  return (
    <span style={{
      color: c, fontSize: 11, fontWeight: 500,
      background: `${c}14`, padding: '1px 6px', borderRadius: 3,
      fontFamily: 'var(--mono)', border: `1px solid ${c}28`,
    }}>{val || '—'}</span>
  );
}

function TokTag({ type }: { type: string }) {
  const t = type.replace('KEYWORD_', '').replace('SEVERITY_', '').replace('PRIORITY_', '');
  const kw = type.startsWith('KEYWORD');
  const sev = type.startsWith('SEVERITY') || type.startsWith('PRIORITY');
  const str = type === 'STRING';
  const id = type === 'IDENTIFIER';
  const c = kw ? '#e5534b' : sev ? '#e09440' : str ? '#c9a73d' : id ? '#539bf5' : '#768390';
  return (
    <span style={{ color: c, fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500 }}>{t}</span>
  );
}

export default function App() {
  const [code, setCode]           = useState(DEFAULT_CODE);
  const [result, setResult]       = useState<CompileResult | null>(null);
  const [busy, setBusy]           = useState(false);
  const [files, setFiles]         = useState<SavedFile[]>([]);
  const [active, setActive]       = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [showSave, setShowSave]   = useState(false);
  const [fname, setFname]         = useState('');
  const [tab, setTab]             = useState<OTab>('exec');
  const [theme, setTheme]         = useState<'dark' | 'light'>(() => (localStorage.getItem('medroute_theme') as any) || 'dark');
  const filesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFiles().then(setFiles).catch(console.error);
  }, []);
  useEffect(() => { 
    localStorage.setItem('medroute_theme', theme); 
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (!showFiles) return;
    const h = (e: MouseEvent) => {
      if (filesRef.current && !filesRef.current.contains(e.target as Node)) setShowFiles(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showFiles]);

  const handleMount = useCallback((_ed: any, mon: any) => {
    registerMedRouteLanguage(mon);
    // Initial theme is set by the Editor component prop
  }, []);

  const run = useCallback(async () => {
    setBusy(true); setResult(null);
    try {
      const r = await compileSource(code);
      setResult(r);
      setTab(r.errors?.length ? 'errors' : 'exec');
    } catch (e: any) {
      setResult({
        status: 'FILE_ERROR', statementCount: 0, tokens: [], parseTree: [],
        errors: [{ type: 'EXECUTION', line: 0,
          message: e?.response?.data?.error || 'Could not reach backend on port 3001.',
          expected: '', received: e?.message || '' }],
        symbolTable: { patients: [], ambulances: [], hospitals: [] },
        ir: [], execution: { success: false, log: [], summary: {} },
      } as any);
      setTab('errors');
    } finally { setBusy(false); }
  }, [code]);

  const doSave = useCallback(async () => {
    if (!fname.trim()) return;
    const n = fname.trim().endsWith('.med') ? fname.trim() : fname.trim() + '.med';
    try {
      const saved = await saveFile(n, code);
      setFiles(p => {
        const i = p.findIndex(f => f.name === n);
        return i >= 0
          ? p.map((f, j) => j === i ? saved : f)
          : [saved, ...p];
      });
      setActive(n); setFname(''); setShowSave(false);
    } catch (e) { console.error('Save failed', e); }
  }, [code, fname]);

  const quickSave = useCallback(async () => {
    if (!active) { setShowSave(true); return; }
    try {
      const saved = await saveFile(active, code);
      setFiles(p => p.map(f => f.name === active ? saved : f));
    } catch (e) { console.error('Save failed', e); }
  }, [active, code]);

  const ok = result?.status === 'SUCCESS';
  const errs = result?.errors?.length ?? 0;

  const pipeline: { label: string; ok: boolean; skip: boolean }[] = [
    { label: 'Lexer',    ok: !!(result?.tokens?.length),           skip: false },
    { label: 'Parser',   ok: !!(result?.parseTree?.length),         skip: result?.status === 'LEXICAL_ERROR' },
    { label: 'Semantic', ok: ok || result?.status === 'SEMANTIC_ERROR', skip: result?.status === 'SYNTAX_ERROR' },
    { label: 'IR',       ok: !!(result?.ir?.length),                skip: !ok },
    { label: 'Execute',  ok: !!(result?.execution?.success),        skip: !ok },
  ];

  return (
    <>
      <style>{`
        :root {
          --bg:       #0d1117;
          --surface:  #161b22;
          --border:   #21262d;
          --border2:  #30363d;
          --text:     #e6edf3;
          --muted:    #8b949e;
          --dim:      #484f58;
          --mono:     'JetBrains Mono', 'Fira Code', monospace;
        }
        .light {
          --bg:       #ffffff;
          --surface:  #f6f8fa;
          --border:   #d0d7de;
          --border2:  #afb8c1;
          --text:     #374151;
          --muted:    #6b7280;
          --dim:      #9ca3af;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; font-size: 13px; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button { font-family: inherit; }
        .frow:hover  { background: rgba(255,255,255,.04) !important; }
        .frow:hover .fdel { opacity: 1 !important; }
        .fdel { opacity: 0 !important; transition: opacity .1s; }
        .tab-btn:hover { color: var(--text) !important; }
        .trow:hover { background: rgba(255,255,255,.03); }
      `}</style>

      <div className={theme === 'light' ? 'light' : ''} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>

        {/* ── HEADER ── */}
        <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid var(--border)', background: 'var(--surface)', userSelect: 'none' }}>
          <img src="/logo.svg" alt="logo" style={{ width: 18, height: 18, marginRight: 2 }} />
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginRight: 4 }}>MedRoute</span>
          <span style={{ color: 'var(--dim)', fontSize: 11 }}>compiler</span>

          <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 4px' }} />

          {/* Files dropdown */}
          <div style={{ position: 'relative' }} ref={filesRef}>
            <button onClick={() => setShowFiles(s => !s)}
              style={{ ...ghostBtn, color: showFiles ? 'var(--text)' : 'var(--muted)' }}>
              Files {files.length > 0 && <span style={{ color: 'var(--dim)', fontSize: 10 }}>({files.length})</span>}
            </button>

            {showFiles && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 220, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.5)', overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>Saved files</span>
                  <button onClick={() => { setShowSave(true); setShowFiles(false); }} style={{ ...ghostBtn, fontSize: 11, padding: '1px 7px' }}>New</button>
                </div>
                {files.length === 0
                  ? <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--dim)' }}>No files saved yet.</div>
                  : files.map(f => (
                    <div key={f.name} className="frow"
                      onClick={() => { setCode(f.content); setActive(f.name); setResult(null); setShowFiles(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'default', borderLeft: `2px solid ${active === f.name ? '#539bf5' : 'transparent'}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: active === f.name ? '#539bf5' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 1 }}>{f.savedAt.toLocaleTimeString()}</div>
                      </div>
                      <button className="fdel" onClick={async e => { 
                        e.stopPropagation(); 
                        try {
                          await deleteFile(f.name);
                          setFiles(p => p.filter(x => x.name !== f.name)); 
                          if (active === f.name) setActive(null); 
                        } catch (err) { console.error('Delete failed', err); }
                      }}
                        style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'default', fontSize: 11, padding: '2px 4px', borderRadius: 3 }}>×</button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Current file */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              {active ?? 'untitled.med'}
            </span>
          </div>

          {/* Actions */}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={ghostBtn} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={quickSave} style={ghostBtn}>
            {active ? 'Save' : 'Save as…'}
          </button>
          <button onClick={run} disabled={busy} style={{
            background: busy ? 'var(--border)' : '#238636',
            color: busy ? 'var(--dim)' : '#ffffff',
            border: '1px solid ' + (busy ? 'var(--border2)' : '#2ea043'),
            borderRadius: 5, padding: '4px 14px', fontSize: 12, fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'default', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {busy ? <><span style={{ display: 'inline-block', animation: 'spin .7s linear infinite' }}>⟳</span> Running</> : 'Run'}
          </button>
        </div>

        {/* ── SAVE MODAL ── */}
        {showSave && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setShowSave(false)}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: 20, width: 280, boxShadow: '0 16px 48px rgba(0,0,0,.7)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Save file</div>
              <input autoFocus value={fname} onChange={e => setFname(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSave()}
                placeholder="emergency.med"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 5, padding: '6px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--mono)', outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={doSave} style={{ flex: 1, background: '#238636', color: '#fff', border: '1px solid #2ea043', borderRadius: 5, padding: '6px', fontWeight: 600, cursor: 'default', fontSize: 12 }}>Save</button>
                <button onClick={() => setShowSave(false)} style={{ flex: 1, ...ghostBtn, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* EDITOR */}
          <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
            <div style={{ height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <span style={{ fontSize: 11, color: 'var(--dim)' }}>editor</span>
              <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>.med</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor height="100%" defaultLanguage="medroute" value={code}
                onChange={v => setCode(v ?? '')} onMount={handleMount} theme={theme === 'dark' ? 'medroute-dark' : 'medroute-light'}
                options={{
                  fontSize: 13, fontFamily: '"JetBrains Mono","Fira Code",monospace',
                  fontLigatures: true, lineNumbers: 'on', minimap: { enabled: false },
                  scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on',
                  padding: { top: 12 }, renderLineHighlight: 'line', cursorBlinking: 'blink',
                  tabSize: 2, lineDecorationsWidth: 4, glyphMargin: false,
                }}
              />
            </div>
          </div>

          {/* OUTPUT */}
          <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

            {/* Status strip */}
            {result && (
              <div style={{
                height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
                borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${ok ? '#57ab5a' : '#e5534b'}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: ok ? '#57ab5a' : '#e5534b' }}>
                  {ok ? 'OK' : 'FAILED'}
                </span>
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>{result.status?.replace(/_/g, ' ')}</span>
                <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>{result.statementCount} stmts</span>
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>{result.tokens?.length} tokens</span>
                <span style={{ color: 'var(--dim)', fontSize: 11 }}>{result.ir?.length} ir</span>
                {errs > 0 && <span style={{ color: '#e5534b', fontSize: 11 }}>{errs} error{errs > 1 ? 's' : ''}</span>}

                {/* Pipeline */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {pipeline.map((p, i) => (
                    <span key={i} title={p.label} style={{
                      fontSize: 10, color: p.skip ? 'var(--dim)' : p.ok ? '#57ab5a' : '#e5534b',
                      fontFamily: 'var(--mono)',
                    }}>
                      {p.label[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div style={{ height: 30, flexShrink: 0, display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {([
                { id: 'exec',   label: 'Execution', n: result?.execution?.log?.length },
                { id: 'tokens', label: 'Tokens',    n: result?.tokens?.length },
                { id: 'ir',     label: 'IR',        n: result?.ir?.length },
                { id: 'sym',    label: 'Symbols',   n: undefined },
                { id: 'errors', label: 'Errors',    n: errs || undefined, warn: errs > 0 },
              ] as { id: OTab; label: string; n?: number; warn?: boolean }[]).map(t => (
                <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
                  style={{
                    background: 'none', border: 'none', borderBottom: `1px solid ${tab === t.id ? '#539bf5' : 'transparent'}`,
                    padding: '0 12px', fontSize: 11, fontWeight: tab === t.id ? 600 : 400, cursor: 'default',
                    color: t.warn ? '#e5534b' : tab === t.id ? '#539bf5' : 'var(--dim)',
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'color .1s',
                  }}>
                  {t.label}
                  {t.n !== undefined && t.n > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>{t.n}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

              {/* Idle */}
              {!result && !busy && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: 'var(--dim)', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>No output</div>
                  <div style={{ fontSize: 11 }}>Press <kbd style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: 'var(--mono)' }}>Run</kbd> to compile</div>
                </div>
              )}

              {/* Busy */}
              {busy && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--dim)' }}>
                  <span style={{ display: 'inline-block', animation: 'spin .8s linear infinite', fontSize: 18, color: 'var(--muted)' }}>⟳</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Compiling…</span>
                </div>
              )}

              {result && !busy && (
                <div style={{ padding: '10px 14px' }}>

                  {/* EXECUTION */}
                  {tab === 'exec' && (
                    <div>
                      {!result.execution?.log?.length
                        ? <div style={dimText}>No execution log.</div>
                        : (
                          <div style={{ 
                            fontFamily: 'var(--mono)', fontSize: 13, 
                            background: '#0d1117', color: '#c9d1d9', 
                            padding: '16px', borderRadius: '6px', 
                            border: '1px solid #30363d',
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                            overflowX: 'auto',
                            lineHeight: 1.6
                          }}>
                            <div style={{ color: '#8b949e', marginBottom: 12 }}>
                              <span style={{ color: '#58a6ff' }}>$</span> ./medroute program.med
                            </div>
                            {result.execution.log.map((e, i) => (
                              <div key={i} style={{ color: e.success ? '#c9d1d9' : '#ff7b72', whiteSpace: 'pre-wrap' }}>
                                {e.message}
                              </div>
                            ))}
                            <div style={{ color: '#8b949e', marginTop: 12 }}>
                              <span style={{ color: '#58a6ff' }}>$</span> <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
                            </div>
                            <style>{`
                              @keyframes blink { 50% { opacity: 0; } }
                            `}</style>
                          </div>
                        )}
                      {ok && result.execution?.summary && (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                          {[
                            { label: 'Patients',   v: result.execution.summary.total_patients },
                            { label: 'Ambulances', v: result.execution.summary.total_ambulances },
                            { label: 'Hospitals',  v: result.execution.summary.total_hospitals },
                          ].map(s => (
                            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px' }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{s.v ?? 0}</div>
                              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TOKENS */}
                  {tab === 'tokens' && (
                    <table style={tbl}>
                      <thead>
                        <tr>{['Line', 'Lexeme', 'Type'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {result.tokens?.map((t, i) => (
                          <tr key={i} className="trow" style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ ...td, color: 'var(--dim)', textAlign: 'right', width: 36, fontFamily: 'var(--mono)' }}>{t.line}</td>
                            <td style={{ ...td, fontFamily: 'var(--mono)', fontWeight: 600 }}>{t.lexeme}</td>
                            <td style={td}><TokTag type={t.type} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* IR */}
                  {tab === 'ir' && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '32px 200px 60px 60px 1fr', padding: '3px 0', borderBottom: '1px solid var(--border)', color: 'var(--dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>
                        <span>#</span><span>Opcode</span><span>Arg1</span><span>Arg2</span><span>Arg3</span>
                      </div>
                      {result.ir?.map((ins, i) => (
                        <div key={i} className="trow" style={{ display: 'grid', gridTemplateColumns: '32px 200px 60px 60px 1fr', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--dim)' }}>{String(ins.index).padStart(3, '0')}</span>
                          <span style={{ color: IR_C[ins.opcode] || 'var(--text)', fontWeight: 600 }}>{ins.opcode}</span>
                          <span style={{ color: '#539bf5' }}>{ins.arg1 || ''}</span>
                          <span style={{ color: '#539bf5' }}>{ins.arg2 || ''}</span>
                          {ins.arg3 && <span style={{ color: '#c9a73d' }}>"{ins.arg3}"</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SYMBOLS */}
                  {tab === 'sym' && (
                    <div>
                      {([
                        {
                          title: 'Patients',
                          data: result.symbolTable?.patients,
                          cols: ['ID', 'Location', 'Severity', 'State', 'Ambulance', 'Hospital'],
                          row: (p: any) => [
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{p.id}</span>,
                            <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 11 }}>{p.location || '—'}</span>,
                            <Badge val={p.severity} map={SEV_C} />,
                            <Badge val={p.state} map={STATE_C} />,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{p.ambulance || '—'}</span>,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{p.hospital || '—'}</span>,
                          ],
                        },
                        {
                          title: 'Ambulances',
                          data: result.symbolTable?.ambulances,
                          cols: ['ID', 'State', 'Patient', 'Hospital', 'Priority', 'Speed (km/h)', 'Distance (km)', 'ETA (min)'],
                          row: (a: any) => [
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{a.id}</span>,
                            <Badge val={a.state} map={STATE_C} />,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{a.patient || '—'}</span>,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{a.hospital || '—'}</span>,
                            <Badge val={a.priority} map={SEV_C} />,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{a.speed > 0 ? a.speed : '—'}</span>,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{a.distance > 0 ? a.distance : '—'}</span>,
                            <span style={{ fontFamily: 'var(--mono)', color: '#c9a73d', fontWeight: 600 }}>{a.eta > 0 ? a.eta : '—'}</span>,
                          ],
                        },
                        {
                          title: 'Hospitals',
                          data: result.symbolTable?.hospitals,
                          cols: ['ID', 'Name', 'Status'],
                          row: (h: any) => [
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{h.id}</span>,
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{h.name}</span>,
                            <Badge val={h.status} map={STATE_C} />,
                          ],
                        },
                      ]).filter(s => s.data?.length > 0).map(sec => (
                        <div key={sec.title} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>{sec.title}</div>
                          <table style={tbl}>
                            <thead><tr>{sec.cols.map(c => <th key={c} style={th}>{c}</th>)}</tr></thead>
                            <tbody>{sec.data.map((row: any, i: number) => (
                              <tr key={i} className="trow" style={{ borderBottom: '1px solid var(--border)' }}>
                                {sec.row(row).map((cell, j) => <td key={j} style={td}>{cell}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      ))}
                      {!result.symbolTable?.patients?.length && !result.symbolTable?.ambulances?.length && !result.symbolTable?.hospitals?.length && (
                        <div style={dimText}>Symbol table is empty.</div>
                      )}
                    </div>
                  )}

                  {/* ERRORS */}
                  {tab === 'errors' && (
                    <div>
                      {errs === 0 ? (
                        <div style={{ fontSize: 12, color: '#57ab5a', padding: '8px 0' }}>No errors.</div>
                      ) : result.errors?.map((e, i) => (
                        <div key={i} style={{ borderLeft: '2px solid #e5534b', paddingLeft: 10, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#e5534b', textTransform: 'uppercase', letterSpacing: .4 }}>{e.type}</span>
                            {e.line > 0 && <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>:{e.line}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{e.message}</div>
                          {e.expected && (
                            <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--dim)' }}>
                              expected <span style={{ color: '#57ab5a' }}>{e.expected}</span>
                            </div>
                          )}
                          {e.received && (
                            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--dim)', marginTop: 2 }}>
                              got <span style={{ color: '#e5534b' }}>{e.received}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared style atoms ── */
const ghostBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: 5,
  padding: '3px 10px', fontSize: 12, color: 'var(--muted)', cursor: 'default',
  display: 'flex', alignItems: 'center', gap: 5,
};
const dimText: React.CSSProperties = { fontSize: 12, color: 'var(--dim)', padding: '4px 0' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const th: React.CSSProperties = { color: 'var(--dim)', fontWeight: 500, padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 };
const td: React.CSSProperties = { padding: '4px 8px', verticalAlign: 'middle' };
