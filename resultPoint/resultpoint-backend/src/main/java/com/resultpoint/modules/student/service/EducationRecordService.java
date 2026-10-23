package com.resultpoint.modules.student.service;

import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.student.domain.EducationRecord;
import com.resultpoint.modules.student.domain.EducationRecordSubject;
import com.resultpoint.modules.student.dto.CreateEducationRecordRequest;
import com.resultpoint.modules.student.dto.EducationRecordDto;
import com.resultpoint.modules.student.dto.EducationRecordSubjectDto;
import com.resultpoint.modules.student.repository.EducationRecordRepository;
import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EducationRecordService {

    private final EducationRecordRepository educationRecordRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EducationRecordDto> getEducationRecords(String userId) {
        return educationRecordRepository.findByUserIdOrderByPassingYearDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EducationRecordDto createEducationRecord(String userId, CreateEducationRecordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        EducationRecord record = EducationRecord.builder()
                .id(IdGenerator.generateEducationRecordId())
                .user(user)
                .type(request.getType())
                .level(request.getLevel())
                .categoryGroup(request.getCategoryGroup())
                .boardOrUniversity(request.getBoardOrUniversity())
                .institutionName(request.getInstitutionName())
                .passingYear(request.getPassingYear())
                .academicYear(request.getAcademicYear())
                .rollNumber(request.getRollNumber())
                .entryMode(request.getEntryMode() != null ? request.getEntryMode() : com.resultpoint.modules.student.domain.EntryMode.QUICK)
                .resultStatus(request.getResultStatus() != null ? request.getResultStatus() : com.resultpoint.modules.student.domain.ResultStatus.COMPLETED)
                .totalMarks(request.getTotalMarks())
                .maxMarks(request.getMaxMarks())
                .percentage(request.getPercentage())
                .cgpa(request.getCgpa())
                .finalGrade(request.getFinalGrade())
                .subjects(new ArrayList<>())
                .build();

        if (request.getSubjects() != null) {
            for (EducationRecordSubjectDto subDto : request.getSubjects()) {
                EducationRecordSubject sub = EducationRecordSubject.builder()
                        .educationRecord(record)
                        .subjectName(subDto.getSubjectName())
                        .subjectCode(subDto.getSubjectCode())
                        .marksObtained(subDto.getMarksObtained())
                        .maxMarks(subDto.getMaxMarks())
                        .grade(subDto.getGrade())
                        .credits(subDto.getCredits())
                        .build();
                record.getSubjects().add(sub);
            }
        }

        EducationRecord saved = educationRecordRepository.save(record);
        log.info("Saved education record {} for user {}", saved.getId(), userId);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteEducationRecord(String userId, String recordId) {
        EducationRecord record = educationRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("EducationRecord", "id", recordId));

        if (!record.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("EducationRecord", "id", recordId);
        }

        educationRecordRepository.delete(record);
        log.info("Deleted education record {} for user {}", recordId, userId);
    }

    public EducationRecordDto mapToDto(EducationRecord r) {
        List<EducationRecordSubjectDto> subDtos = r.getSubjects() != null
                ? r.getSubjects().stream()
                .map(s -> EducationRecordSubjectDto.builder()
                        .id(s.getId())
                        .subjectName(s.getSubjectName())
                        .subjectCode(s.getSubjectCode())
                        .marksObtained(s.getMarksObtained())
                        .maxMarks(s.getMaxMarks())
                        .grade(s.getGrade())
                        .credits(s.getCredits())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        return EducationRecordDto.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .type(r.getType())
                .level(r.getLevel())
                .categoryGroup(r.getCategoryGroup())
                .boardOrUniversity(r.getBoardOrUniversity())
                .institutionName(r.getInstitutionName())
                .passingYear(r.getPassingYear())
                .academicYear(r.getAcademicYear())
                .rollNumber(r.getRollNumber())
                .entryMode(r.getEntryMode())
                .resultStatus(r.getResultStatus())
                .totalMarks(r.getTotalMarks())
                .maxMarks(r.getMaxMarks())
                .percentage(r.getPercentage())
                .cgpa(r.getCgpa())
                .finalGrade(r.getFinalGrade())
                .subjects(subDtos)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
