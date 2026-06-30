package com.retroboard.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cards")
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = true, length = 255)
    private String title = "";
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "column_id", nullable = false)
    @JsonIgnoreProperties({"board", "createdAt", "updatedAt", "position"})
    private BoardColumn column;
    
    @Column(name = "position", nullable = false)
    private Integer position;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "votes", nullable = false)
    private Integer votes = 0;
    
    @Transient
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean votedByCurrentUser;
    
    @PrePersist
    protected void onCreate() {
        if (title == null) {
            title = "";
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}