package com.example.pmis.entity.enumaration;

import lombok.Getter;

@Getter
public enum ProjectStatus {
    BACKLOG(1, "backlog", "Backlog"),
    PLANNED(2, "planned", "Planned"),
    IN_PROGRESS(3, "in_progress", "In Progress"),
    COMPLETED(4, "completed", "Completed"),
    CANCELED(5, "canceled", "Canceled");

    private final int value;
    private final String key;
    private final String label;

    ProjectStatus(int value, String key, String label) {
        this.value = value;
        this.key = key;
        this.label = label;
    }

    public static ProjectStatus fromValue(int value) {
        for (ProjectStatus status : values()) {
            if (status.value == value) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid project status value: " + value);
    }

    public static ProjectStatus fromKey(String key) {
        for (ProjectStatus status : values()) {
            if (status.key.equalsIgnoreCase(key)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid project status key: " + key);
    }
}