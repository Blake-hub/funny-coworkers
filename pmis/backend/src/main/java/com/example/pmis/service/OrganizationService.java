package com.example.pmis.service;

import com.example.pmis.dto.DepartmentDTO;
import com.example.pmis.dto.OrganizationDTO;
import com.example.pmis.dto.UserDTO;
import com.example.pmis.entity.Department;
import com.example.pmis.entity.Organization;
import com.example.pmis.entity.User;
import com.example.pmis.repository.DepartmentRepository;
import com.example.pmis.repository.OrganizationRepository;
import com.example.pmis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public OrganizationDTO getOrganization(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
        return convertToDTO(org);
    }

    @Transactional
    public OrganizationDTO createOrganization(OrganizationDTO organizationDTO) {
        Organization org = convertToEntity(organizationDTO);
        Organization savedOrg = organizationRepository.save(org);
        return convertToDTO(savedOrg);
    }

    @Transactional
    public OrganizationDTO updateOrganization(Long id, OrganizationDTO organizationDTO) {
        Organization existingOrg = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));

        existingOrg.setName(organizationDTO.getName());
        existingOrg.setDescription(organizationDTO.getDescription());
        existingOrg.setWebsite(organizationDTO.getWebsite());
        existingOrg.setLogoUrl(organizationDTO.getLogoUrl());

        Organization updatedOrg = organizationRepository.save(existingOrg);
        return convertToDTO(updatedOrg);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getDepartments(Long organizationId) {
        List<Department> departments = departmentRepository.findByOrganizationId(organizationId);
        return departments.stream()
                .map(this::convertDepartmentToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getEmployees(Long organizationId) {
        List<User> employees = userRepository.findByOrganizationId(organizationId);
        return employees.stream()
                .map(this::convertUserToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDTO createDepartment(Long organizationId, DepartmentDTO departmentDTO) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new RuntimeException("Organization not found with id: " + organizationId);
        }

        Department department = convertDepartmentToEntity(departmentDTO);
        department.setOrganizationId(organizationId);
        Department savedDepartment = departmentRepository.save(department);
        return convertDepartmentToDTO(savedDepartment);
    }

    @Transactional
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO departmentDTO) {
        Department existingDepartment = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));

        existingDepartment.setName(departmentDTO.getName());
        existingDepartment.setDescription(departmentDTO.getDescription());
        existingDepartment.setParentDepartmentId(departmentDTO.getParentDepartmentId());
        existingDepartment.setLeadUserId(departmentDTO.getLeadUserId());

        Department updatedDepartment = departmentRepository.save(existingDepartment);
        return convertDepartmentToDTO(updatedDepartment);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Department not found with id: " + id);
        }
        departmentRepository.deleteById(id);
    }

    private OrganizationDTO convertToDTO(Organization org) {
        return OrganizationDTO.builder()
                .id(org.getId())
                .name(org.getName())
                .description(org.getDescription())
                .website(org.getWebsite())
                .logoUrl(org.getLogoUrl())
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }

    private Organization convertToEntity(OrganizationDTO dto) {
        return Organization.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .website(dto.getWebsite())
                .logoUrl(dto.getLogoUrl())
                .build();
    }

    private DepartmentDTO convertDepartmentToDTO(Department department) {
        DepartmentDTO.DepartmentDTOBuilder builder = DepartmentDTO.builder()
                .id(department.getId())
                .organizationId(department.getOrganizationId())
                .name(department.getName())
                .description(department.getDescription())
                .parentDepartmentId(department.getParentDepartmentId())
                .leadUserId(department.getLeadUserId())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt());

        if (department.getParentDepartmentId() != null) {
            departmentRepository.findById(department.getParentDepartmentId())
                    .ifPresent(parent -> builder.parentDepartmentName(parent.getName()));
        }

        return builder.build();
    }

    private Department convertDepartmentToEntity(DepartmentDTO dto) {
        return Department.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .parentDepartmentId(dto.getParentDepartmentId())
                .leadUserId(dto.getLeadUserId())
                .build();
    }

    private UserDTO convertUserToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .teamId(user.getTeamId())
                .organizationId(user.getOrganizationId())
                .departmentId(user.getDepartmentId())
                .build();
    }
}