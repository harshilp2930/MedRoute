%{
/**
 * parser.y
 * MedRoute Compiler - Bison/YACC Grammar
 * ============================================================
 * Defines the complete context-free grammar for the MedRoute
 * DSL and calls the semantic analyzer + IR emitter on each
 * successfully parsed statement.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "tokens.h"
#include "symbol_table.h"
#include "semantic.h"
#include "intermediate.h"

/* External references from lexer */
extern int  yylineno_val;
extern int  yylex(void);
extern FILE *yyin;

/* Parse-tree output buffer for JSON */
#define PT_BUF_SIZE  65536
char g_parse_tree_json[PT_BUF_SIZE];
int  g_pt_pos = 0;

/* Append to the parse-tree JSON buffer safely */
static void pt_append(const char *s) {
    int rem = PT_BUF_SIZE - g_pt_pos - 1;
    if (rem <= 0) return;
    strncat(g_parse_tree_json + g_pt_pos, s, rem);
    g_pt_pos += strlen(s);
    if (g_pt_pos > PT_BUF_SIZE - 1) g_pt_pos = PT_BUF_SIZE - 1;
}

/* Global state handed in from main */
SymbolTable *g_symtable = NULL;
IRProgram   *g_ir       = NULL;

/* Count parsed statements */
int g_stmt_count = 0;
int g_parse_ok   = 1;   /* 0 if any syntax error found */

/* yyerror with richer messages */
void yyerror(const char *msg) {
    fprintf(stderr,
        "{\"type\":\"SYNTAX\",\"line\":%d,\"message\":\"%s\"}\n",
        yylineno_val, msg);
    g_parse_ok = 0;
}

%}

/* ============================================================
 * UNION — token value types
 * ============================================================ */
%union {
    int   int_val;
    float float_val;
    char *str_val;
}

/* ============================================================
 * TOKEN DECLARATIONS
 * ============================================================ */
%token TOK_PATIENT TOK_LOCATION TOK_SEVERITY TOK_AMBULANCE TOK_HOSPITAL
%token TOK_DISPATCH TOK_ROUTE TOK_PRIORITY TOK_STATUS TOK_ARRIVE
%token TOK_TRANSFER TOK_CANCEL TOK_REGISTER TOK_AVAILABLE TOK_ASSIGN TOK_REPORT

%token TOK_CRITICAL TOK_HIGH TOK_MEDIUM TOK_LOW

%token TOK_EQ TOK_NEQ TOK_GTE TOK_LTE TOK_GT TOK_LT TOK_ASSIGN_OP

%token <str_val>   TOK_IDENTIFIER
%token <str_val>   TOK_STRING
%token <int_val>   TOK_INTEGER
%token <float_val> TOK_FLOAT

/* ============================================================
 * TYPES for non-terminals
 * ============================================================ */
%type <str_val> severity_val priority_val

%%

/* ============================================================
 * GRAMMAR
 * ============================================================ */

program
    : statement_list
        {
            /* Wrap the parse-tree array */
            char final[PT_BUF_SIZE + 32];
            snprintf(final, sizeof(final),
                     "{\"type\":\"program\",\"children\":[%s]}",
                     g_parse_tree_json);
            /* Write to file if needed — main.c reads g_parse_tree_json */
        }
    ;

statement_list
    : statement
    | statement_list statement
    ;

statement
    : patient_stmt
    | location_stmt
    | severity_stmt
    | ambulance_stmt
    | hospital_stmt
    | dispatch_stmt
    | route_stmt
    | priority_stmt
    | status_stmt
    | arrive_stmt
    | transfer_stmt
    | cancel_stmt
    | report_stmt
    | error          { yyerrok; }
    ;

/* ----------------------------------------------------------
 * PATIENT <id>
 * ---------------------------------------------------------- */
