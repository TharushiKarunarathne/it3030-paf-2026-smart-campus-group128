package com.smartcampus.service;

import com.smartcampus.model.Resource;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // ── Get all resources (with optional filters) ──────

    public List<Resource> getAllResources(String type, String status) {
        if (type != null && status != null) {
            return resourceRepository.findByTypeAndStatus(
                Resource.ResourceType.valueOf(type),
                Resource.ResourceStatus.valueOf(status)
            );
        }
        if (type != null) {
            return resourceRepository.findByType(
                Resource.ResourceType.valueOf(type)
            );
        }
        if (status != null) {
            return resourceRepository.findByStatus(
                Resource.ResourceStatus.valueOf(status)
            );
        }
        return resourceRepository.findAll();
    }

    // ── Get single resource ────────────────────────────

    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    // ── Create resource ────────────────────────────────

    public Resource createResource(Map<String, Object> body, String createdBy) {
        String name = (String) body.get("name");
        String type = (String) body.get("type");

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Resource name is required");
        }
        if (type == null || type.isBlank()) {
            throw new RuntimeException("Resource type is required");
        }

        Resource resource = new Resource();
        resource.setName(name);
        resource.setType(Resource.ResourceType.valueOf(type));
        resource.setLocation((String) body.get("location"));
        resource.setDescription((String) body.get("description"));
        resource.setCreatedBy(createdBy);

        // Capacity
        Object cap = body.get("capacity");
        if (cap != null) {
            resource.setCapacity(
                cap instanceof Integer ? (Integer) cap
                    : Integer.parseInt(cap.toString())
            );
        }

        // Status
        String status = (String) body.get("status");
        if (status != null) {
            resource.setStatus(Resource.ResourceStatus.valueOf(status));
        } else {
            resource.setStatus(Resource.ResourceStatus.AVAILABLE);
        }

        // Type-specific details
        Object detailsObj = body.get("details");
        if (detailsObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) detailsObj;
            resource.setDetails(details);
        }

        return resourceRepository.save(resource);
    }

    // ── Update resource ────────────────────────────────

    public Resource updateResource(String id, Map<String, Object> body) {
        Resource resource = getResourceById(id);

        if (body.containsKey("name"))
            resource.setName((String) body.get("name"));

        if (body.containsKey("type"))
            resource.setType(Resource.ResourceType.valueOf((String) body.get("type")));

        if (body.containsKey("location"))
            resource.setLocation((String) body.get("location"));

        if (body.containsKey("description"))
            resource.setDescription((String) body.get("description"));

        if (body.containsKey("capacity")) {
            Object cap = body.get("capacity");
            resource.setCapacity(
                cap == null ? null
                    : cap instanceof Integer ? (Integer) cap
                    : Integer.parseInt(cap.toString())
            );
        }

        if (body.containsKey("status"))
            resource.setStatus(
                Resource.ResourceStatus.valueOf((String) body.get("status"))
            );

        if (body.containsKey("details")) {
            Object detailsObj = body.get("details");
            if (detailsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> details = (Map<String, Object>) detailsObj;
                resource.setDetails(details);
            }
        }

        return resourceRepository.save(resource);
    }

    // ── Update status only ─────────────────────────────

    public Resource updateStatus(String id, String status) {
        Resource resource = getResourceById(id);
        resource.setStatus(Resource.ResourceStatus.valueOf(status));
        return resourceRepository.save(resource);
    }

    // ── Delete resource ────────────────────────────────

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }
}