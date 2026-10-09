/**
 * semantic.h
 * MedRoute Compiler - Semantic Analyzer Header
 */

#ifndef SEMANTIC_H
#define SEMANTIC_H

#include "symbol_table.h"
#include "tokens.h"

/* Return codes for semantic checks */
#define SEM_OK    0
#define SEM_ERROR 1

/* The global error list (populated during semantic analysis) */
extern CompilerError *g_error_list;
extern int            g_error_count;

/* Initialise / reset the semantic layer */
void semantic_init(SymbolTable *st);
void semantic_reset(void);

/* Validate individual statements */
int sem_check_patient      (SymbolTable *st, const char *pid, int line);
int sem_check_location     (SymbolTable *st, const char *pid, const char *loc, int line);
int sem_check_severity     (SymbolTable *st, const char *pid, const char *sev_str, int line, Severity *out_sev);
int sem_check_ambulance    (SymbolTable *st, const char *aid, int line);
int sem_check_hospital     (SymbolTable *st, const char *hid, const char *name, int line);
int sem_check_dispatch     (SymbolTable *st, const char *aid, const char *pid, int line);
int sem_check_route        (SymbolTable *st, const char *aid, const char *hid, int line);
int sem_check_priority     (SymbolTable *st, const char *aid, const char *pri_str, int line, Priority *out_pri);
int sem_check_status       (SymbolTable *st, const char *aid, int line);
int sem_check_distance     (SymbolTable *st, const char *aid, const char *pid, int dist, int line);
int sem_check_transfer     (SymbolTable *st, const char *pid, const char *hid, int line);
int sem_check_speed        (SymbolTable *st, const char *aid, int speed, int line);
int sem_check_report       (int line);

/* Error output */
void semantic_dump_errors_json(FILE *out);

#endif /* SEMANTIC_H */
