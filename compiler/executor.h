/**
 * executor.h / executor.c (combined)
 * MedRoute Compiler - Execution Engine Header
 */

#ifndef EXECUTOR_H
#define EXECUTOR_H

#include "intermediate.h"
#include "symbol_table.h"
#include <stdio.h>

/* Each execution step produces a log entry */
#define MAX_EXEC_LOG 1024

typedef struct ExecLogEntry {
    int   instruction_num;
    int   success;           /* 1 = ok, 0 = error */
    char  message[512];
} ExecLogEntry;

typedef struct ExecutionResult {
    ExecLogEntry entries[MAX_EXEC_LOG];
    int          count;
    int          success;    /* overall 1/0 */
} ExecutionResult;

ExecutionResult* executor_run(IRProgram *prog, SymbolTable *st);
void             executor_dump_json(ExecutionResult *res, SymbolTable *st, FILE *out);
void             executor_free(ExecutionResult *res);

#endif /* EXECUTOR_H */
