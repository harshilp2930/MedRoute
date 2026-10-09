/**
 * medroute-language.ts
 * Monaco Editor — MedRoute custom language definition
 */
import type * as Monaco from 'monaco-editor';

export function registerMedRouteLanguage(monaco: typeof Monaco) {
  // Register the language
  monaco.languages.register({ id: 'medroute' });

  // Syntax highlighting tokens
  monaco.languages.setMonarchTokensProvider('medroute', {
    keywords: [
      'PATIENT', 'LOCATION', 'SEVERITY', 'AMBULANCE', 'HOSPITAL',
      'DISPATCH', 'ROUTE', 'PRIORITY', 'STATUS', 'ARRIVE',
      'TRANSFER', 'CANCEL', 'REGISTER', 'AVAILABLE', 'ASSIGN', 'REPORT'
    ],
    severityTokens: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],

    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, 'comment'],

        // String literals
        [/"([^"\\]|\\.)*"/, 'string'],

        // Keywords (must come before identifier rule)
        [/\b(PATIENT|LOCATION|SEVERITY|AMBULANCE|HOSPITAL|DISPATCH|ROUTE|PRIORITY|STATUS|ARRIVE|TRANSFER|CANCEL|REGISTER|AVAILABLE|ASSIGN|REPORT)\b/, 'keyword'],

        // Severity/Priority values
        [/\b(LOW|MEDIUM|HIGH|CRITICAL)\b/, 'type.identifier'],

        // Identifiers
        [/[A-Z][A-Z0-9_]*/, 'identifier'],

        // Numbers
        [/\d+\.\d+/, 'number.float'],
        [/\d+/, 'number'],

        // Operators
        [/==|!=|>=|<=|>|<|=/, 'operator'],

        // Whitespace
        [/\s+/, 'white'],
      ]
    }
  });

  // Language configuration (brackets, comments)
  monaco.languages.setLanguageConfiguration('medroute', {
    comments: { lineComment: '//' },
    brackets: [['(', ')'], ['[', ']']],
    autoClosingPairs: [
      { open: '"', close: '"' },
      { open: '(', close: ')' },
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
    ],
  });

  // Auto-complete suggestions
  monaco.languages.registerCompletionItemProvider('medroute', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: Monaco.languages.CompletionItem[] = [
        {
          label: 'PATIENT',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'PATIENT ${1:P101}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Register a new patient. PATIENT <patient_id>',
          range,
        },
        {
          label: 'LOCATION',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'LOCATION ${1:P101} "${2:Location Name}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set patient location. LOCATION <patient_id> "<location>"',
          range,
        },
        {
          label: 'SEVERITY',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'SEVERITY ${1:P101} ${2|CRITICAL,HIGH,MEDIUM,LOW|}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set patient severity. SEVERITY <patient_id> LOW|MEDIUM|HIGH|CRITICAL',
          range,
        },
        {
          label: 'AMBULANCE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'AMBULANCE ${1:A12}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Register an ambulance. AMBULANCE <ambulance_id>',
          range,
        },
        {
          label: 'HOSPITAL',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'HOSPITAL ${1:H01} "${2:Hospital Name}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Register a hospital. HOSPITAL <hospital_id> "<name>"',
          range,
        },
        {
          label: 'DISPATCH',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'DISPATCH ${1:A12} ${2:P101}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Dispatch ambulance to patient. DISPATCH <ambulance_id> <patient_id>',
          range,
        },
        {
          label: 'ROUTE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'ROUTE ${1:A12} ${2:H01}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Assign hospital route. ROUTE <ambulance_id> <hospital_id>',
          range,
        },
        {
          label: 'PRIORITY',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'PRIORITY ${1:A12} ${2|HIGH,MEDIUM,LOW|}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Set ambulance priority. PRIORITY <ambulance_id> LOW|MEDIUM|HIGH',
          range,
        },
        {
          label: 'STATUS',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'STATUS ${1:A12}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Check ambulance status. STATUS <ambulance_id>',
          range,
        },
        {
          label: 'ARRIVE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'ARRIVE ${1:A12}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Mark ambulance arrival. ARRIVE <ambulance_id>',
          range,
        },
        {
          label: 'TRANSFER',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'TRANSFER ${1:P101} ${2:H01}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Transfer patient to hospital. TRANSFER <patient_id> <hospital_id>',
          range,
        },
        {
          label: 'CANCEL',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'CANCEL ${1:A12}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Cancel ambulance dispatch. CANCEL <ambulance_id>',
          range,
        },
        {
          label: 'REPORT',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'REPORT',
          documentation: 'Print system state report.',
          range,
        },
      ];
      return { suggestions };
    }
  });

  // Theme for MedRoute — dark, medical
  monaco.editor.defineTheme('medroute-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword',         foreground: 'ff79c6', fontStyle: 'bold' },
      { token: 'identifier',      foreground: '8be9fd' },
      { token: 'string',          foreground: 'f1fa8c' },
      { token: 'type.identifier', foreground: 'ffb86c', fontStyle: 'bold' },
      { token: 'number',          foreground: 'bd93f9' },
      { token: 'number.float',    foreground: 'bd93f9' },
      { token: 'operator',        foreground: '50fa7b' },
      { token: 'comment',         foreground: '6272a4', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':            '#0d1117',
      'editor.foreground':            '#e6edf3',
      'editor.lineHighlightBackground': '#161b22',
      'editorLineNumber.foreground':  '#6e7681',
      'editorLineNumber.activeForeground': '#00d4aa',
      'editor.selectionBackground':   '#1c4a2e',
      'editor.inactiveSelectionBackground': '#162028',
      'editorCursor.foreground':      '#00d4aa',
      'editorIndentGuide.background': '#21262d',
      'editorBracketMatch.background': '#1c4a2e',
      'editorBracketMatch.border':    '#00d4aa',
    }
  });

  monaco.editor.defineTheme('medroute-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword',         foreground: 'd63384', fontStyle: 'bold' },
      { token: 'identifier',      foreground: '0550ae' },
      { token: 'string',          foreground: '0a3069' },
      { token: 'type.identifier', foreground: 'a65f03', fontStyle: 'bold' },
      { token: 'number',          foreground: '8250df' },
      { token: 'operator',        foreground: '0969da' },
      { token: 'comment',         foreground: '6e7781', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#ffffff',
    }
  });
}
