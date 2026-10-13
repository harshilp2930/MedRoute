# MedRoute – Emergency Ambulance Dispatch Language Compiler

**MedRoute is a domain-specific programming language (DSL) and compiler that parses, validates, and simulates emergency ambulance dispatch instructions.**

This project is a complete, production-grade **Compiler Design Lab Project** implemented in **C**, using **Flex (Lex)** and **Bison (Yacc)**. It systematically demonstrates all standard phases of modern compiler architecture: lexical analysis, syntax parsing, semantic verification, symbol table management, intermediate code generation (IR), and a stateful execution/simulation engine.

---

## 🌟 Core Concept

In municipal emergency systems, dispatch logistics are often driven by scripts and procedural triggers. **MedRoute** replaces ad-hoc operations with a structured Domain-Specific Language (DSL) specifically designed for emergency medical dispatch.

A MedRoute program declares patients, ambulances, hospitals, speeds, and distances, and issues real-time commands such as `DISPATCH`, `ROUTE`, `TRANSFER`, and `REPORT`. The compiler verifies syntactic and semantic correctness (preventing illegal transitions or uninitialized entity dispatches) and executes the simulated operations with automatic ETA and priority calculations.

### Example MedRoute Program (`demo.med`)

```medroute
PATIENT P101
LOCATION P101 "Central Station"
SEVERITY P101 CRITICAL

PATIENT P102
LOCATION P102 "Highway 9 Collision"
SEVERITY P102 HIGH

PATIENT P103
LOCATION P103 "Downtown Cafe"
SEVERITY P103 LOW

AMBULANCE A12
AMBULANCE A15
AMBULANCE A99

HOSPITAL H01 "City Hospital"
HOSPITAL H02 "General Medical Center"

DISTANCE A12 P101 10
SPEED A12 60

DISTANCE A15 P102 15
SPEED A15 45

DISTANCE A99 P103 2
SPEED A99 30

DISPATCH A12 P101
ROUTE A12 H01

DISPATCH A15 P102
ROUTE A15 H02

DISPATCH A99 P103
ROUTE A99 H01

REPORT
```

---

## 🏗️ The Compilation Pipeline

The MedRoute compiler executes all standard phases of language processing:

```
                  ┌───────────────────────────────┐
                  │       Source Code (.med)      │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │   Lexical Analysis (Flex)     │ ──► Tokens stream
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │     Syntax Analysis (Bison)   │ ──► Parse Tree & AST
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Semantic Analysis & SymTable  │ ──► Type & State Validation
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Intermediate Code Generation  │ ──► Quadruples / IR Instructions
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │     Execution Engine & Sim    │ ──► State Transitions & Simulation
                  └──────────────┬────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          Terminal Execution Report      Structured JSON
              (`--text` mode)               (AST / Pipeline dump)
```

1. **Lexical Analysis (`lexer.l`)**: Flex tokenizes keywords (`PATIENT`, `AMBULANCE`, `HOSPITAL`, `DISPATCH`, `ROUTE`, `REPORT`, etc.), identifiers, string literals, numbers, and symbols while tracking line numbers.
2. **Syntax Analysis (`parser.y`)**: Bison grammar enforces valid statement constructs, builds the parse tree, and recovers gracefully from syntax errors.
3. **Semantic Analysis (`semantic.c`, `symbol_table.c`)**: Validates domain logic and prevents runtime errors:
   - Entity existence check (no dispatching undeclared ambulances or patients).
   - Duplicate declarations check.
   - Status transitions (an ambulance must be `AVAILABLE` to be dispatched; a patient must be dispatched before assigned a route).
   - Speed must be positive; distance must be positive.
   - Dynamic priority assignment based on patient condition (CRITICAL/HIGH/MEDIUM/LOW).
4. **Intermediate Representation (`intermediate.c`)**: Generates linear 3-address/quadruple IR instructions (`REGISTER_PATIENT`, `DISPATCH`, `ASSIGN_ROUTE`, etc.).
5. **Execution & Simulation (`executor.c`)**: Executes the IR sequentially, calculates ETAs based on speed and distance (`ETA = (Distance / Speed) * 60`), manages state changes, and produces dispatch summaries.

---

## 📂 Project Structure

