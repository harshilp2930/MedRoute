/**
 * semantic.c
 * MedRoute Compiler - Semantic Analyzer Implementation
 * ============================================================
 * Performs semantic validation of MedRoute programs:
 *   - Duplicate / missing symbol detection
 *   - State-machine transition validation
 *   - Type/value validation (severity, priority)
 */

#include "semantic.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 * GLOBAL ERROR LIST
 * ============================================================ */
CompilerError *g_error_list  = NULL;
CompilerError *g_error_tail  = NULL;
int            g_error_count = 0;

/* ============================================================
 * INTERNAL HELPERS
 * ============================================================ */
static void _add_error(ErrorType type, int line,
                        const char *msg,
                        const char *expected,
                        const char *received) {
    CompilerError *err = (CompilerError*)calloc(1, sizeof(CompilerError));
    err->type = type;
    err->line = line;
    strncpy(err->message,  msg      ? msg      : "", 511);
    strncpy(err->expected, expected ? expected : "", 255);
    strncpy(err->received, received ? received : "", 255);
    err->next = NULL;

    if (!g_error_list) { g_error_list = err; g_error_tail = err; }
    else               { g_error_tail->next = err; g_error_tail = err; }
    g_error_count++;
}

/* ============================================================
 * INIT / RESET
 * ============================================================ */
void semantic_init(SymbolTable *st) { (void)st; }

void semantic_reset(void) {
    CompilerError *cur = g_error_list;
    while (cur) { CompilerError *nx = cur->next; free(cur); cur = nx; }
    g_error_list  = NULL;
    g_error_tail  = NULL;
    g_error_count = 0;
}

/* ============================================================
 * PATIENT
 * ============================================================ */
int sem_check_patient(SymbolTable *st, const char *pid, int line) {
    PatientEntry *existing = symtable_get_patient(st, pid);
    if (existing) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s is already registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg, "Unique patient identifier", pid);
        return SEM_ERROR;
    }
    symtable_add_patient(st, pid, line);
    return SEM_OK;
}

/* ============================================================
 * LOCATION
 * ============================================================ */
int sem_check_location(SymbolTable *st, const char *pid, const char *loc, int line) {
    PatientEntry *p = symtable_get_patient(st, pid);
    if (!p) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s has not been registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg,
                   "Registered patient identifier", pid);
        return SEM_ERROR;
    }
    strncpy(p->location, loc, MAX_STR_LEN - 1);
    return SEM_OK;
}

/* ============================================================
 * SEVERITY
 * ============================================================ */
int sem_check_severity(SymbolTable *st, const char *pid,
                        const char *sev_str, int line, Severity *out_sev) {
    PatientEntry *p = symtable_get_patient(st, pid);
    if (!p) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s has not been registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg,
                   "Registered patient identifier", pid);
        return SEM_ERROR;
    }

    Severity sev = SEV_UNKNOWN;
    if      (strcmp(sev_str, "LOW")      == 0) sev = SEV_LOW;
    else if (strcmp(sev_str, "MEDIUM")   == 0) sev = SEV_MEDIUM;
    else if (strcmp(sev_str, "HIGH")     == 0) sev = SEV_HIGH;
    else if (strcmp(sev_str, "CRITICAL") == 0) sev = SEV_CRITICAL;
    else {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Invalid severity level: %s. Allowed: LOW, MEDIUM, HIGH, CRITICAL", sev_str);
        _add_error(ERR_SEMANTIC, line, msg,
                   "LOW | MEDIUM | HIGH | CRITICAL", sev_str);
        return SEM_ERROR;
    }

    p->severity = sev;
    if (out_sev) *out_sev = sev;
    return SEM_OK;
}

/* ============================================================
 * AMBULANCE
 * ============================================================ */
int sem_check_ambulance(SymbolTable *st, const char *aid, int line) {
    AmbulanceEntry *existing = symtable_get_ambulance(st, aid);
    if (existing) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s is already registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Unique ambulance identifier", aid);
        return SEM_ERROR;
    }
    symtable_add_ambulance(st, aid, line);
    return SEM_OK;
}

/* ============================================================
 * HOSPITAL
 * ============================================================ */
