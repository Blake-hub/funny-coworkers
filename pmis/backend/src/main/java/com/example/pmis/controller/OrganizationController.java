package com.example.pmis.controller;

import com.example.pmis.dto.DepartmentDTO;
import com.example.pmis.dto.OrganizationDTO;
import com.example.pmis.dto.UserDTO;
import com.example.pmis.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations", description = "Organization management APIs")
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/{id}")
    @Operation(summary = "Get organization by ID")
    public ResponseEntity<OrganizationDTO> getOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getOrganization(id));
    }

    @PostMapping
    @Operation(summary = "Create a new organization")
    public ResponseEntity<OrganizationDTO> createOrganization(@Valid @RequestBody OrganizationDTO organizationDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.createOrganization(organizationDTO));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an organization")
    public ResponseEntity<OrganizationDTO> updateOrganization(@PathVariable Long id, @Valid @RequestBody OrganizationDTO organizationDTO) {
        return ResponseEntity.ok(organizationService.updateOrganization(id, organizationDTO));
    }

    @GetMapping("/{id}/departments")
    @Operation(summary = "Get all departments for an organization")
    public ResponseEntity<List<DepartmentDTO>> getDepartments(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getDepartments(id));
    }

    @GetMapping("/{id}/employees")
    @Operation(summary = "Get all employees for an organization")
    public ResponseEntity<List<UserDTO>> getEmployees(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getEmployees(id));
    }

    @PostMapping("/{id}/departments")
    @Operation(summary = "Create a new department")
    public ResponseEntity<DepartmentDTO> createDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDTO departmentDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.createDepartment(id, departmentDTO));
    }

    @PutMapping("/departments/{id}")
    @Operation(summary = "Update a department")
    public ResponseEntity<DepartmentDTO> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDTO departmentDTO) {
        return ResponseEntity.ok(organizationService.updateDepartment(id, departmentDTO));
    }

    @DeleteMapping("/departments/{id}")
    @Operation(summary = "Delete a department")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        organizationService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}