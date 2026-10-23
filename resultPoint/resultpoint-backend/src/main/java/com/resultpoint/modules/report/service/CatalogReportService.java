package com.resultpoint.modules.report.service;

import com.resultpoint.modules.catalog.entity.Course;
import com.resultpoint.modules.catalog.entity.Regulation;
import com.resultpoint.modules.catalog.entity.University;
import com.resultpoint.modules.catalog.repository.CourseRepository;
import com.resultpoint.modules.catalog.repository.RegulationRepository;
import com.resultpoint.modules.catalog.repository.SubjectRepository;
import com.resultpoint.modules.catalog.repository.UniversityRepository;
import com.resultpoint.modules.report.dto.CatalogSummaryReportDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogReportService {

    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final RegulationRepository regulationRepository;
    private final SubjectRepository subjectRepository;

    public CatalogSummaryReportDto getCatalogSummary() {
        long totalUniversities = universityRepository.count();
        long totalCourses = courseRepository.count();
        long totalRegulations = regulationRepository.count();
        long totalSubjects = subjectRepository.count();

        List<University> universities = universityRepository.findAll();
        List<Course> courses = courseRepository.findAll();
        List<Regulation> regulations = regulationRepository.findAll();

        List<CatalogSummaryReportDto.UniversityBreakdown> uniBreakdowns = new ArrayList<>();
        for (University u : universities) {
            long courseCount = courses.stream()
                    .filter(c -> c.getUniversity() != null && u.getId().equals(c.getUniversity().getId()))
                    .count();
            uniBreakdowns.add(new CatalogSummaryReportDto.UniversityBreakdown(
                    u.getId(),
                    u.getShortName(),
                    u.getName(),
                    courseCount
            ));
        }

        List<CatalogSummaryReportDto.RegulationBreakdown> regBreakdowns = new ArrayList<>();
        for (Regulation r : regulations) {
            String uniName = (r.getCourse() != null && r.getCourse().getUniversity() != null)
                    ? r.getCourse().getUniversity().getName()
                    : "N/A";

            boolean isSpecialSuperGrade = r.getGradingScale() != null &&
                    r.getGradingScale().getBoundaries().stream()
                            .anyMatch(b -> "S".equalsIgnoreCase(b.getGradeLetter()));

            regBreakdowns.add(new CatalogSummaryReportDto.RegulationBreakdown(
                    r.getId(),
                    r.getCode(),
                    r.getName(),
                    uniName,
                    r.getVerificationStatus() != null ? r.getVerificationStatus().name() : "UNVERIFIED",
                    isSpecialSuperGrade
            ));
        }

        return new CatalogSummaryReportDto(
                totalUniversities,
                totalCourses,
                totalRegulations,
                totalSubjects,
                uniBreakdowns,
                regBreakdowns
        );
    }
}
