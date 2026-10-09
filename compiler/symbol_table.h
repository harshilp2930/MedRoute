/**
 * symbol_table.h
 * MedRoute Compiler - Symbol Table Header
 * ============================================================
 * Declares the symbol table data structures and API.
 */

#ifndef SYMBOL_TABLE_H
#define SYMBOL_TABLE_H

#include "tokens.h"

#define MAX_ID_LEN   64
#define MAX_STR_LEN  256
#define HASH_SIZE    101

/* ============================================================
 * PATIENT ENTRY
 * ============================================================ */
typedef struct PatientEntry {
    char           id[MAX_ID_LEN];
    char           location[MAX_STR_LEN];
    Severity       severity;
    PatientState   state;
    char           assigned_ambulance[MAX_ID_LEN];  /* "" if none */
    char           destination_hospital[MAX_ID_LEN];
    int            line_declared;
    struct PatientEntry *next;  /* chaining for hash collisions */
} PatientEntry;

/* ============================================================
 * AMBULANCE ENTRY
 * ============================================================ */
typedef struct AmbulanceEntry {
    char            id[MAX_ID_LEN];
    AmbulanceState  state;
    char            assigned_patient[MAX_ID_LEN];   /* "" if none */
    char            route_hospital[MAX_ID_LEN];     /* "" if none */
    Priority        priority;
    int             line_declared;
    struct AmbulanceEntry *next;
} AmbulanceEntry;

/* ============================================================
 * HOSPITAL ENTRY
 * ============================================================ */
typedef struct HospitalEntry {
    char           id[MAX_ID_LEN];
    char           name[MAX_STR_LEN];
    HospitalStatus status;
    int            line_declared;
    struct HospitalEntry *next;
} HospitalEntry;

/* ============================================================
 * SYMBOL TABLE
 * ============================================================ */
typedef struct SymbolTable {
    PatientEntry   *patients[HASH_SIZE];
    AmbulanceEntry *ambulances[HASH_SIZE];
    HospitalEntry  *hospitals[HASH_SIZE];

    int patient_count;
    int ambulance_count;
    int hospital_count;
} SymbolTable;

/* ============================================================
 * API DECLARATIONS
 * ============================================================ */

/* Init / destroy */
SymbolTable* symtable_create(void);
void         symtable_destroy(SymbolTable *st);
void         symtable_reset(SymbolTable *st);

/* Patients */
int            symtable_add_patient   (SymbolTable *st, const char *id, int line);
PatientEntry*  symtable_get_patient   (SymbolTable *st, const char *id);

/* Ambulances */
int              symtable_add_ambulance   (SymbolTable *st, const char *id, int line);
AmbulanceEntry*  symtable_get_ambulance   (SymbolTable *st, const char *id);

/* Hospitals */
int             symtable_add_hospital   (SymbolTable *st, const char *id, const char *name, int line);
HospitalEntry*  symtable_get_hospital   (SymbolTable *st, const char *id);

/* Dump (for JSON output) */
void symtable_dump_json(SymbolTable *st, FILE *out);

#endif /* SYMBOL_TABLE_H */
