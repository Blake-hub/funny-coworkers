package com.blake.pmis.util;

import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Patent status machine: legality of (type, from -&gt; to) transitions plus
 * per-target requirements for the transition dialog.
 *
 * PREEMPTIVE shares the STANDARD table in Phase 1/2 (per requirements section 5.2);
 * the dedicated PREEMPTIVE branch is reserved for Phase 3.
 */
public final class PatentStateMachine {

    private PatentStateMachine() {
    }

    /** Terminal states: no outgoing transitions. */
    private static final Set<PatentStatus> TERMINAL = EnumSet.of(
            PatentStatus.GRANTED,
            PatentStatus.CANCELLED,
            PatentStatus.REJECTED,
            PatentStatus.DEEMED_WITHDRAWN,
            PatentStatus.WITHDRAWN);

    /** STANDARD transition table (also used by PREEMPTIVE in Phase 1/2). */
    private static final Map<PatentStatus, Set<PatentStatus>> STANDARD = buildStandardTable();

    private static Map<PatentStatus, Set<PatentStatus>> buildStandardTable() {
        return Map.ofEntries(
                Map.entry(PatentStatus.SUBMITTED,
                        EnumSet.of(PatentStatus.RECEIVED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.RECEIVED,
                        EnumSet.of(PatentStatus.PAID, PatentStatus.CANCELLED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.PAID,
                        EnumSet.of(PatentStatus.ACCEPTED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.ACCEPTED,
                        EnumSet.of(PatentStatus.PRELIMINARY_PASSED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.PRELIMINARY_PASSED,
                        EnumSet.of(PatentStatus.PUBLISHED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.PRIORITY_GRANTED,
                        EnumSet.of(PatentStatus.SUBSTANTIVE_EXAM, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.SUBSTANTIVE_EXAM,
                        EnumSet.of(PatentStatus.OA_RESPONSE, PatentStatus.REGISTERING,
                                PatentStatus.REJECTED, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.OA_RESPONSE,
                        EnumSet.of(PatentStatus.OA_RESPONSE, PatentStatus.REGISTERING,
                                PatentStatus.REJECTED, PatentStatus.DEEMED_WITHDRAWN,
                                PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.REGISTERING,
                        EnumSet.of(PatentStatus.FEE_PAID, PatentStatus.WITHDRAWN)),
                Map.entry(PatentStatus.FEE_PAID,
                        EnumSet.of(PatentStatus.GRANTED, PatentStatus.WITHDRAWN)));
        // PUBLISHED is type-dependent; handled in allowedTargets().
    }

    /**
     * All legal target statuses from {@code from} for the given application type,
     * used by the admin transition dialog.
     */
    public static Set<PatentStatus> allowedTargets(PatentType type, PatentStatus from) {
        if (type == null || from == null || TERMINAL.contains(from)) {
            return Set.of();
        }
        if (from == PatentStatus.PUBLISHED) {
            return type == PatentType.PRIORITY
                    ? EnumSet.of(PatentStatus.PRIORITY_GRANTED, PatentStatus.WITHDRAWN)
                    : EnumSet.of(PatentStatus.SUBSTANTIVE_EXAM, PatentStatus.WITHDRAWN);
        }
        Set<PatentStatus> targets = STANDARD.get(from);
        return targets == null ? Set.of() : targets;
    }

    public static boolean canTransition(PatentType type, PatentStatus from, PatentStatus to) {
        if (type == null || from == null || to == null) {
            return false;
        }
        return allowedTargets(type, from).contains(to);
    }

    /** True when the target state requires an official notice attachment. */
    public static boolean requiresNoticeAttachment(PatentStatus to) {
        return to == PatentStatus.ACCEPTED
                || to == PatentStatus.PRELIMINARY_PASSED
                || to == PatentStatus.PUBLISHED
                || to == PatentStatus.PRIORITY_GRANTED
                || to == PatentStatus.SUBSTANTIVE_EXAM
                || to == PatentStatus.OA_RESPONSE
                || to == PatentStatus.REGISTERING
                || to == PatentStatus.GRANTED;
    }

    public static boolean requiresApplicationNumber(PatentStatus to) {
        return to == PatentStatus.ACCEPTED;
    }

    public static boolean requiresCertificateNumber(PatentStatus to) {
        return to == PatentStatus.GRANTED;
    }

    /** Transitioning to PAID must confirm the application type (agency pre-review conclusion). */
    public static boolean requiresApplicationTypeConfirm(PatentStatus to) {
        return to == PatentStatus.PAID;
    }

    public static boolean isTerminal(PatentStatus status) {
        return TERMINAL.contains(status);
    }
}
