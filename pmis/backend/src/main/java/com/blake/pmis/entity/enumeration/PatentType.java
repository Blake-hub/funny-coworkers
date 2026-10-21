package com.blake.pmis.entity.enumeration;

/**
 * Patent application type.
 * STANDARD: regular invention patent application.
 * PRIORITY: priority examination (adds the PRIORITY_GRANTED step between PUBLISHED and SUBSTANTIVE_EXAM).
 * PREEMPTIVE: preemptive examination path; designed for Phase 3. In Phase 1/2 it is
 * registered as a type value only and follows the STANDARD transition table.
 */
public enum PatentType {
    STANDARD,
    PRIORITY,
    PREEMPTIVE
}
