package com.acadlytic.modules.colleges.repository;

import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class CollegeSpecifications {

    private CollegeSpecifications() {}

    public static String escapeLikePattern(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    public static Specification<College> withFilters(
            String search,
            CollegeStatus status,
            CollegeApprovalStatus approvalStatus,
            String affiliatedUniversity,
            String city,
            String state
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLikePattern(search.trim()).toLowerCase(Locale.ROOT) + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern, '\\');
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), pattern, '\\');
                Predicate emailMatch = cb.like(cb.lower(root.get("contactEmail")), pattern, '\\');
                Predicate univMatch = cb.like(cb.lower(root.get("affiliatedUniversityName")), pattern, '\\');
                predicates.add(cb.or(nameMatch, codeMatch, emailMatch, univMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (approvalStatus != null) {
                predicates.add(cb.equal(root.get("approvalStatus"), approvalStatus));
            }

            if (affiliatedUniversity != null && !affiliatedUniversity.isBlank()) {
                String univPattern = "%" + escapeLikePattern(affiliatedUniversity.trim()).toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.get("affiliatedUniversityName")), univPattern, '\\'));
            }

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase(Locale.ROOT)));
            }

            if (state != null && !state.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("state")), state.trim().toLowerCase(Locale.ROOT)));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
