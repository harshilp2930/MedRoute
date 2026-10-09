/**
 * types.ts
 * MedRoute Frontend — Shared TypeScript types
 */

export interface Token {
  line: number;
  lexeme: string;
  type: string;
}

export interface ParseNode {
  stmt: string;
  id?: string;
  ambulance?: string;
  patient?: string;
  hospital?: string;
  severity?: string;
  priority?: string;
  location?: string;
  name?: string;
  line: number;
}

export interface CompilerError {
  type: 'LEXICAL' | 'SYNTAX' | 'SEMANTIC' | 'EXECUTION';
  line: number;
  message: string;
  expected: string;
  received: string;
}

export interface PatientRecord {
  id: string;
  location: string;
  severity: string;
  state: string;
  ambulance: string;
  hospital: string;
}

export interface AmbulanceRecord {
  id: string;
  state: string;
  patient: string;
  hospital: string;
  priority: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  status: string;
}

export interface SymbolTable {
  patients: PatientRecord[];
  ambulances: AmbulanceRecord[];
  hospitals: HospitalRecord[];
}

export interface IRInstruction {
  index: number;
  opcode: string;
  arg1: string;
  arg2: string;
  arg3: string;
  line: number;
}

export interface ExecLogEntry {
  index: number;
  success: boolean;
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  log: ExecLogEntry[];
  summary: {
    total_patients?: number;
    total_ambulances?: number;
    total_hospitals?: number;
  };
}

export type CompilerStatus =
  | 'SUCCESS'
  | 'SYNTAX_ERROR'
  | 'SEMANTIC_ERROR'
  | 'LEXICAL_ERROR'
  | 'FILE_ERROR'
  | null;

export interface CompileResult {
  status: CompilerStatus;
  statementCount: number;
  tokens: Token[];
  parseTree: ParseNode[];
  errors: CompilerError[];
  symbolTable: SymbolTable;
  ir: IRInstruction[];
  execution: ExecutionResult;
}

export type StageStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  status: StageStatus;
}

export type ActiveTab = 'tokens' | 'parse' | 'semantic' | 'symtable' | 'ir' | 'execution' | 'map';

export type ActiveView = 'editor' | 'dashboard' | 'reference' | 'history';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  source: string;
  status: CompilerStatus;
  statementCount: number;
  errorCount: number;
}
