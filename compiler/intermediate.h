/**
 * intermediate.h
 * MedRoute Compiler - Intermediate Code Generator Header
 */

#ifndef INTERMEDIATE_H
#define INTERMEDIATE_H

#include "tokens.h"
#include <stdio.h>

typedef struct IRProgram {
    IRInstruction *head;
    IRInstruction *tail;
    int            count;
} IRProgram;

IRProgram* ir_create  (void);
void       ir_destroy (IRProgram *prog);
void       ir_reset   (IRProgram *prog);

/* Emit functions — one per statement type */
void ir_emit_register_patient   (IRProgram *p, const char *pid,  int line);
void ir_emit_set_location       (IRProgram *p, const char *pid,  const char *loc,  int line);
void ir_emit_set_severity       (IRProgram *p, const char *pid,  const char *sev,  int line);
void ir_emit_register_ambulance (IRProgram *p, const char *aid,  int line);
void ir_emit_register_hospital  (IRProgram *p, const char *hid,  const char *name, int line);
void ir_emit_dispatch           (IRProgram *p, const char *aid,  const char *pid,  int line);
void ir_emit_assign_route       (IRProgram *p, const char *aid,  const char *hid,  int line);
void ir_emit_set_priority       (IRProgram *p, const char *aid,  const char *pri,  int line);
void ir_emit_status             (IRProgram *p, const char *aid,  int line);
void ir_emit_arrive             (IRProgram *p, const char *aid,  int line);
void ir_emit_transfer           (IRProgram *p, const char *pid,  const char *hid,  int line);
void ir_emit_cancel             (IRProgram *p, const char *aid,  int line);
void ir_emit_report             (IRProgram *p, int line);

/* Output */
void ir_dump_text (IRProgram *p, FILE *out);
void ir_dump_json (IRProgram *p, FILE *out);

#endif /* INTERMEDIATE_H */