int sem_check_hospital(SymbolTable *st, const char *hid, const char *name, int line) {
    HospitalEntry *existing = symtable_get_hospital(st, hid);
    if (existing) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Hospital %s already exists.", hid);
        _add_error(ERR_SEMANTIC, line, msg, "Unique hospital identifier", hid);
        return SEM_ERROR;
    }
    symtable_add_hospital(st, hid, name, line);
    return SEM_OK;
}

/* ============================================================
 * DISPATCH
 * ============================================================ */
int sem_check_dispatch(SymbolTable *st, const char *aid, const char *pid, int line) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }

    PatientEntry *pat = symtable_get_patient(st, pid);
    if (!pat) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s has not been registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered patient identifier", pid);
        return SEM_ERROR;
    }

    if (amb->state != AMB_AVAILABLE) {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Ambulance %s is already assigned. Current state: %s",
                 aid, ambulance_state_to_str(amb->state));
        _add_error(ERR_SEMANTIC, line, msg, "AVAILABLE", ambulance_state_to_str(amb->state));
        return SEM_ERROR;
    }

    if (pat->state == PATIENT_ASSIGNED || pat->state == PATIENT_IN_TRANSIT) {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Patient %s already has an active ambulance assigned.", pid);
        _add_error(ERR_SEMANTIC, line, msg,
                   "Patient in REGISTERED or WAITING state",
                   patient_state_to_str(pat->state));
        return SEM_ERROR;
    }

    int dist = symtable_get_distance(st, aid, pid);
    if (dist < 0) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Distance not set for Ambulance %s and Patient %s.", aid, pid);
        _add_error(ERR_SEMANTIC, line, msg, "Declared DISTANCE", "Missing distance");
        return SEM_ERROR;
    }
    if (amb->speed <= 0) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Speed not set for Ambulance %s.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Declared SPEED", "Missing speed");
        return SEM_ERROR;
    }

    /* Apply state transitions */
    amb->state = AMB_DISPATCHED;
    strncpy(amb->assigned_patient, pid, MAX_ID_LEN - 1);
    pat->state = PATIENT_ASSIGNED;
    strncpy(pat->assigned_ambulance, aid, MAX_ID_LEN - 1);

    /* Automatically assign priority based on patient condition (severity) */
    if (pat->severity == SEV_CRITICAL || pat->severity == SEV_HIGH) {
        amb->priority = PRI_HIGH;
    } else if (pat->severity == SEV_MEDIUM) {
        amb->priority = PRI_MEDIUM;
    } else if (pat->severity == SEV_LOW) {
        amb->priority = PRI_LOW;
    }

    return SEM_OK;
}

/* ============================================================
 * ROUTE
 * ============================================================ */
int sem_check_route(SymbolTable *st, const char *aid, const char *hid, int line) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }

    HospitalEntry *hosp = symtable_get_hospital(st, hid);
    if (!hosp) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Hospital %s has not been registered.", hid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered hospital identifier", hid);
        return SEM_ERROR;
    }

    if (amb->state != AMB_DISPATCHED) {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Ambulance %s cannot be routed. It must be DISPATCHED first. Current state: %s",
                 aid, ambulance_state_to_str(amb->state));
        _add_error(ERR_SEMANTIC, line, msg, "DISPATCHED", ambulance_state_to_str(amb->state));
        return SEM_ERROR;
    }

    strncpy(amb->route_hospital, hid, MAX_ID_LEN - 1);
    /* Also update patient destination */
    if (strlen(amb->assigned_patient) > 0) {
        PatientEntry *pat = symtable_get_patient(st, amb->assigned_patient);
        if (pat) strncpy(pat->destination_hospital, hid, MAX_ID_LEN - 1);
    }
    return SEM_OK;
}

/* ============================================================
 * PRIORITY
 * ============================================================ */
int sem_check_priority(SymbolTable *st, const char *aid,
                        const char *pri_str, int line, Priority *out_pri) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }

    Priority pri = PRI_UNKNOWN;
    if      (strcmp(pri_str, "LOW")    == 0) pri = PRI_LOW;
    else if (strcmp(pri_str, "MEDIUM") == 0) pri = PRI_MEDIUM;
    else if (strcmp(pri_str, "HIGH")   == 0) pri = PRI_HIGH;
    else {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Invalid priority level: %s. Allowed: LOW, MEDIUM, HIGH", pri_str);
        _add_error(ERR_SEMANTIC, line, msg, "LOW | MEDIUM | HIGH", pri_str);
        return SEM_ERROR;
    }

    amb->priority = pri;
    if (out_pri) *out_pri = pri;
    return SEM_OK;
}

