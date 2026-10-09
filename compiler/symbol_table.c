/**
 * symbol_table.c
 * MedRoute Compiler - Symbol Table Implementation
 * ============================================================
 * Hash-table backed symbol table for patients, ambulances,
 * and hospitals in the MedRoute DSL.
 */

#include "symbol_table.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 * INTERNAL: djb2 hash
 * ============================================================ */
static unsigned int _hash(const char *str) {
    unsigned int hash = 5381;
    int c;
    while ((c = (unsigned char)*str++))
        hash = ((hash << 5) + hash) + c;
    return hash % HASH_SIZE;
}

/* ============================================================
 * INIT / DESTROY
 * ============================================================ */
SymbolTable* symtable_create(void) {
    SymbolTable *st = (SymbolTable*)calloc(1, sizeof(SymbolTable));
    return st;
}

void symtable_reset(SymbolTable *st) {
    if (!st) return;
    /* Free all patients */
    for (int i = 0; i < HASH_SIZE; i++) {
        PatientEntry *p = st->patients[i];
        while (p) { PatientEntry *nx = p->next; free(p); p = nx; }
        st->patients[i] = NULL;

        AmbulanceEntry *a = st->ambulances[i];
        while (a) { AmbulanceEntry *nx = a->next; free(a); a = nx; }
        st->ambulances[i] = NULL;

        HospitalEntry *h = st->hospitals[i];
        while (h) { HospitalEntry *nx = h->next; free(h); h = nx; }
        st->hospitals[i] = NULL;
    }
    st->patient_count   = 0;
    st->ambulance_count = 0;
    st->hospital_count  = 0;
}

void symtable_destroy(SymbolTable *st) {
    if (!st) return;
    symtable_reset(st);
    free(st);
}

/* ============================================================
 * PATIENT OPERATIONS
 * ============================================================ */
int symtable_add_patient(SymbolTable *st, const char *id, int line) {
    if (!st || !id) return -1;
    unsigned int idx = _hash(id);

    /* Check for duplicate */
    PatientEntry *cur = st->patients[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return 0;  /* already exists */
        cur = cur->next;
    }

    PatientEntry *entry = (PatientEntry*)calloc(1, sizeof(PatientEntry));
    strncpy(entry->id, id, MAX_ID_LEN - 1);
    entry->severity       = SEV_UNKNOWN;
    entry->state          = PATIENT_REGISTERED;
    entry->line_declared  = line;
    entry->next           = st->patients[idx];
    st->patients[idx]     = entry;
    st->patient_count++;
    return 1;   /* newly added */
}

PatientEntry* symtable_get_patient(SymbolTable *st, const char *id) {
    if (!st || !id) return NULL;
    unsigned int idx = _hash(id);
    PatientEntry *cur = st->patients[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return cur;
        cur = cur->next;
    }
    return NULL;
}

/* ============================================================
 * AMBULANCE OPERATIONS
 * ============================================================ */
int symtable_add_ambulance(SymbolTable *st, const char *id, int line) {
    if (!st || !id) return -1;
    unsigned int idx = _hash(id);

    AmbulanceEntry *cur = st->ambulances[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return 0;
        cur = cur->next;
    }

    AmbulanceEntry *entry = (AmbulanceEntry*)calloc(1, sizeof(AmbulanceEntry));
    strncpy(entry->id, id, MAX_ID_LEN - 1);
    entry->state         = AMB_AVAILABLE;
    entry->priority      = PRI_UNKNOWN;
    entry->line_declared = line;
    entry->next          = st->ambulances[idx];
    st->ambulances[idx]  = entry;
    st->ambulance_count++;
    return 1;
}

AmbulanceEntry* symtable_get_ambulance(SymbolTable *st, const char *id) {
    if (!st || !id) return NULL;
    unsigned int idx = _hash(id);
    AmbulanceEntry *cur = st->ambulances[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return cur;
        cur = cur->next;
    }
    return NULL;
}

/* ============================================================
 * HOSPITAL OPERATIONS
 * ============================================================ */
int symtable_add_hospital(SymbolTable *st, const char *id, const char *name, int line) {
    if (!st || !id) return -1;
    unsigned int idx = _hash(id);

    HospitalEntry *cur = st->hospitals[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return 0;
        cur = cur->next;
    }

    HospitalEntry *entry = (HospitalEntry*)calloc(1, sizeof(HospitalEntry));
    strncpy(entry->id, id, MAX_ID_LEN - 1);
    if (name) strncpy(entry->name, name, MAX_STR_LEN - 1);
    entry->status        = HOSP_ACTIVE;
    entry->line_declared = line;
    entry->next          = st->hospitals[idx];
    st->hospitals[idx]   = entry;
    st->hospital_count++;
    return 1;
}

HospitalEntry* symtable_get_hospital(SymbolTable *st, const char *id) {
    if (!st || !id) return NULL;
    unsigned int idx = _hash(id);
    HospitalEntry *cur = st->hospitals[idx];
    while (cur) {
        if (strcmp(cur->id, id) == 0) return cur;
        cur = cur->next;
    }
    return NULL;
}

/* ============================================================
 * JSON DUMP
 * ============================================================ */
void symtable_dump_json(SymbolTable *st, FILE *out) {
    if (!st || !out) return;

    fprintf(out, "{\n");

    /* --- Patients --- */
    fprintf(out, "  \"patients\": [\n");
    int first_p = 1;
    for (int i = 0; i < HASH_SIZE; i++) {
        PatientEntry *p = st->patients[i];
        while (p) {
            if (!first_p) fprintf(out, ",\n");
            fprintf(out,
                "    {\"id\":\"%s\",\"location\":\"%s\",\"severity\":\"%s\","
                "\"state\":\"%s\",\"ambulance\":\"%s\",\"hospital\":\"%s\"}",
                p->id,
                p->location,
                severity_to_str(p->severity),
                patient_state_to_str(p->state),
                p->assigned_ambulance,
                p->destination_hospital);
            first_p = 0;
            p = p->next;
        }
    }
    fprintf(out, "\n  ],\n");

    /* --- Ambulances --- */
    fprintf(out, "  \"ambulances\": [\n");
    int first_a = 1;
    for (int i = 0; i < HASH_SIZE; i++) {
        AmbulanceEntry *a = st->ambulances[i];
        while (a) {
            if (!first_a) fprintf(out, ",\n");
            fprintf(out,
                "    {\"id\":\"%s\",\"state\":\"%s\",\"patient\":\"%s\","
                "\"hospital\":\"%s\",\"priority\":\"%s\"}",
                a->id,
                ambulance_state_to_str(a->state),
                a->assigned_patient,
                a->route_hospital,
                priority_to_str(a->priority));
            first_a = 0;
            a = a->next;
        }
    }
    fprintf(out, "\n  ],\n");

    /* --- Hospitals --- */
    fprintf(out, "  \"hospitals\": [\n");
    int first_h = 1;
    for (int i = 0; i < HASH_SIZE; i++) {
        HospitalEntry *h = st->hospitals[i];
        while (h) {
            if (!first_h) fprintf(out, ",\n");
            fprintf(out,
                "    {\"id\":\"%s\",\"name\":\"%s\",\"status\":\"ACTIVE\"}",
                h->id, h->name);
            first_h = 0;
            h = h->next;
        }
    }
    fprintf(out, "\n  ]\n");

    fprintf(out, "}\n");
}
