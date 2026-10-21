package com.blake.pmis.util;

import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exhaustive checks of the patent transition table:
 * every (type, from, to) triple is asserted against the expected edges.
 */
class PatentStateMachineTest {

    private static final Map<PatentStatus, Set<PatentStatus>> EXPECTED_STANDARD = Map.ofEntries(
            Map.entry(PatentStatus.SUBMITTED,
                    Set.of(PatentStatus.RECEIVED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.RECEIVED,
                    Set.of(PatentStatus.PAID, PatentStatus.CANCELLED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.PAID,
                    Set.of(PatentStatus.ACCEPTED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.ACCEPTED,
                    Set.of(PatentStatus.PRELIMINARY_PASSED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.PRELIMINARY_PASSED,
                    Set.of(PatentStatus.PUBLISHED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.PUBLISHED,
                    Set.of(PatentStatus.SUBSTANTIVE_EXAM, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.PRIORITY_GRANTED,
                    Set.of(PatentStatus.SUBSTANTIVE_EXAM, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.SUBSTANTIVE_EXAM,
                    Set.of(PatentStatus.OA_RESPONSE, PatentStatus.REGISTERING,
                            PatentStatus.REJECTED, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.OA_RESPONSE,
                    Set.of(PatentStatus.OA_RESPONSE, PatentStatus.REGISTERING,
                            PatentStatus.REJECTED, PatentStatus.DEEMED_WITHDRAWN,
                            PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.REGISTERING,
                    Set.of(PatentStatus.FEE_PAID, PatentStatus.WITHDRAWN)),
            Map.entry(PatentStatus.FEE_PAID,
                    Set.of(PatentStatus.GRANTED, PatentStatus.WITHDRAWN)));

    @Test
    void standardPathMatchesExpectedTable() {
        for (PatentStatus from : PatentStatus.values()) {
            for (PatentStatus to : PatentStatus.values()) {
                boolean expected = EXPECTED_STANDARD
                        .getOrDefault(from, Set.of()).contains(to);
                assertEquals(expected, PatentStateMachine.canTransition(PatentType.STANDARD, from, to),
                        () -> "STANDARD " + from + " -> " + to);
            }
        }
    }

    @Test
    void preemptiveSharesStandardTableInPhase12() {
        for (PatentStatus from : PatentStatus.values()) {
            for (PatentStatus to : PatentStatus.values()) {
                assertEquals(PatentStateMachine.canTransition(PatentType.STANDARD, from, to),
                        PatentStateMachine.canTransition(PatentType.PREEMPTIVE, from, to),
                        () -> "PREEMPTIVE should mirror STANDARD: " + from + " -> " + to);
            }
        }
    }

    @Test
    void priorityInsertsPriorityGrantedBetweenPublishedAndSubstantiveExam() {
        for (PatentStatus to : PatentStatus.values()) {
            boolean expected = Set.of(PatentStatus.PRIORITY_GRANTED, PatentStatus.WITHDRAWN).contains(to);
            assertEquals(expected, PatentStateMachine.canTransition(PatentType.PRIORITY, PatentStatus.PUBLISHED, to),
                    () -> "PRIORITY PUBLISHED -> " + to);
        }
    }

    @Test
    void terminalStatesHaveNoOutgoingTransitions() {
        for (PatentStatus terminal : PatentStatus.values()) {
            if (PatentStateMachine.isTerminal(terminal)) {
                for (PatentStatus to : PatentStatus.values()) {
                    assertFalse(PatentStateMachine.canTransition(PatentType.STANDARD, terminal, to),
                            () -> "Terminal " + terminal + " must not transition to " + to);
                }
            }
        }
        assertTrue(PatentStateMachine.isTerminal(PatentStatus.GRANTED));
        assertTrue(PatentStateMachine.isTerminal(PatentStatus.CANCELLED));
        assertTrue(PatentStateMachine.isTerminal(PatentStatus.REJECTED));
        assertTrue(PatentStateMachine.isTerminal(PatentStatus.DEEMED_WITHDRAWN));
        assertTrue(PatentStateMachine.isTerminal(PatentStatus.WITHDRAWN));
    }

    @Test
    void targetRequirementsMatchSpecification() {
        // NOTICE attachment mandatory for official-notice states.
        for (PatentStatus to : PatentStatus.values()) {
            boolean noticeRequired = Set.of(PatentStatus.ACCEPTED, PatentStatus.PRELIMINARY_PASSED,
                    PatentStatus.PUBLISHED, PatentStatus.PRIORITY_GRANTED, PatentStatus.SUBSTANTIVE_EXAM,
                    PatentStatus.OA_RESPONSE, PatentStatus.REGISTERING, PatentStatus.GRANTED).contains(to);
            assertEquals(noticeRequired, PatentStateMachine.requiresNoticeAttachment(to),
                    () -> "NOTICE attachment rule for " + to);
        }

        assertTrue(PatentStateMachine.requiresApplicationNumber(PatentStatus.ACCEPTED));
        assertFalse(PatentStateMachine.requiresApplicationNumber(PatentStatus.GRANTED));
        assertTrue(PatentStateMachine.requiresCertificateNumber(PatentStatus.GRANTED));
        assertFalse(PatentStateMachine.requiresCertificateNumber(PatentStatus.ACCEPTED));
        assertTrue(PatentStateMachine.requiresApplicationTypeConfirm(PatentStatus.PAID));
        assertFalse(PatentStateMachine.requiresApplicationTypeConfirm(PatentStatus.RECEIVED));
    }

    @Test
    void nullArgumentsAreRejected() {
        assertFalse(PatentStateMachine.canTransition(null, PatentStatus.SUBMITTED, PatentStatus.RECEIVED));
        assertFalse(PatentStateMachine.canTransition(PatentType.STANDARD, null, PatentStatus.RECEIVED));
        assertFalse(PatentStateMachine.canTransition(PatentType.STANDARD, PatentStatus.SUBMITTED, null));
        assertEquals(Set.of(), PatentStateMachine.allowedTargets(null, PatentStatus.SUBMITTED));
    }
}