patient_stmt
    : TOK_PATIENT TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"PATIENT\",\"id\":\"%s\",\"line\":%d}", $2, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_patient(g_symtable, $2, ln) == SEM_OK)
                ir_emit_register_patient(g_ir, $2, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_PATIENT error
        {
            yyerror("Invalid PATIENT statement. Expected: PATIENT <patient_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * LOCATION <id> "<string>"
 * ---------------------------------------------------------- */
location_stmt
    : TOK_LOCATION TOK_IDENTIFIER TOK_STRING
        {
            int ln = yylineno_val;
            char pt[512];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"LOCATION\",\"id\":\"%s\",\"location\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_location(g_symtable, $2, $3, ln) == SEM_OK)
                ir_emit_set_location(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2); free($3);
        }
    | TOK_LOCATION error
        {
            yyerror("Invalid LOCATION statement. Expected: LOCATION <patient_id> \"<location>\"");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * SEVERITY <id> <level>
 * ---------------------------------------------------------- */
severity_stmt
    : TOK_SEVERITY TOK_IDENTIFIER severity_val
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"SEVERITY\",\"id\":\"%s\",\"severity\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            Severity sev;
            if (sem_check_severity(g_symtable, $2, $3, ln, &sev) == SEM_OK)
                ir_emit_set_severity(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_SEVERITY error
        {
            yyerror("Invalid SEVERITY statement. Expected: SEVERITY <patient_id> LOW|MEDIUM|HIGH|CRITICAL");
            yyerrok;
        }
    ;

severity_val
    : TOK_LOW       { $$ = strdup("LOW");      }
    | TOK_MEDIUM    { $$ = strdup("MEDIUM");   }
    | TOK_HIGH      { $$ = strdup("HIGH");     }
    | TOK_CRITICAL  { $$ = strdup("CRITICAL"); }
    ;

/* ----------------------------------------------------------
 * AMBULANCE <id>
 * ---------------------------------------------------------- */
ambulance_stmt
    : TOK_AMBULANCE TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"AMBULANCE\",\"id\":\"%s\",\"line\":%d}", $2, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_ambulance(g_symtable, $2, ln) == SEM_OK)
                ir_emit_register_ambulance(g_ir, $2, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_AMBULANCE error
        {
            yyerror("Invalid AMBULANCE statement. Expected: AMBULANCE <ambulance_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * HOSPITAL <id> "<name>"
 * ---------------------------------------------------------- */
hospital_stmt
    : TOK_HOSPITAL TOK_IDENTIFIER TOK_STRING
        {
            int ln = yylineno_val;
            char pt[512];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"HOSPITAL\",\"id\":\"%s\",\"name\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_hospital(g_symtable, $2, $3, ln) == SEM_OK)
                ir_emit_register_hospital(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2); free($3);
        }
    | TOK_HOSPITAL error
        {
            yyerror("Invalid HOSPITAL statement. Expected: HOSPITAL <hospital_id> \"<name>\"");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * DISPATCH <ambulance_id> <patient_id>
 * ---------------------------------------------------------- */
dispatch_stmt
    : TOK_DISPATCH TOK_IDENTIFIER TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"DISPATCH\",\"ambulance\":\"%s\",\"patient\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_dispatch(g_symtable, $2, $3, ln) == SEM_OK)
                ir_emit_dispatch(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2); free($3);
        }
    | TOK_DISPATCH TOK_IDENTIFIER
        {
            yyerror("Invalid DISPATCH statement. Missing patient_id. Expected: DISPATCH <ambulance_id> <patient_id>");
            yyerrok;
            free($2);
        }
    | TOK_DISPATCH error
        {
            yyerror("Invalid DISPATCH statement. Expected: DISPATCH <ambulance_id> <patient_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * ROUTE <ambulance_id> <hospital_id>
 * ---------------------------------------------------------- */
route_stmt
    : TOK_ROUTE TOK_IDENTIFIER TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"ROUTE\",\"ambulance\":\"%s\",\"hospital\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_route(g_symtable, $2, $3, ln) == SEM_OK)
                ir_emit_assign_route(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2); free($3);
        }
    | TOK_ROUTE error
        {
            yyerror("Invalid ROUTE statement. Expected: ROUTE <ambulance_id> <hospital_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * PRIORITY <ambulance_id> <level>
 * ---------------------------------------------------------- */
priority_stmt
    : TOK_PRIORITY TOK_IDENTIFIER priority_val
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"PRIORITY\",\"ambulance\":\"%s\",\"priority\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            Priority pri;
            if (sem_check_priority(g_symtable, $2, $3, ln, &pri) == SEM_OK)
                ir_emit_set_priority(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_PRIORITY error
        {
            yyerror("Invalid PRIORITY statement. Expected: PRIORITY <ambulance_id> LOW|MEDIUM|HIGH");
            yyerrok;
        }
    ;

priority_val
    : TOK_LOW      { $$ = strdup("LOW");    }
    | TOK_MEDIUM   { $$ = strdup("MEDIUM"); }
    | TOK_HIGH     { $$ = strdup("HIGH");   }
    ;

/* ----------------------------------------------------------
 * STATUS <ambulance_id>
 * ---------------------------------------------------------- */
status_stmt
    : TOK_STATUS TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"STATUS\",\"ambulance\":\"%s\",\"line\":%d}", $2, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_status(g_symtable, $2, ln) == SEM_OK)
                ir_emit_status(g_ir, $2, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_STATUS error
        {
            yyerror("Invalid STATUS statement. Expected: STATUS <ambulance_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * ARRIVE <ambulance_id>
 * ---------------------------------------------------------- */
arrive_stmt
    : TOK_ARRIVE TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"ARRIVE\",\"ambulance\":\"%s\",\"line\":%d}", $2, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_arrive(g_symtable, $2, ln) == SEM_OK)
                ir_emit_arrive(g_ir, $2, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_ARRIVE error
        {
            yyerror("Invalid ARRIVE statement. Expected: ARRIVE <ambulance_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * TRANSFER <patient_id> <hospital_id>
 * ---------------------------------------------------------- */
transfer_stmt
    : TOK_TRANSFER TOK_IDENTIFIER TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"TRANSFER\",\"patient\":\"%s\",\"hospital\":\"%s\",\"line\":%d}",
                $2, $3, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_transfer(g_symtable, $2, $3, ln) == SEM_OK)
                ir_emit_transfer(g_ir, $2, $3, ln);

            g_stmt_count++;
            free($2); free($3);
        }
    | TOK_TRANSFER error
        {
            yyerror("Invalid TRANSFER statement. Expected: TRANSFER <patient_id> <hospital_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * CANCEL <ambulance_id>
 * ---------------------------------------------------------- */
cancel_stmt
    : TOK_CANCEL TOK_IDENTIFIER
        {
            int ln = yylineno_val;
            char pt[256];
            snprintf(pt, sizeof(pt),
                "{\"stmt\":\"CANCEL\",\"ambulance\":\"%s\",\"line\":%d}", $2, ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            if (sem_check_cancel(g_symtable, $2, ln) == SEM_OK)
                ir_emit_cancel(g_ir, $2, ln);

            g_stmt_count++;
            free($2);
        }
    | TOK_CANCEL error
        {
            yyerror("Invalid CANCEL statement. Expected: CANCEL <ambulance_id>");
            yyerrok;
        }
    ;

/* ----------------------------------------------------------
 * REPORT
 * ---------------------------------------------------------- */
report_stmt
    : TOK_REPORT
        {
            int ln = yylineno_val;
            char pt[128];
            snprintf(pt, sizeof(pt), "{\"stmt\":\"REPORT\",\"line\":%d}", ln);
            if (g_pt_pos > 0) pt_append(",");
            pt_append(pt);

            sem_check_report(ln);
            ir_emit_report(g_ir, ln);
            g_stmt_count++;
        }
    ;

%%
