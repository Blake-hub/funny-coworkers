package com.blake.pmis.entity.enumeration;

/**
 * Patent lifecycle status (16 states, 5 of them terminal).
 * See IntellectualProperty-TechnicalDesign.md section 4.2 for the transition table.
 */
public enum PatentStatus {
    /** Applicant created and submitted the application. */
    SUBMITTED,
    /** Patent admin received the disclosure and forwarded it to the agency. */
    RECEIVED,
    /** Agency pre-review concluded the patent is not worth filing. Terminal. */
    CANCELLED,
    /** Agency pre-review passed; agency fee and official fee paid. */
    PAID,
    /** CNIPA issued the acceptance notice. */
    ACCEPTED,
    /** CNIPA issued the preliminary examination passed notice. */
    PRELIMINARY_PASSED,
    /** CNIPA issued the publication notice. */
    PUBLISHED,
    /** CNIPA issued the priority examination notice (PRIORITY type only). */
    PRIORITY_GRANTED,
    /** CNIPA issued the substantive examination notice. */
    SUBSTANTIVE_EXAM,
    /** CNIPA issued an office action notice; may loop for multiple rounds. */
    OA_RESPONSE,
    /** CNIPA issued the registration procedure notice. */
    REGISTERING,
    /** Grant fee paid. */
    FEE_PAID,
    /** CNIPA issued the patent certificate. Terminal. */
    GRANTED,
    /** Application rejected after substantive examination. Terminal. */
    REJECTED,
    /** Deemed withdrawn (e.g. office action not answered in time). Terminal. */
    DEEMED_WITHDRAWN,
    /** Actively withdrawn by the applicant/company. Terminal. */
    WITHDRAWN
}
