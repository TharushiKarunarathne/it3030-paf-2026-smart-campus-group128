package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    // Find all by type
    List<Resource> findByType(Resource.ResourceType type);

    // Find all by status
    List<Resource> findByStatus(Resource.ResourceStatus status);

    // Find by type and status together
    List<Resource> findByTypeAndStatus(
        Resource.ResourceType type,
        Resource.ResourceStatus status
    );

    // Search by name containing keyword (case insensitive)
    List<Resource> findByNameContainingIgnoreCase(String keyword);

    // Check if name already exists
    boolean existsByNameIgnoreCase(String name);
}