/* ============================================================
 * STATUS
 * ============================================================ */
int sem_check_status(SymbolTable *st, const char *aid, int line) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }
    return SEM_OK;
}

/* ============================================================
 * DISTANCE
 * ============================================================ */
int sem_check_distance(SymbolTable *st, const char *aid, const char *pid, int dist, int line) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }
    PatientEntry *pat = symtable_get_patient(st, pid);
    if (!pat) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s has not been registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered patient identifier", pid);
        return SEM_ERROR;
    }
    if (dist < 0) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Distance between %s and %s cannot be negative.", aid, pid);
        _add_error(ERR_SEMANTIC, line, msg, "Non-negative distance", "Negative value");
        return SEM_ERROR;
    }
    
    symtable_set_distance(st, aid, pid, dist);
    return SEM_OK;
}

/* ============================================================
 * TRANSFER
 * ============================================================ */
int sem_check_transfer(SymbolTable *st, const char *pid, const char *hid, int line) {
    PatientEntry *pat = symtable_get_patient(st, pid);
    if (!pat) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Patient %s has not been registered.", pid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered patient identifier", pid);
        return SEM_ERROR;
    }

    HospitalEntry *hosp = symtable_get_hospital(st, hid);
    if (!hosp) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Hospital %s has not been registered.", hid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered hospital identifier", hid);
        return SEM_ERROR;
    }

    if (pat->state != PATIENT_ASSIGNED && pat->state != PATIENT_IN_TRANSIT) {
        char msg[512];
        snprintf(msg, sizeof(msg),
                 "Patient %s cannot be transferred. Patient is not assigned an ambulance. "
                 "Current patient state: %s",
                 pid, patient_state_to_str(pat->state));
        _add_error(ERR_SEMANTIC, line, msg, "ASSIGNED or IN_TRANSIT", patient_state_to_str(pat->state));
        return SEM_ERROR;
    }

    /* Apply transitions */
    pat->state = PATIENT_TRANSFERRED;
    strncpy(pat->destination_hospital, hid, MAX_ID_LEN - 1);

    /* Ambulance becomes COMPLETED */
    if (strlen(pat->assigned_ambulance) > 0) {
        AmbulanceEntry *amb = symtable_get_ambulance(st, pat->assigned_ambulance);
        if (amb) amb->state = AMB_COMPLETED;
    }
    return SEM_OK;
}

/* ============================================================
 * SPEED
 * ============================================================ */
int sem_check_speed(SymbolTable *st, const char *aid, int speed, int line) {
    AmbulanceEntry *amb = symtable_get_ambulance(st, aid);
    if (!amb) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Ambulance %s has not been registered.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Registered ambulance identifier", aid);
        return SEM_ERROR;
    }

    if (speed <= 0) {
        char msg[512];
        snprintf(msg, sizeof(msg), "Speed for ambulance %s must be greater than zero.", aid);
        _add_error(ERR_SEMANTIC, line, msg, "Positive speed", "Zero or negative value");
        return SEM_ERROR;
    }
    
    symtable_set_speed(st, aid, speed);
    return SEM_OK;
}

/* ============================================================
 * REPORT
 * ============================================================ */
int sem_check_report(int line) {
    (void)line;
    return SEM_OK;  /* REPORT is always semantically valid */
}

/* ============================================================
 * JSON ERROR DUMP
 * ============================================================ */
void semantic_dump_errors_json(FILE *out) {
    static const char* etype_str[] = { "LEXICAL", "SYNTAX", "SEMANTIC", "EXECUTION" };
    fprintf(out, "[\n");
    CompilerError *cur = g_error_list;
    int first = 1;
    while (cur) {
        if (!first) fprintf(out, ",\n");
        /* Escape quotes in message */
        fprintf(out,
            "  {\"type\":\"%s\",\"line\":%d,\"message\":\"%s\","
            "\"expected\":\"%s\",\"received\":\"%s\"}",
            etype_str[cur->type], cur->line,
            cur->message, cur->expected, cur->received);
        first = 0;
        cur = cur->next;
    }
    fprintf(out, "\n]\n");
}
