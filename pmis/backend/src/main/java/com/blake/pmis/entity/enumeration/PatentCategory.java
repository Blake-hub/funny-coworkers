package com.blake.pmis.entity.enumeration;

/**
 * Patent category (Chinese statutory classification), distinct from
 * {@link PatentType} which is the examination path (STANDARD / PRIORITY / PREEMPTIVE).
 */
public enum PatentCategory {
    /** 发明专利 */
    INVENTION,
    /** 实用新型专利 */
    UTILITY_MODEL,
    /** 外观设计专利 */
    DESIGN
}
