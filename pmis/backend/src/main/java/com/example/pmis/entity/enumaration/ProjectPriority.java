package com.example.pmis.entity.enumaration;

import lombok.Getter;

@Getter
public enum ProjectPriority {
    NO_PRIORITY(0, "no_priority", "No Priority"),
    URGENT(1, "urgent", "Urgent"),
    HIGH(2, "high", "High"),
    MEDIUM(3, "medium", "Medium"),
    LOW(4, "low", "Low");

    private final int value;
    private final String key;
    private final String label;

    ProjectPriority(int value, String key, String label) {
        this.value = value;
        this.key = key;
        this.label = label;
    }

    public static ProjectPriority fromValue(int value) {
        for (ProjectPriority priority : values()) {
            if (priority.value == value) {
                return priority;
            }
        }
        throw new IllegalArgumentException("Invalid project priority value: " + value);
    }

    public static ProjectPriority fromKey(String key) {
        for (ProjectPriority priority : values()) {
            if (priority.key.equalsIgnoreCase(key)) {
                return priority;
            }
        }
        throw new IllegalArgumentException("Invalid project priority key: " + key);
    }
}