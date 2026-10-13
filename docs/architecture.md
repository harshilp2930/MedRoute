# MedRoute Compiler Architecture

## Overview

The MedRoute compiler is a multi-phase domain-specific language compiler implemented in **C**, utilizing **Flex** for lexical analysis and **Bison** for syntax parsing.

The architecture follows classical compiler construction principles, separated into distinct modular subsystems:

```
Source Code (.med)
      │
      ▼
┌──────────────┐
│   lexer.l    │  (Lexical Analysis - Flex)
└──────┬───────┘
       │ Tokens
       ▼
┌──────────────┐
│   parser.y   │  (Syntax Analysis - Bison)
└──────┬───────┘
       │ Parse Tree & AST
       ▼
┌──────────────┐
│  semantic.c  │  (Semantic Analysis & Symbol Table)
└──────┬───────┘
       │ Validated AST & Context
       ▼
┌──────────────┐
│intermediate.c│  (Intermediate Code Generation)
└──────┬───────┘
       │ IR Quadruples
       ▼
┌──────────────┐
│  executor.c  │  (Simulation Engine & Execution)
└──────┬───────┘
       │
  ┌────┴────────────┐
  ▼                 ▼
Formatted Output   Structured JSON
(--text mode)      (Full Phase Dump)
```

---

## Compiler Phases

### 1. Lexical Analyzer (`lexer.l`, `tokens.h`)
- Reads the character stream from the source `.med` file.
- Uses regular expressions to match language keywords (`PATIENT`, `AMBULANCE`, `HOSPITAL`, `LOCATION`, `SEVERITY`, `DISTANCE`, `SPEED`, `DISPATCH`, `ROUTE`, `PRIORITY`, `STATUS`, `TRANSFER`, `REPORT`).
- Recognizes entity identifiers (`P101`, `A12`, `H01`), integer literals, quoted string literals, and whitespace/comments.
- Tracks line numbers (`yylineno`) for precise error reporting.
- Maintains a token stream capable of serializing into JSON or feeding directly into the parser.

### 2. Syntax Analyzer (`parser.y`)
- Implements a context-free LALR(1) grammar using GNU Bison.
- Defines grammar rules for declarations (patients, ambulances, hospitals), property assignments (locations, severity levels, distances, speeds), and action commands (`DISPATCH`, `ROUTE`, `TRANSFER`, `REPORT`).
- Constructs a structured parse tree.
- Incorporates error productions (`error` token) to report syntax errors cleanly and attempt synchronization recovery.

### 3. Symbol Table & Semantic Analyzer (`symbol_table.c/h`, `semantic.c/h`)
- **Symbol Table**: Dynamic data structures tracking registered entities:
  - **Patients**: ID, Location, Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), State (`UNASSIGNED`, `ASSIGNED`, `TRANSFERRED`), assigned Ambulance, destination Hospital.
  - **Ambulances**: ID, State (`AVAILABLE`, `DISPATCHED`, `BUSY`), assigned Patient, target Hospital, Priority, Speed (km/h), Distance (km), ETA (min).
  - **Hospitals**: ID, Name, Status (`ACTIVE`, `FULL`).
- **Semantic Validation**:
  - Entity existence verification (cannot dispatch or route an undeclared entity).
  - Redefinition prevention (cannot declare the same patient or ambulance twice).
  - State compatibility (cannot dispatch an ambulance that is already busy).
  - Domain constraints (distance and speed must be strictly positive values).
  - Automatic priority derivation based on patient severity (e.g. `CRITICAL` -> `HIGH` priority dispatch).

### 4. Intermediate Code Generator (`intermediate.c/h`)
- Translates validated AST nodes into a linear sequence of 3-address/quadruple IR instructions.
- IR opcodes include:
  - `REGISTER_PATIENT`, `SET_LOCATION`, `SET_SEVERITY`
  - `REGISTER_AMBULANCE`, `REGISTER_HOSPITAL`
  - `DISTANCE`, `SPEED`
  - `DISPATCH`, `ASSIGN_ROUTE`, `TRANSFER`, `REPORT`
- Decouples front-end language syntax from downstream execution logic.

### 5. Execution Engine (`executor.c/h`)
- Simulates the emergency response logistics sequentially based on the generated IR.
- Calculates estimated time of arrival:
  $$\text{ETA (minutes)} = \left(\frac{\text{Distance (km)}}{\text{Speed (km/h)}}\right) \times 60$$
- Transitions ambulance and patient states in real time.
- Emits detailed dispatch manifests, route notifications, and hospital handoff confirmations.

### 6. Output Modes (`main.c`)
- **Standard Mode (JSON)**: Serializes the entire compilation pipeline (tokens, parse tree, symbol table, IR quadruples, execution log) for machine readability and external integration.
- **`--text` Mode**: Emits a human-readable, clean terminal log formatted with dispatch banners and system report summaries.
