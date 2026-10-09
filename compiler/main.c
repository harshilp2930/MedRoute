/**
 * main.c
 * MedRoute Compiler - Entry Point
 * ============================================================
 * Orchestrates all compiler phases and writes a single JSON
 * result to stdout that the backend API passes to the frontend.
 *
 * Output JSON shape:
 * {
 *   "status":     "SUCCESS" | "LEXICAL_ERROR" | "SYNTAX_ERROR" | "SEMANTIC_ERROR",
 *   "tokens":     [...],            // from lexer
 *   "parseTree":  [...],            // from parser
 *   "errors":     [...],            // from semantic / syntax
 *   "symbolTable": { ... },         // patients, ambulances, hospitals
 *   "ir":         [...],            // intermediate instructions
 *   "execution":  { success, log, summary }
 * }
 *
 * Usage:
 *   medroute <source.med>
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "tokens.h"
#include "symbol_table.h"
#include "semantic.h"
#include "intermediate.h"
#include "executor.h"

/* ============================================================
 * EXTERN from lexer.l and parser.y
 * ============================================================ */
extern FILE *yyin;
extern int   yyparse(void);
extern int   yylineno_val;
extern int   g_token_count;
extern void  tokens_dump_json(FILE *out);

extern SymbolTable *g_symtable;
extern IRProgram   *g_ir;
extern int          g_stmt_count;
extern int          g_parse_ok;
extern char         g_parse_tree_json[];


/* ============================================================
 * MAIN
 * ============================================================ */
int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: medroute <source.med>\n");
        return 1;
    }

    /* Open source file */
    FILE *src = fopen(argv[1], "r");
    if (!src) {
        fprintf(stderr, "{\"status\":\"FILE_ERROR\",\"message\":\"Cannot open file: %s\"}\n", argv[1]);
        return 1;
    }
    yyin = src;

    /* Initialise global state */
    g_symtable = symtable_create();
    g_ir       = ir_create();
    semantic_init(g_symtable);

    /* --------------------------------------------------------
     * PHASE 1 + 2 + 3: Lex + Parse + Semantic (interleaved)
     * -------------------------------------------------------- */
    int parse_result = yyparse();
    fclose(src);

    /* --------------------------------------------------------
     * PHASE 4: Execution (only if no errors)
     * -------------------------------------------------------- */
    ExecutionResult *exec_res = NULL;
    int has_semantic_errors = (g_error_count > 0);
    int has_syntax_errors   = !g_parse_ok;

    if (!has_syntax_errors && !has_semantic_errors) {
        exec_res = executor_run(g_ir, g_symtable);
    }

    /* --------------------------------------------------------
     * BUILD OUTPUT
     * -------------------------------------------------------- */
    int text_mode = (argc >= 3 && strcmp(argv[2], "--text") == 0);
    if (text_mode) {
        if (has_syntax_errors) {
            printf("Error: Syntax Errors detected.\n");
        } else if (has_semantic_errors) {
            printf("Error: Semantic Errors detected.\n");
        } else if (exec_res) {
            for (int i = 0; i < exec_res->count; i++) {
                printf("%s\n", exec_res->entries[i].message);
            }
        }
        if (exec_res) executor_free(exec_res);
        ir_destroy(g_ir);
        symtable_destroy(g_symtable);
        semantic_reset();
        return (has_syntax_errors || has_semantic_errors) ? 2 : 0;
    }

    const char *status = "SUCCESS";
    if (has_syntax_errors)   status = "SYNTAX_ERROR";
    else if (has_semantic_errors) status = "SEMANTIC_ERROR";

    /* Use a temp file approach: write each section to a buffer */
    printf("{\n");
    printf("  \"status\": \"%s\",\n", status);
    printf("  \"statementCount\": %d,\n", g_stmt_count);

    /* TOKENS */
    printf("  \"tokens\": ");
    tokens_dump_json(stdout);
    printf(",\n");

    /* PARSE TREE */
    printf("  \"parseTree\": [%s],\n", g_parse_tree_json);

    /* ERRORS */
    printf("  \"errors\": ");
    semantic_dump_errors_json(stdout);
    printf(",\n");

    /* SYMBOL TABLE */
    printf("  \"symbolTable\": ");
    symtable_dump_json(g_symtable, stdout);
    printf(",\n");

    /* INTERMEDIATE CODE */
    printf("  \"ir\": ");
    ir_dump_json(g_ir, stdout);
    printf(",\n");

    /* EXECUTION */
    if (exec_res) {
        printf("  \"execution\": ");
        executor_dump_json(exec_res, g_symtable, stdout);
        printf("\n");
        executor_free(exec_res);
    } else {
        printf("  \"execution\": {\"success\": false, \"log\": [], \"summary\": {}}\n");
    }

    printf("}\n");

    /* Cleanup */
    ir_destroy(g_ir);
    symtable_destroy(g_symtable);
    semantic_reset();

    return (has_syntax_errors || has_semantic_errors) ? 2 : 0;
}
