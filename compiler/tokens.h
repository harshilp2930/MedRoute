/**
 * tokens.h
 * MedRoute Compiler - Token Definitions
 * ============================================================
 * Defines all token types, AST node types, data structures
 * for the MedRoute Domain-Specific Language.
 */

#ifndef TOKENS_H
#define TOKENS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 * SEVERITY LEVELS
 * ============================================================ */
typedef enum {
    SEV_UNKNOWN = 0,
    SEV_LOW,
    SEV_MEDIUM,
    SEV_HIGH,
    SEV_CRITICAL
} Severity;

/* ============================================================
 * PRIORITY LEVELS
 * ============================================================ */
typedef enum {
    PRI_UNKNOWN = 0,
    PRI_LOW,
    PRI_MEDIUM,
    PRI_HIGH
} Priority;

/* ============================================================
 * PATIENT STATES
 * ============================================================ */
typedef enum {
    PATIENT_REGISTERED = 0,
    PATIENT_WAITING,
    PATIENT_ASSIGNED,
    PATIENT_IN_TRANSIT,
    PATIENT_TRANSFERRED,
    PATIENT_COMPLETED
} PatientState;

/* ============================================================
 * AMBULANCE STATES
 * ============================================================ */
typedef enum {
    AMB_AVAILABLE = 0,
    AMB_DISPATCHED,
    AMB_ARRIVED,
    AMB_COMPLETED,
    AMB_CANCELLED
} AmbulanceState;

/* ============================================================
 * HOSPITAL STATUS
 * ============================================================ */
typedef enum {
    HOSP_ACTIVE = 0,
    HOSP_FULL,
    HOSP_INACTIVE
} HospitalStatus;

/* ============================================================
 * IR INSTRUCTION OPCODES
 * ============================================================ */
typedef enum {
    OP_REGISTER_PATIENT = 0,
    OP_SET_LOCATION,
    OP_SET_SEVERITY,
    OP_REGISTER_AMBULANCE,
    OP_REGISTER_HOSPITAL,
    OP_DISPATCH,
    OP_ASSIGN_ROUTE,
    OP_SET_PRIORITY,
    OP_STATUS,
    OP_DISTANCE,
    OP_TRANSFER,
    OP_SPEED,
    OP_REPORT
} OpCode;

/* ============================================================
 * IR INSTRUCTION STRUCTURE
 * ============================================================ */
typedef struct IRInstruction {
    int           line_num;
    OpCode        opcode;
    char          arg1[64];
    char          arg2[64];
    char          arg3[256];    /* for string literals */
    struct IRInstruction *next;
} IRInstruction;

/* ============================================================
 * ERROR STRUCTURE
 * ============================================================ */
typedef enum {
    ERR_LEXICAL = 0,
    ERR_SYNTAX,
    ERR_SEMANTIC,
    ERR_EXECUTION
} ErrorType;

typedef struct CompilerError {
    ErrorType   type;
    int         line;
    char        message[512];
    char        expected[256];
    char        received[256];
    struct CompilerError *next;
} CompilerError;

/* ============================================================
 * HELPER STRING FUNCTIONS
 * ============================================================ */
static const char* severity_to_str(Severity s) {
    switch(s) {
        case SEV_LOW:      return "LOW";
        case SEV_MEDIUM:   return "MEDIUM";
        case SEV_HIGH:     return "HIGH";
        case SEV_CRITICAL: return "CRITICAL";
        default:           return "UNKNOWN";
    }
}

static const char* priority_to_str(Priority p) {
    switch(p) {
        case PRI_LOW:    return "LOW";
        case PRI_MEDIUM: return "MEDIUM";
        case PRI_HIGH:   return "HIGH";
        default:         return "UNKNOWN";
    }
}

static const char* patient_state_to_str(PatientState s) {
    switch(s) {
        case PATIENT_REGISTERED:  return "REGISTERED";
        case PATIENT_WAITING:     return "WAITING";
        case PATIENT_ASSIGNED:    return "ASSIGNED";
        case PATIENT_IN_TRANSIT:  return "IN_TRANSIT";
        case PATIENT_TRANSFERRED: return "TRANSFERRED";
        case PATIENT_COMPLETED:   return "COMPLETED";
        default:                  return "UNKNOWN";
    }
}

static const char* ambulance_state_to_str(AmbulanceState s) {
    switch(s) {
        case AMB_AVAILABLE:  return "AVAILABLE";
        case AMB_DISPATCHED: return "DISPATCHED";
        case AMB_ARRIVED:    return "ARRIVED";
        case AMB_COMPLETED:  return "COMPLETED";
        case AMB_CANCELLED:  return "CANCELLED";
        default:             return "UNKNOWN";
    }
}

static const char* opcode_to_str(OpCode op) {
    switch(op) {
        case OP_REGISTER_PATIENT:   return "REGISTER_PATIENT";
        case OP_SET_LOCATION:       return "SET_LOCATION";
        case OP_SET_SEVERITY:       return "SET_SEVERITY";
        case OP_REGISTER_AMBULANCE: return "REGISTER_AMBULANCE";
        case OP_REGISTER_HOSPITAL:  return "REGISTER_HOSPITAL";
        case OP_DISPATCH:           return "DISPATCH";
        case OP_ASSIGN_ROUTE:       return "ASSIGN_ROUTE";
        case OP_SET_PRIORITY:       return "SET_PRIORITY";
        case OP_STATUS:             return "STATUS";
        case OP_DISTANCE:           return "DISTANCE";
        case OP_TRANSFER:           return "TRANSFER";
        case OP_SPEED:              return "SPEED";
        case OP_REPORT:             return "REPORT";
        default:                    return "UNKNOWN_OP";
    }
}

#endif /* TOKENS_H */
