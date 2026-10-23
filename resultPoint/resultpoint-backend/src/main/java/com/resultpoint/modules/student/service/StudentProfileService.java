package com.resultpoint.modules.student.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.catalog.entity.Course;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.catalog.entity.University;
import com.resultpoint.modules.catalog.repository.CourseRepository;
import com.resultpoint.modules.catalog.repository.RegulationRepository;
import com.resultpoint.modules.catalog.repository.UniversityRepository;
import com.resultpoint.modules.student.domain.StudentProfile;
import com.resultpoint.modules.student.dto.StudentProfileDto;
import com.resultpoint.modules.student.dto.UpdateStudentProfileRequest;
import com.resultpoint.modules.student.repository.StudentProfileRepository;
import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final RegulationRepository regulationRepository;

    @Transactional(readOnly = true)
    public StudentProfileDto getProfileByUserId(String userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
        return mapToDto(profile);
    }

    @Transactional(readOnly = true)
    public StudentProfile getOrCreateProfileEntity(String userId) {
        return studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
    }

    @Transactional
    public StudentProfileDto createOrUpdateProfile(String userId, UpdateStudentProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        University university = universityRepository.findById(request.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University", "id", request.getUniversityId()));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        if (!course.getUniversity().getId().equals(university.getId())) {
            throw new IllegalArgumentException(String.format("Course '%s' does not belong to university '%s'",
                    course.getName(), university.getName()));
        }

        Regulation regulation = regulationRepository.findById(request.getRegulationId())
                .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", request.getRegulationId()));

        if (!regulation.getCourse().getId().equals(course.getId())) {
            throw new IllegalArgumentException(String.format("Regulation '%s' does not belong to course '%s'",
                    regulation.getName(), course.getName()));
        }

        if (request.getCurrentSemester() > course.getTotalSemesters()) {
            throw new IllegalArgumentException(String.format("Current semester (%d) exceeds course total semesters (%d)",
                    request.getCurrentSemester(), course.getTotalSemesters()));
        }

        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);

        if (profile == null) {
            if (studentProfileRepository.existsByUniversityIdAndHallTicketNumber(university.getId(), request.getHallTicketNumber())) {
                throw new IllegalArgumentException(String.format("Hall ticket number '%s' is already registered for %s",
                        request.getHallTicketNumber(), university.getName()));
            }
            profile = StudentProfile.builder()
                    .id(IdGenerator.generateStudentProfileId())
                    .user(user)
                    .build();
        } else {
            if (studentProfileRepository.existsByUniversityIdAndHallTicketNumberAndIdNot(
                    university.getId(), request.getHallTicketNumber(), profile.getId())) {
                throw new IllegalArgumentException(String.format("Hall ticket number '%s' is already registered for %s",
                        request.getHallTicketNumber(), university.getName()));
            }
        }

        profile.setUniversity(university);
        profile.setCourse(course);
        profile.setRegulation(regulation);
        profile.setBatchYear(request.getBatchYear());
        profile.setHallTicketNumber(request.getHallTicketNumber());
        profile.setInstitutionName(request.getInstitutionName());
        profile.setCurrentSemester(request.getCurrentSemester());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        if (request.getTargetCgpa() != null) {
            profile.setTargetCgpa(request.getTargetCgpa());
        }

        StudentProfile saved = studentProfileRepository.save(profile);
        log.info("Student profile updated successfully for user ID: {}", userId);
        return mapToDto(saved);
    }

    public StudentProfileDto mapToDto(StudentProfile p) {
        return StudentProfileDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .userFullName(p.getUser().getFullName())
                .userEmail(p.getUser().getEmail())
                .universityId(p.getUniversity().getId())
                .universityName(p.getUniversity().getName())
                .courseId(p.getCourse().getId())
                .courseName(p.getCourse().getName())
                .courseLevel(p.getCourse().getLevel() != null ? p.getCourse().getLevel().name() : null)
                .regulationId(p.getRegulation().getId())
                .regulationCode(p.getRegulation().getCode())
                .batchYear(p.getBatchYear())
                .hallTicketNumber(p.getHallTicketNumber())
                .institutionName(p.getInstitutionName())
                .currentSemester(p.getCurrentSemester())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .cumulativeCgpa(p.getCumulativeCgpa())
                .totalCreditsEarned(p.getTotalCreditsEarned())
                .targetCgpa(p.getTargetCgpa())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
