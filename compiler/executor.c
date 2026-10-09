/**
 * executor.c
 * MedRoute Compiler - Execution Engine
 * ============================================================
 * Walks the IR instruction list and executes each one,
 * producing human-readable log entries and updating the
 * symbol table state (used for the final REPORT).
 */

#include "executor.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* ============================================================
 * INTERNAL LOG HELPER
 * ============================================================ */
static void _log(ExecutionResult *res, int num, int ok, const char *msg) {
    if (res->count >= MAX_EXEC_LOG) return;
    ExecLogEntry *e = &res->entries[res->count++];
    e->instruction_num = num;
    e->success         = ok;
    strncpy(e->message, msg, 511);
    if (!ok) res->success = 0;
}

/* ============================================================
 * OPERATION HANDLERS
 * ============================================================ */
static void exec_register_patient(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Patient %s registered successfully.", cur->arg1);
    _log(res, idx, 1, msg);
}

static void exec_set_location(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Location of patient %s set to \"%s\".", cur->arg1, cur->arg3);
    _log(res, idx, 1, msg);
}

static void exec_set_severity(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Severity of patient %s set to %s.", cur->arg1, cur->arg2);
    _log(res, idx, 1, msg);
}

static void exec_register_ambulance(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Ambulance %s registered. State: AVAILABLE.", cur->arg1);
    _log(res, idx, 1, msg);
}

static void exec_register_hospital(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Hospital %s (\"%s\") registered. Status: ACTIVE.", cur->arg1, cur->arg3);
    _log(res, idx, 1, msg);
}

static void exec_dispatch(IRInstruction *cur, SymbolTable *st, ExecutionResult *res, int idx) {
    char msg[512];
    AmbulanceEntry *amb = symtable_get_ambulance(st, cur->arg1);
    PatientEntry   *pat = symtable_get_patient(st, cur->arg2);
    if (amb && pat) {
        int dist = symtable_get_distance(st, cur->arg1, cur->arg2);
        int speed = amb->speed;
        int eta = 0;
        if (speed > 0) {
            eta = (int)(((float)dist / (float)speed) * 60.0f);
        }
        snprintf(msg, sizeof(msg),
                 "Patient: %s Ambulance: %s Distance: %d km Speed: %d km/h Estimated Arrival Time: %d minutes Dispatch Status: DISPATCHED",
                 cur->arg2, cur->arg1, dist, speed, eta);
        _log(res, idx, 1, msg);
    } else {
        snprintf(msg, sizeof(msg), "Dispatch failed for %s → %s.", cur->arg1, cur->arg2);
        _log(res, idx, 0, msg);
    }
}

static void exec_assign_route(IRInstruction *cur, SymbolTable *st, ExecutionResult *res, int idx) {
    char msg[512];
    AmbulanceEntry *amb  = symtable_get_ambulance(st, cur->arg1);
    HospitalEntry  *hosp = symtable_get_hospital(st, cur->arg2);
    if (amb && hosp) {
        snprintf(msg, sizeof(msg),
                 "Route assigned: Ambulance %s → Hospital %s (%s).",
                 cur->arg1, cur->arg2, hosp->name);
        _log(res, idx, 1, msg);
    } else {
        snprintf(msg, sizeof(msg),
                 "Route assignment failed: %s → %s.", cur->arg1, cur->arg2);
        _log(res, idx, 0, msg);
    }
}

static void exec_set_priority(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Priority of ambulance %s set to %s.", cur->arg1, cur->arg2);
    _log(res, idx, 1, msg);
}

static void exec_status(IRInstruction *cur, SymbolTable *st, ExecutionResult *res, int idx) {
    char msg[512];
    AmbulanceEntry *amb = symtable_get_ambulance(st, cur->arg1);
    if (amb) {
        snprintf(msg, sizeof(msg),
                 "STATUS %s → State: %s | Patient: %s | Hospital: %s | Priority: %s",
                 cur->arg1,
                 ambulance_state_to_str(amb->state),
                 strlen(amb->assigned_patient) ? amb->assigned_patient : "NONE",
                 strlen(amb->route_hospital)   ? amb->route_hospital   : "NONE",
                 priority_to_str(amb->priority));
        _log(res, idx, 1, msg);
    } else {
        snprintf(msg, sizeof(msg), "STATUS failed: Ambulance %s not found.", cur->arg1);
        _log(res, idx, 0, msg);
    }
}

static void exec_distance(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Distance between %s and %s set to %s km.", cur->arg1, cur->arg2, cur->arg3);
    _log(res, idx, 1, msg);
}

