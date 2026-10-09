# MedRoute Language Specification

## Overview
MedRoute is a Domain-Specific Language (DSL) designed for emergency ambulance dispatch scenarios. It provides a structured syntax for declaring entities (Patients, Ambulances, Hospitals) and executing dispatch instructions.

## Lexical Elements

### Keywords
The language is case-sensitive for keywords (typically uppercase):
*   `PATIENT`
*   `LOCATION`
*   `SEVERITY`
*   `AMBULANCE`
*   `HOSPITAL`
*   `DISPATCH`
*   `ROUTE`
*   `PRIORITY`
*   `STATUS`
*   `ARRIVE`
*   `TRANSFER`
*   `CANCEL`
*   `REPORT`

### Identifiers
Identifiers are used to name entities. Conventionally, they start with a letter indicating the type:
*   `P<number>` for Patients (e.g., `P101`)
*   `A<number>` for Ambulances (e.g., `A12`)
*   `H<number>` for Hospitals (e.g., `H01`)

### Strings
Used for locations and names. Enclosed in double quotes. (e.g., `"Sardar Patel Road"`)

### Enums / Constants
*   **Severity Levels**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
*   **Priority Levels**: `LOW`, `MEDIUM`, `HIGH`

### Comments
Single-line comments are supported using `//`.

## Syntax Rules

### 1. Entity Declarations
Before an entity can be used, it must be declared.

**Patient Declaration:**
```medroute
PATIENT <patient_id>
LOCATION <patient_id> "<location_string>"
SEVERITY <patient_id> <severity_level>
```

**Ambulance Declaration:**
```medroute
AMBULANCE <ambulance_id>
```

**Hospital Declaration:**
```medroute
HOSPITAL <hospital_id> "<hospital_name>"
```

### 2. Dispatch Instructions
Operations to simulate the emergency response.

**Dispatch an Ambulance to a Patient:**
```medroute
DISPATCH <ambulance_id> <patient_id>
```

**Set Route to a Hospital:**
```medroute
ROUTE <ambulance_id> <hospital_id>
```

**Set Priority:**
```medroute
PRIORITY <ambulance_id> <priority_level>
```

### 3. Simulation & State Commands

**Update/Check Status:**
```medroute
STATUS <ambulance_id>
```

**Mark Ambulance Arrival:**
```medroute
ARRIVE <ambulance_id>
```

**Transfer Patient to Hospital:**
```medroute
TRANSFER <patient_id> <hospital_id>
```

**Cancel Dispatch:**
```medroute
CANCEL <ambulance_id>
```

**Generate Final Report:**
```medroute
REPORT
```

## Semantic Rules
The MedRoute compiler strictly enforces logical emergency protocols:
1.  **Undeclared Entities**: An ambulance or patient cannot be dispatched if they haven't been declared.
2.  **Duplicate Declarations**: You cannot declare two entities with the same ID.
3.  **Logical Flow**: An ambulance must be `DISPATCH`ed before it can `ARRIVE`.
4.  **Transfer Logic**: A patient can only be `TRANSFER`red if an ambulance has arrived at their location.
5.  **Availability**: An ambulance cannot be dispatched to two different patients simultaneously unless it has completed the previous transfer.
