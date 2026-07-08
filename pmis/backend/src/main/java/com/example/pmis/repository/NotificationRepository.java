package com.example.pmis.repository;

import com.example.pmis.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndReadStatus(Long userId, Boolean readStatus);

    Page<Notification> findByUserId(Long userId, Pageable pageable);

    Optional<Notification> findOneByUserIdAndTargetTypeAndTargetIdAndActorUserIdAndType(
            Long userId, String targetType, Long targetId, Long actorUserId, String type);

    long countByUserIdAndReadStatus(Long userId, Boolean readStatus);

    @Modifying
    @Query("UPDATE Notification n SET n.readStatus = true WHERE n.userId = :userId AND n.readStatus = false")
    int markAllAsReadForUserId(@Param("userId") Long userId);
}