static void exec_transfer(IRInstruction *cur, SymbolTable *st, ExecutionResult *res, int idx) {
    char msg[512];
    PatientEntry *pat = symtable_get_patient(st, cur->arg1);
    HospitalEntry *hosp = symtable_get_hospital(st, cur->arg2);
    if (pat && hosp) {
        snprintf(msg, sizeof(msg),
                 "Patient %s transferred to %s (%s). "
                 "Patient: ASSIGNED → TRANSFERRED. Ambulance: DISPATCHED → COMPLETED.",
                 cur->arg1, cur->arg2, hosp->name);
        _log(res, idx, 1, msg);
    } else {
        snprintf(msg, sizeof(msg), "TRANSFER failed: %s → %s.", cur->arg1, cur->arg2);
        _log(res, idx, 0, msg);
    }
}

static void exec_speed(IRInstruction *cur, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg), "Speed of %s set to %s km/h.", cur->arg1, cur->arg2);
    _log(res, idx, 1, msg);
}

static void exec_report(SymbolTable *st, ExecutionResult *res, int idx) {
    char msg[512];
    snprintf(msg, sizeof(msg),
             "REPORT generated: %d patient(s), %d ambulance(s), %d hospital(s).",
             st->patient_count, st->ambulance_count, st->hospital_count);
    _log(res, idx, 1, msg);
}

/* ============================================================
 * RUN
 * ============================================================ */
ExecutionResult* executor_run(IRProgram *prog, SymbolTable *st) {
    ExecutionResult *res = (ExecutionResult*)calloc(1, sizeof(ExecutionResult));
    res->success = 1;

    if (!prog || !st) {
        _log(res, 0, 0, "Execution aborted: no IR program or symbol table.");
        return res;
    }

    IRInstruction *cur = prog->head;
    int idx = 1;

    while (cur) {
        switch (cur->opcode) {
            case OP_REGISTER_PATIENT:   exec_register_patient(cur, res, idx); break;
            case OP_SET_LOCATION:       exec_set_location(cur, res, idx); break;
            case OP_SET_SEVERITY:       exec_set_severity(cur, res, idx); break;
            case OP_REGISTER_AMBULANCE: exec_register_ambulance(cur, res, idx); break;
            case OP_REGISTER_HOSPITAL:  exec_register_hospital(cur, res, idx); break;
            case OP_DISPATCH:           exec_dispatch(cur, st, res, idx); break;
            case OP_ASSIGN_ROUTE:       exec_assign_route(cur, st, res, idx); break;
            case OP_SET_PRIORITY:       exec_set_priority(cur, res, idx); break;
            case OP_STATUS:             exec_status(cur, st, res, idx); break;
            case OP_DISTANCE:           exec_distance(cur, res, idx); break;
            case OP_TRANSFER:           exec_transfer(cur, st, res, idx); break;
            case OP_SPEED:              exec_speed(cur, res, idx); break;
            case OP_REPORT:             exec_report(st, res, idx); break;
            default: {
                char msg[512];
                snprintf(msg, sizeof(msg), "Unknown instruction at index %d.", idx);
                _log(res, idx, 0, msg);
            }
        }
        idx++;
        cur = cur->next;
    }

    return res;
}

/* ============================================================
 * JSON DUMP HELPER
 * ============================================================ */
static void escape_json_string(const char *src, char *dst, size_t dst_size) {
    size_t si = 0;
    for (size_t j = 0; src[j] && si < dst_size - 1; j++) {
        char c = src[j];
        if (c == '"') { dst[si++] = '\\'; dst[si++] = '"'; }
        else          { dst[si++] = c; }
    }
    dst[si] = '\0';
}

/* ============================================================
 * JSON DUMP
 * ============================================================ */
void executor_dump_json(ExecutionResult *res, SymbolTable *st, FILE *out) {
    if (!res || !out) return;

    fprintf(out, "{\n");
    fprintf(out, "  \"success\": %s,\n", res->success ? "true" : "false");
    fprintf(out, "  \"log\": [\n");

    for (int i = 0; i < res->count; i++) {
        if (i > 0) fprintf(out, ",\n");
        char safe[1024] = {0};
        escape_json_string(res->entries[i].message, safe, sizeof(safe));
        
        fprintf(out,
            "    {\"index\":%d,\"success\":%s,\"message\":\"%s\"}",
            res->entries[i].instruction_num,
            res->entries[i].success ? "true" : "false",
            safe);
    }

    fprintf(out, "\n  ]");

    /* Embed final state summary */
    if (st) {
        fprintf(out, ",\n  \"summary\": {\n");
        fprintf(out, "    \"total_patients\":   %d,\n", st->patient_count);
        fprintf(out, "    \"total_ambulances\": %d,\n", st->ambulance_count);
        fprintf(out, "    \"total_hospitals\":  %d\n",  st->hospital_count);
        fprintf(out, "  }");
    }

    fprintf(out, "\n}\n");
}

void executor_free(ExecutionResult *res) {
    if (res) free(res);
}
