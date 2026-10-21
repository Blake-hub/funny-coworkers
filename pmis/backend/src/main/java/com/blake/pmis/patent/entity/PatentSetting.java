package com.blake.pmis.patent.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Singleton settings row (id=1) for the patent module. Created by the
 * V24 migration; code should read/write this row only.
 */
@Entity
@Table(name = "patent_setting")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Linked wiki page used as the controlled patent writing guide; null when unset. */
    @Column(name = "guide_page_id")
    private Long guidePageId;
}