```
Compiler_LAB/
│
├── compiler/                  # Core Compiler Implementation (C / Flex / Bison)
│   ├── lexer.l                # Flex lexical analyzer specification
│   ├── parser.y               # Bison context-free grammar specification
│   ├── tokens.h               # Token definitions and JSON serialization
│   ├── symbol_table.h/.c      # Symbol table data structures and lookup
│   ├── semantic.h/.c          # Semantic analysis and domain rule verification
│   ├── intermediate.h/.c      # Intermediate representation (IR) generator
│   ├── executor.h/.c          # Simulation engine, ETA logic, and state runner
│   ├── main.c                 # Compiler CLI entry point
│   ├── Makefile               # Automated build and test script
│   └── medroute.exe           # Standalone executable binary (Windows)
│
├── examples/                  # Comprehensive test scenarios and benchmarks
│   ├── demo.med               # Multi-entity dispatch with automatic ETAs and report
│   ├── critical_emergency.med # Single critical patient immediate dispatch scenario
│   ├── multiple_patients.med  # Concurrent multi-ambulance priority handling
│   ├── syntax_errors.med      # Negative test cases for syntax error detection
│   └── semantic_errors.med    # Negative test cases for semantic error detection
│
├── docs/                      # Formal project documentation
│   ├── architecture.md        # Technical architectural breakdown of each compiler pass
│   └── language_specification.md # Formal EBNF grammar and language specification
│
├── .gitignore                 # Git ignore rules for build logs and temp files
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### 1. Running the Pre-compiled Binary (Windows)

The repository includes a ready-to-use executable: [`compiler/medroute.exe`](file:///d:/Compiler_LAB/compiler/medroute.exe).

#### Text Report Mode (`--text`):
Produces a clean terminal simulation report:
```bash
./compiler/medroute.exe examples/demo.med --text
```

**Output:**
```
Patient P101 registered successfully.
Location of patient P101 set to "Central Station".
Severity of patient P101 set to CRITICAL.
...
----------------------------------------
[DISPATCH SUCCESS]
 Patient:    P101
 Ambulance:  A12
 Distance:   10 km
 Speed:      60 km/h
 ETA:        10 minutes
----------------------------------------
[ROUTE ASSIGNED] Ambulance A12 -> Hospital H01 (City Hospital)
...
========================================
REPORT GENERATED: 3 patient(s), 3 ambulance(s), 2 hospital(s).
========================================
```

#### JSON Pipeline Mode:
Outputs the complete compilation pipeline including tokens, parse tree, symbol table, IR quadruples, and execution logs in JSON:
```bash
./compiler/medroute.exe examples/demo.med
```

---

### 2. Building from Source

#### Prerequisites
- **GCC** (MinGW for Windows or standard GCC on Linux/macOS)
- **Flex** (Fast Lexical Analyzer)
- **Bison** (GNU Parser Generator)
- **Make**

#### Compilation Steps
Navigate to the `compiler` directory and build with `make`:
```bash
cd compiler
make
```

To clean generated objects and rebuild:
```bash
make clean
make
```

To run all automated test suites:
```bash
make test
```

---

## 🧪 Test Scenarios

The `examples/` directory contains standard test scenarios:

| File | Scenario | Expected Result |
| :--- | :--- | :--- |
| [`demo.med`](file:///d:/Compiler_LAB/examples/demo.med) | 3 patients, 3 ambulances, 2 hospitals, ETAs & dispatches | **PASS** (Full execution report) |
| [`critical_emergency.med`](file:///d:/Compiler_LAB/examples/critical_emergency.med) | High severity incident response | **PASS** (Valid dispatch) |
| [`multiple_patients.med`](file:///d:/Compiler_LAB/examples/multiple_patients.med) | Multiple simultaneous incidents | **PASS** (Multi-entity simulation) |
| [`syntax_errors.med`](file:///d:/Compiler_LAB/examples/syntax_errors.med) | Malformed statements & invalid tokens | **FAIL** (Syntax error reported) |
| [`semantic_errors.med`](file:///d:/Compiler_LAB/examples/semantic_errors.med) | Dispatching undeclared ambulance / invalid state | **FAIL** (Semantic error reported) |

---

## 🎓 Academic Context

This project was built as an advanced **Compiler Design Lab Project**, demonstrating end-to-end compiler construction principles using industry-standard tools (Flex & Bison) applied to a domain-specific emergency medical logistics language.
