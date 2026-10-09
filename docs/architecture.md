# MedRoute Architecture

## High-Level Architecture

The MedRoute project is a modern compiler infrastructure that bridges traditional systems programming with a rich web-based frontend.

### 1. The Compiler Core (Backend/System)
Written in C and C++, the compiler performs the heavy lifting.
*   **Lexical Analyzer (`lexer.l`)**: Uses Flex to read the `.med` source files and convert character streams into a sequence of tokens.
*   **Syntax Analyzer (`parser.y`)**: Uses Bison to ensure the tokens form valid statements according to the MedRoute grammar, generating an Abstract Syntax Tree (AST).
*   **Symbol Table (`symbol_table.c/h`)**: A specialized data structure tracking all declared entities (Patients, Hospitals, Ambulances) and their real-time states (e.g., coordinates, availability, severity).
*   **Semantic Analyzer (`semantic.c/h`)**: Enforces business logic. For example, it ensures you cannot dispatch an ambulance to a hospital without it first picking up a patient.
*   **Intermediate Representation (`intermediate.c/h`)**: Converts the validated AST into a linear sequence of execution instructions (IR).
*   **Execution Engine (`executor.c/h`)**: Iterates over the IR to simulate the dispatch scenario, updating state and producing the final report.

### 2. The IDE Frontend (Web/UI)
Built with React and TypeScript, providing an interactive environment to write and debug MedRoute programs.
*   **Editor**: Integrated Monaco Editor (the core of VS Code) with custom syntax highlighting for MedRoute.
*   **Pipeline Visualizer**: Panels that dynamically display the output of each compiler phase (Tokens, Parse Tree, Symbol Table, IR) in real-time as the user types.
*   **Simulation Map**: A graphical interface that animates the execution engine's output, showing ambulances moving to patients and hospitals.

### 3. The Bridge (API)
Since browsers cannot natively run C binaries easily (without WebAssembly), a lightweight Node.js/Python API server acts as the middleman.
*   It receives the source code from the React frontend.
*   It invokes the MedRoute C compiler binary as a child process.
*   It captures the standard output, JSON logs, and errors, returning them to the frontend for visualization.

## Data Flow
`User Input (React)` -> `API (Node.js)` -> `Compiler Binary (C)` -> `Tokens -> AST -> Symbol Table -> IR -> Execution Output` -> `API (Node.js)` -> `Visuals (React)`
