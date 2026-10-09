/**
 * intermediate.c
 * MedRoute Compiler - Intermediate Code Generator
 * ============================================================
 * Builds a linked list of IRInstruction nodes, one per
 * semantically-valid MedRoute statement. Also provides
 * text and JSON dump methods for display in the IDE.
 */

#include "intermediate.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* ============================================================
 * INTERNAL: allocate and append a new instruction
 * ============================================================ */
static IRInstruction* _new_instr(IRProgram *prog, OpCode op, int line) {
    IRInstruction *instr = (IRInstruction*)calloc(1, sizeof(IRInstruction));
    instr->opcode   = op;
    instr->line_num = line;
    instr->next     = NULL;

    if (!prog->head) { prog->head = instr; prog->tail = instr; }
    else             { prog->tail->next = instr; prog->tail = instr; }
    prog->count++;
    return instr;
}

/* ============================================================
 * LIFECYCLE
 * ============================================================ */
IRProgram* ir_create(void) {
    IRProgram *prog = (IRProgram*)calloc(1, sizeof(IRProgram));
    return prog;
}

void ir_reset(IRProgram *prog) {
    if (!prog) return;
    IRInstruction *cur = prog->head;
    while (cur) { IRInstruction *nx = cur->next; free(cur); cur = nx; }
    prog->head  = NULL;
    prog->tail  = NULL;
    prog->count = 0;
}

void ir_destroy(IRProgram *prog) {
    if (!prog) return;
    ir_reset(prog);
    free(prog);
}

/* ============================================================
 * EMIT FUNCTIONS
 * ============================================================ */
void ir_emit_register_patient(IRProgram *p, const char *pid, int line) {
    IRInstruction *i = _new_instr(p, OP_REGISTER_PATIENT, line);
    strncpy(i->arg1, pid, 63);
}

void ir_emit_set_location(IRProgram *p, const char *pid, const char *loc, int line) {
    IRInstruction *i = _new_instr(p, OP_SET_LOCATION, line);
    strncpy(i->arg1, pid, 63);
    strncpy(i->arg3, loc, 255);
}

void ir_emit_set_severity(IRProgram *p, const char *pid, const char *sev, int line) {
    IRInstruction *i = _new_instr(p, OP_SET_SEVERITY, line);
    strncpy(i->arg1, pid, 63);
    strncpy(i->arg2, sev, 63);
}

void ir_emit_register_ambulance(IRProgram *p, const char *aid, int line) {
    IRInstruction *i = _new_instr(p, OP_REGISTER_AMBULANCE, line);
    strncpy(i->arg1, aid, 63);
}

void ir_emit_register_hospital(IRProgram *p, const char *hid, const char *name, int line) {
    IRInstruction *i = _new_instr(p, OP_REGISTER_HOSPITAL, line);
    strncpy(i->arg1, hid, 63);
    strncpy(i->arg3, name, 255);
}

void ir_emit_dispatch(IRProgram *p, const char *aid, const char *pid, int line) {
    IRInstruction *i = _new_instr(p, OP_DISPATCH, line);
    strncpy(i->arg1, aid, 63);
    strncpy(i->arg2, pid, 63);
}

void ir_emit_assign_route(IRProgram *p, const char *aid, const char *hid, int line) {
    IRInstruction *i = _new_instr(p, OP_ASSIGN_ROUTE, line);
    strncpy(i->arg1, aid, 63);
    strncpy(i->arg2, hid, 63);
}

void ir_emit_set_priority(IRProgram *p, const char *aid, const char *pri, int line) {
    IRInstruction *i = _new_instr(p, OP_SET_PRIORITY, line);
    strncpy(i->arg1, aid, 63);
    strncpy(i->arg2, pri, 63);
}

void ir_emit_status(IRProgram *p, const char *aid, int line) {
    IRInstruction *i = _new_instr(p, OP_STATUS, line);
    strncpy(i->arg1, aid, 63);
}

void ir_emit_arrive(IRProgram *p, const char *aid, int line) {
    IRInstruction *i = _new_instr(p, OP_ARRIVE, line);
    strncpy(i->arg1, aid, 63);
}

void ir_emit_transfer(IRProgram *p, const char *pid, const char *hid, int line) {
    IRInstruction *i = _new_instr(p, OP_TRANSFER, line);
    strncpy(i->arg1, pid, 63);
    strncpy(i->arg2, hid, 63);
}

void ir_emit_cancel(IRProgram *p, const char *aid, int line) {
    IRInstruction *i = _new_instr(p, OP_CANCEL, line);
    strncpy(i->arg1, aid, 63);
}

void ir_emit_report(IRProgram *p, int line) {
    _new_instr(p, OP_REPORT, line);
}

/* ============================================================
 * TEXT DUMP
 * ============================================================ */
void ir_dump_text(IRProgram *p, FILE *out) {
    if (!p || !out) return;
    IRInstruction *cur = p->head;
    int idx = 1;
    while (cur) {
        /* Format: 001  REGISTER_PATIENT     P101 */
        char line_buf[512] = {0};
        const char *op = opcode_to_str(cur->opcode);

        if (strlen(cur->arg1) > 0 && strlen(cur->arg2) == 0 && strlen(cur->arg3) == 0) {
            snprintf(line_buf, sizeof(line_buf), "%03d  %-24s %s", idx, op, cur->arg1);
        } else if (strlen(cur->arg1) > 0 && strlen(cur->arg3) > 0 && strlen(cur->arg2) == 0) {
            snprintf(line_buf, sizeof(line_buf), "%03d  %-24s %s  \"%s\"", idx, op, cur->arg1, cur->arg3);
        } else if (strlen(cur->arg1) > 0 && strlen(cur->arg2) > 0 && strlen(cur->arg3) == 0) {
            snprintf(line_buf, sizeof(line_buf), "%03d  %-24s %s  %s", idx, op, cur->arg1, cur->arg2);
        } else if (strlen(cur->arg1) > 0 && strlen(cur->arg2) > 0 && strlen(cur->arg3) > 0) {
            snprintf(line_buf, sizeof(line_buf), "%03d  %-24s %s  %s  \"%s\"", idx, op, cur->arg1, cur->arg2, cur->arg3);
        } else {
            snprintf(line_buf, sizeof(line_buf), "%03d  %s", idx, op);
        }

        fprintf(out, "%s\n", line_buf);
        idx++;
        cur = cur->next;
    }
}

/* ============================================================
 * JSON DUMP
 * ============================================================ */
void ir_dump_json(IRProgram *p, FILE *out) {
    if (!p || !out) return;
    fprintf(out, "[\n");
    IRInstruction *cur = p->head;
    int idx = 1, first = 1;
    while (cur) {
        if (!first) fprintf(out, ",\n");
        fprintf(out,
            "  {\"index\":%d,\"opcode\":\"%s\",\"arg1\":\"%s\","
            "\"arg2\":\"%s\",\"arg3\":\"%s\",\"line\":%d}",
            idx, opcode_to_str(cur->opcode),
            cur->arg1, cur->arg2, cur->arg3, cur->line_num);
        first = 0;
        idx++;
        cur = cur->next;
    }
    fprintf(out, "\n]\n");
}
