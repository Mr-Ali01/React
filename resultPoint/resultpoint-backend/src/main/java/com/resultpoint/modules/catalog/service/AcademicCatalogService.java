package com.resultpoint.modules.catalog.service;

import com.resultpoint.common.exception.InvalidRequestException;
import com.resultpoint.common.exception.ResourceNotFoundException;
import com.resultpoint.common.util.IdGenerator;
import com.resultpoint.modules.calculation.dto.CalculationRuleDto;
import com.resultpoint.modules.calculation.dto.GradeBoundaryDto;
import com.resultpoint.modules.calculation.dto.GradingScaleDto;
import com.resultpoint.modules.calculation.entity.CalculationRule;
import com.resultpoint.modules.calculation.entity.GradingScale;
import com.resultpoint.modules.calculation.repository.CalculationRuleRepository;
import com.resultpoint.modules.calculation.repository.GradingScaleRepository;
import com.resultpoint.modules.catalog.dto.*;
import com.resultpoint.modules.catalog.entity.*;
import com.resultpoint.modules.catalog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademicCatalogService {

    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final RegulationRepository regulationRepository;
    private final RegulationSubjectRepository regulationSubjectRepository;
    private final GradingScaleRepository gradingScaleRepository;
    private final CalculationRuleRepository calculationRuleRepository;

    // --- Universities ---

    public Page<UniversityDto> searchUniversities(UniversityStatus status, String search, Pageable pageable) {
        return universityRepository.searchUniversities(status, search, pageable)
                .map(this::mapToUniversityDto);
    }

    public UniversityDetailDto getUniversityById(String id) {
        University university = universityRepository.findByIdWithCourses(id)
                .orElseThrow(() -> new ResourceNotFoundException("University", "id", id));

        List<CourseDto> courseDtos = university.getCourses().stream()
                .filter(c -> c.getStatus() == CourseStatus.ACTIVE)
                .map(this::mapToCourseDto)
                .collect(Collectors.toList());

        return UniversityDetailDto.builder()
                .university(mapToUniversityDto(university))
                .courses(courseDtos)
                .build();
    }

    @Transactional
    public UniversityDto createUniversity(CreateUniversityRequest request) {
        if (universityRepository.existsByShortName(request.getShortName().trim())) {
            throw new InvalidRequestException("University with short name '" + request.getShortName() + "' already exists");
        }

        University university = University.builder()
                .id(IdGenerator.generateUniversityId())
                .name(request.getName().trim())
                .shortName(request.getShortName().trim().toUpperCase())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .type(request.getType().trim())
                .website(request.getWebsite())
                .accreditation(request.getAccreditation())
                .establishedYear(request.getEstablishedYear())
                .status(UniversityStatus.ACTIVE)
                .build();

        University saved = universityRepository.save(university);
        log.info("Created university: {} [{}]", saved.getName(), saved.getId());
        return mapToUniversityDto(saved);
    }

    // --- Courses ---

    public Page<CourseDto> searchCourses(String universityId, CourseLevel level, CourseStatus status, String search, Pageable pageable) {
        return courseRepository.searchCourses(universityId, level, status, search, pageable)
                .map(this::mapToCourseDto);
    }

    public List<CourseDto> getCoursesByUniversity(String universityId) {
        if (!universityRepository.existsById(universityId)) {
            throw new ResourceNotFoundException("University", "id", universityId);
        }
        return courseRepository.findByUniversityId(universityId).stream()
                .map(this::mapToCourseDto)
                .collect(Collectors.toList());
    }

    public CourseDetailDto getCourseById(String id) {
        Course course = courseRepository.findByIdWithRegulations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        List<RegulationDto> regulationDtos = course.getRegulations().stream()
                .map(this::mapToRegulationDto)
                .collect(Collectors.toList());

        return CourseDetailDto.builder()
                .course(mapToCourseDto(course))
                .regulations(regulationDtos)
                .build();
    }

    @Transactional
    public CourseDto createCourse(CreateCourseRequest request) {
        University university = universityRepository.findById(request.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University", "id", request.getUniversityId()));

        if (courseRepository.existsByUniversityIdAndShortName(university.getId(), request.getShortName().trim())) {
            throw new InvalidRequestException(String.format("Course with short name '%s' already exists for university '%s'",
                    request.getShortName(), university.getShortName()));
        }

        if (request.getTotalSemesters() != request.getDurationYears() * 2) {
            throw new InvalidRequestException(String.format("Total semesters (%d) must equal duration years (%d) * 2",
                    request.getTotalSemesters(), request.getDurationYears()));
        }

        Course course = Course.builder()
                .id(IdGenerator.generateCourseId())
                .university(university)
                .name(request.getName().trim())
                .shortName(request.getShortName().trim().toUpperCase())
                .level(request.getLevel())
                .durationYears(request.getDurationYears())
                .totalSemesters(request.getTotalSemesters())
                .totalDegreeCredits(request.getTotalDegreeCredits())
                .status(CourseStatus.ACTIVE)
                .build();

        Course saved = courseRepository.save(course);
        log.info("Created course: {} [{}]", saved.getName(), saved.getId());
        return mapToCourseDto(saved);
    }

    // --- Regulations ---

    public Page<RegulationDto> searchRegulations(String courseId, RegulationStatus status, String search, Pageable pageable) {
        return regulationRepository.searchRegulations(courseId, status, search, pageable)
                .map(this::mapToRegulationDto);
    }

    public List<RegulationDto> getRegulationsByCourse(String courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }
        return regulationRepository.findByCourseId(courseId).stream()
                .map(this::mapToRegulationDto)
                .collect(Collectors.toList());
    }

    public RegulationDetailDto getRegulationById(String id) {
        Regulation regulation = regulationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Regulation", "id", id));

        GradingScale scale = regulation.getGradingScale();
        CalculationRule rule = regulation.getCalculationRule();

        GradingScaleDto scaleDto = mapToGradingScaleDto(scale);
        CalculationRuleDto ruleDto = mapToCalculationRuleDto(rule);

        List<AdmissionBatchDto> batchDtos = regulation.getAdmissionBatches().stream()
                .map(b -> AdmissionBatchDto.builder()
                        .id(b.getId())
                        .batchName(b.getBatchName())
                        .build())
                .collect(Collectors.toList());

        List<RegulationSubject> subjects = regulationSubjectRepository.findAllByRegulationIdWithSubject(id);
        List<CurriculumSubjectDto> curriculumDtos = subjects.stream()
                .map(this::mapToCurriculumSubjectDto)
                .collect(Collectors.toList());

        return RegulationDetailDto.builder()
                .regulation(mapToRegulationDto(regulation))
                .gradingScale(scaleDto)
                .calculationRule(ruleDto)
                .admissionBatches(batchDtos)
                .curriculumSubjects(curriculumDtos)
                .build();
    }

    @Transactional
    public RegulationDto createRegulation(CreateRegulationRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        if (regulationRepository.existsByCourseIdAndCode(course.getId(), request.getCode().trim())) {
            throw new InvalidRequestException(String.format("Regulation with code '%s' already exists for course '%s'",
                    request.getCode(), course.getShortName()));
        }

        GradingScale gradingScale = gradingScaleRepository.findById(request.getGradingScaleId())
                .orElseThrow(() -> new ResourceNotFoundException("GradingScale", "id", request.getGradingScaleId()));

        CalculationRule calculationRule = calculationRuleRepository.findById(request.getCalculationRuleId())
                .orElseThrow(() -> new ResourceNotFoundException("CalculationRule", "id", request.getCalculationRuleId()));

        Regulation regulation = Regulation.builder()
                .id(IdGenerator.generateRegulationId())
                .course(course)
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .ruleVersion(request.getRuleVersion().trim())
                .verificationStatus(request.getVerificationStatus() != null ? request.getVerificationStatus() : RegulationVerificationStatus.VERIFIED)
                .gradingScale(gradingScale)
                .calculationRule(calculationRule)
                .status(RegulationStatus.ACTIVE)
                .build();

        if (request.getBatchYears() != null && !request.getBatchYears().isEmpty()) {
            for (String batchYear : request.getBatchYears()) {
                regulation.getAdmissionBatches().add(AdmissionBatch.builder()
                        .regulation(regulation)
                        .batchName(batchYear.trim())
                        .build());
            }
        }

        Regulation saved = regulationRepository.save(regulation);
        log.info("Created regulation: {} [{}]", saved.getName(), saved.getId());
        return mapToRegulationDto(saved);
    }

    public List<CurriculumSubjectDto> getRegulationCurriculum(String regulationId, Integer semesterNumber) {
        if (!regulationRepository.existsById(regulationId)) {
            throw new ResourceNotFoundException("Regulation", "id", regulationId);
        }

        List<RegulationSubject> subjects;
        if (semesterNumber != null) {
            subjects = regulationSubjectRepository.findByRegulationIdAndSemesterNumberWithSubject(regulationId, semesterNumber);
        } else {
            subjects = regulationSubjectRepository.findAllByRegulationIdWithSubject(regulationId);
        }

        return subjects.stream()
                .map(this::mapToCurriculumSubjectDto)
                .collect(Collectors.toList());
    }

    // --- Mapping Helpers ---

    private UniversityDto mapToUniversityDto(University u) {
        return UniversityDto.builder()
                .id(u.getId())
                .name(u.getName())
                .shortName(u.getShortName())
                .city(u.getCity())
                .state(u.getState())
                .type(u.getType())
                .website(u.getWebsite())
                .accreditation(u.getAccreditation())
                .establishedYear(u.getEstablishedYear())
                .status(u.getStatus())
                .coursesCount(u.getCourses() != null ? u.getCourses().size() : 0)
                .build();
    }

    private CourseDto mapToCourseDto(Course c) {
        return CourseDto.builder()
                .id(c.getId())
                .universityId(c.getUniversity() != null ? c.getUniversity().getId() : null)
                .universityName(c.getUniversity() != null ? c.getUniversity().getName() : null)
                .name(c.getName())
                .shortName(c.getShortName())
                .level(c.getLevel())
                .durationYears(c.getDurationYears())
                .totalSemesters(c.getTotalSemesters())
                .totalDegreeCredits(c.getTotalDegreeCredits())
                .status(c.getStatus())
                .regulationsCount(c.getRegulations() != null ? c.getRegulations().size() : 0)
                .build();
    }

    private RegulationDto mapToRegulationDto(Regulation r) {
        return RegulationDto.builder()
                .id(r.getId())
                .courseId(r.getCourse() != null ? r.getCourse().getId() : null)
                .courseName(r.getCourse() != null ? r.getCourse().getName() : null)
                .universityId(r.getCourse() != null && r.getCourse().getUniversity() != null ? r.getCourse().getUniversity().getId() : null)
                .universityName(r.getCourse() != null && r.getCourse().getUniversity() != null ? r.getCourse().getUniversity().getName() : null)
                .code(r.getCode())
                .name(r.getName())
                .ruleVersion(r.getRuleVersion())
                .verificationStatus(r.getVerificationStatus())
                .gradingScaleId(r.getGradingScale() != null ? r.getGradingScale().getId() : null)
                .gradingScaleName(r.getGradingScale() != null ? r.getGradingScale().getName() : null)
                .calculationRuleId(r.getCalculationRule() != null ? r.getCalculationRule().getId() : null)
                .calculationRuleName(r.getCalculationRule() != null ? r.getCalculationRule().getName() : null)
                .status(r.getStatus())
                .build();
    }

    private GradingScaleDto mapToGradingScaleDto(GradingScale scale) {
        if (scale == null) return null;
        List<GradeBoundaryDto> boundaryDtos = scale.getBoundaries().stream()
                .map(b -> GradeBoundaryDto.builder()
                        .id(b.getId())
                        .gradeLetter(b.getGradeLetter())
                        .gradePoints(b.getGradePoints())
                        .minPercentage(b.getMinPercentage())
                        .maxPercentage(b.getMaxPercentage())
                        .qualitativeDesc(b.getQualitativeDesc())
                        .isPass(b.isPass())
                        .build())
                .collect(Collectors.toList());

        return GradingScaleDto.builder()
                .id(scale.getId())
                .name(scale.getName())
                .scaleType(scale.getScaleType() != null ? scale.getScaleType().name() : null)
                .description(scale.getDescription())
                .boundaries(boundaryDtos)
                .build();
    }

    private CalculationRuleDto mapToCalculationRuleDto(CalculationRule rule) {
        if (rule == null) return null;
        return CalculationRuleDto.builder()
                .id(rule.getId())
                .name(rule.getName())
                .sgpaFormula(rule.getSgpaFormula())
                .cgpaFormula(rule.getCgpaFormula())
                .percentageFormulaExpression(rule.getPercentageFormulaExpression())
                .percentageFormulaDesc(rule.getPercentageFormulaDesc())
                .roundingMode(rule.getRoundingMode())
                .decimalPlaces(rule.getDecimalPlaces())
                .build();
    }

    private CurriculumSubjectDto mapToCurriculumSubjectDto(RegulationSubject rs) {
        Subject s = rs.getSubject();
        return CurriculumSubjectDto.builder()
                .id(rs.getId())
                .subjectId(s != null ? s.getId() : null)
                .subjectCode(s != null ? s.getCode() : null)
                .subjectName(s != null ? s.getName() : null)
                .semesterNumber(rs.getSemesterNumber())
                .credits(rs.getEffectiveCredits())
                .type(rs.getTypeOverride() != null ? rs.getTypeOverride() : (s != null ? s.getDefaultType() : null))
                .isElective(rs.isElective())
                .displayOrder(rs.getDisplayOrder())
                .build();
    }
}
