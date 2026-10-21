/**
 * ResultPoint University Details Configuration
 * 
 * Central data authority for University Details Pages.
 * Data-driven architecture supporting dynamic courses, regulations,
 * grading schemes, calculation methods, resources, and guidelines.
 */

export const UNIVERSITY_DETAILS_DATA = {
  'osmania-university': {
    id: 'osmania-university',
    slug: 'osmania-university',
    aliases: ['ou', 'osmania'],
    name: 'Osmania University',
    shortName: 'OU',
    fullName: 'Osmania University (OU)',
    badge: 'State University',
    verified: true,
    established: '1918',
    type: 'State University',
    location: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    officialWebsite: 'https://www.osmania.ac.in',
    websiteDisplay: 'www.osmania.ac.in',
    accreditation: 'NAAC: A+',
    academicCalendarUrl: 'https://www.osmania.ac.in',
    description:
      'Osmania University (OU) is one of the oldest and most prestigious state universities in India, offering undergraduate, postgraduate and research programs across various disciplines.',
    campusImages: [
      {
        url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
        caption: 'Main Campus',
        location: 'Hyderabad, Telangana'
      },
      {
        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
        caption: 'Arts College Heritage',
        location: 'Amberpet, Hyderabad'
      },
      {
        url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        caption: 'Science & Engineering Complex',
        location: 'OU Campus'
      }
    ],
    courseCategories: ['All', 'Undergraduate (UG)', 'Postgraduate (PG)', 'Diploma', 'Ph.D.'],
    courses: [
      {
        id: 'bca',
        name: 'BCA',
        fullName: 'Bachelor of Computer Applications',
        category: 'Undergraduate (UG)',
        degreeLevel: 'UG',
        durationYears: '3 Years',
        semesterCount: 6,
        iconColor: 'blue',
        regulations: [
          {
            id: 'bca-cbcs-22',
            code: 'CBCS-22',
            name: 'CBCS 2022 Scheme',
            applicableBatches: '2022 - 2025',
            status: 'active',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on subject credits and grade points.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all semesters.',
              percentageFormula: 'Percentage = CGPA × 10',
              percentageDesc: 'Applicable for MCA and BCA (OU). May vary for other courses.'
            }
          },
          {
            id: 'bca-cbcs-18',
            code: 'CBCS-18',
            name: 'CBCS 2018 Scheme',
            applicableBatches: '2018 - 2021',
            status: 'archived',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on subject credits and grade points.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all semesters.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Legacy Osmania CBCS conversion factor.'
            }
          }
        ]
      },
      {
        id: 'bsc',
        name: 'B.Sc',
        fullName: 'Bachelor of Science',
        category: 'Undergraduate (UG)',
        degreeLevel: 'UG',
        durationYears: '3 Years',
        semesterCount: 6,
        iconColor: 'cyan',
        regulations: [
          {
            id: 'bsc-cbcs',
            code: 'CBCS',
            name: 'CBCS Regulations',
            applicableBatches: '2021 - 2024',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official Osmania University standard undergraduate grading matrix.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 85', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '75 – 84', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '65 – 74', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '55 – 64', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 54', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Weighted semester evaluation for B.Sc degree curriculum.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative grade point score across all six terms.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Official Osmania University CBCS scale conversion multiplier.'
            }
          }
        ]
      },
      {
        id: 'bcom',
        name: 'B.Com',
        fullName: 'Bachelor of Commerce',
        category: 'Undergraduate (UG)',
        degreeLevel: 'UG',
        durationYears: '3 Years',
        semesterCount: 6,
        iconColor: 'blue',
        regulations: [
          {
            id: 'bcom-cbcs',
            code: 'CBCS',
            name: 'CBCS Regulations',
            applicableBatches: '2021 - 2024',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official Osmania University standard commerce curriculum grading.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 85', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '75 – 84', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '65 – 74', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '55 – 64', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 54', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Weighted semester evaluation for B.Com degree curriculum.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative grade point score across all six terms.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Official Osmania University CBCS scale conversion multiplier.'
            }
          }
        ]
      },
      {
        id: 'mca',
        name: 'MCA',
        fullName: 'Master of Computer Applications',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'orange',
        regulations: [
          {
            id: 'mca-r22',
            code: 'R22',
            name: 'R22 Regulation',
            applicableBatches: '2022 - 2024',
            status: 'active',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on subject credits and grade points.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all semesters.',
              percentageFormula: 'Percentage = CGPA × 10',
              percentageDesc: 'Applicable for MCA and BCA (OU). May vary for other courses.'
            }
          },
          {
            id: 'mca-r20',
            code: 'R20',
            name: 'R20 Regulation',
            applicableBatches: '2020 - 2022',
            status: 'active',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on subject credits and grade points.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all semesters.',
              percentageFormula: 'Percentage = CGPA × 10',
              percentageDesc: 'Applicable for MCA and BCA (OU). May vary for other courses.'
            }
          },
          {
            id: 'mca-r18',
            code: 'R18',
            name: 'R18 Regulation',
            applicableBatches: '2018 - 2020',
            status: 'active',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on subject credits and grade points.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all semesters.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Legacy Osmania University CBCS calculation.'
            }
          },
          {
            id: 'mca-r16',
            code: 'R16',
            name: 'R16 Regulation',
            applicableBatches: '2016 - 2018',
            status: 'archived',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Historical semester grade formulation.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Historical cumulative grade formulation.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Legacy Osmania University CBCS calculation.'
            }
          },
          {
            id: 'mca-r14',
            code: 'R14',
            name: 'R14 Regulation',
            applicableBatches: '2014 - 2016',
            status: 'archived',
            isSpecialOUGradeRule: true,
            gradingSchemeNote: "OU uses 'S' (Super) instead of 'O' for the top grade in MCA and BCA.",
            grades: [
              { grade: 'S', point: 10, performance: 'Super', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Average', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'D', point: 4, performance: 'Pass', range: '35 – 39', badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 35', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Archived semester calculation standards.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Archived cumulative calculation standards.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Archived Osmania percentage scaling.'
            }
          }
        ]
      },
      {
        id: 'msc',
        name: 'M.Sc',
        fullName: 'Master of Science',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'emerald',
        regulations: [
          {
            id: 'msc-cbcs',
            code: 'CBCS',
            name: 'CBCS Regulations',
            applicableBatches: '2021 - 2023',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Postgraduate sciences standard evaluation under Osmania University.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 85', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '75 – 84', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '65 – 74', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '55 – 64', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 54', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'M.Sc semester grade evaluation.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'M.Sc cumulative degree evaluation.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Osmania CBCS conversion factor.'
            }
          }
        ]
      },
      {
        id: 'ma',
        name: 'M.A',
        fullName: 'Master of Arts',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'purple',
        regulations: [
          {
            id: 'ma-cbcs',
            code: 'CBCS',
            name: 'CBCS Regulations',
            applicableBatches: '2021 - 2023',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Postgraduate humanities standard evaluation under Osmania University.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 85', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '75 – 84', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '65 – 74', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '55 – 64', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 54', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'M.A semester grade evaluation.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'M.A cumulative degree evaluation.',
              percentageFormula: 'Percentage = CGPA × 9.32',
              percentageDesc: 'Osmania CBCS conversion factor.'
            }
          }
        ]
      }
    ],
    guidelines: [
      {
        title: 'SGPA & CGPA Calculation Methodology',
        description:
          'Osmania University calculates Semester Grade Point Average (SGPA) as the credit-weighted sum of earned grade points divided by total registered credits in that term. CGPA represents the cumulative aggregate over all completed semesters.'
      },
      {
        title: 'Special S-Grade Allocation Policy',
        description:
          'Under official Osmania University academic ordinances for technical computer applications courses (BCA and MCA), the highest grade awarded is designated as "S" (Super) equivalent to 10.0 grade points for marks 90% and above, rather than the conventional "O" grade.'
      },
      {
        title: 'Credit Weighting & Degree Award',
        description:
          'To qualify for graduation, students must register for and secure passing grades (grade points 4.0 or above) across all core theory subjects, practical laboratories, and major project viva-voce examinations.'
      },
      {
        title: 'Backlog & Improvement Examinations',
        description:
          'Students with uncleared subjects (grade F) may re-appear during supplementary or regular semester examinations as scheduled by the Osmania University Examination Branch.'
      }
    ],
    faqs: [
      {
        id: 1,
        q: '1. What makes Osmania University MCA and BCA grading unique?',
        a: 'For technical programs like MCA and BCA, Osmania University awards an "S" (Super) grade for marks 90% and above, representing 10 grade points, followed by A+ (9), A (8), B+ (7), B (6), C (5), D (4), and F (0).'
      },
      {
        id: 2,
        q: '2. How does ResultPoint calculate Percentage from CGPA for OU?',
        a: 'For Osmania University MCA and BCA programs, the official conversion formula is Percentage = CGPA × 10. For standard 3-year degree courses under general CBCS, the standard conversion factor is Percentage = CGPA × 9.32.'
      },
      {
        id: 3,
        q: '3. Can I calculate results for specific semesters?',
        a: 'Yes, our SGPA Calculator allows you to select Osmania University, your course, and semester to automatically load the syllabus credits and calculate semester performance.'
      },
      {
        id: 4,
        q: '4. Where can I find official OU exam schedules and circulars?',
        a: 'Official notifications, schedules, and fee deadlines are published on the Osmania University Examination Branch portal at osmania.ac.in.'
      }
    ],
    relatedResources: [
      { name: 'Examination Portal', url: 'https://www.osmania.ac.in', linkText: 'www.osmania.ac.in/exams' },
      { name: 'Results Portal', url: 'https://www.osmania.ac.in', linkText: 'www.osmania.ac.in/results' },
      { name: 'Official Notifications', url: 'https://www.osmania.ac.in', linkText: 'www.osmania.ac.in/notifications' },
      { name: 'Syllabi & Regulations', url: 'https://www.osmania.ac.in', linkText: 'www.osmania.ac.in/syllabi' }
    ],
    relatedUniversities: [
      { name: 'JNTU Hyderabad', state: 'Telangana', short: 'JNTUH', route: '/universities/jntuh', color: 'bg-orange-500/10 text-accent' },
      { name: 'JNTU Kakinada', state: 'Andhra Pradesh', short: 'JNTUK', route: '/universities', color: 'bg-blue-500/10 text-brandBlue' },
      { name: 'Kakatiya University', state: 'Telangana', short: 'KU', route: '/universities', color: 'bg-emerald-500/10 text-brandGreen' },
      { name: 'Mahatma Gandhi University', state: 'Telangana', short: 'MGU', route: '/universities', color: 'bg-purple-500/10 text-brandPurple' }
    ]
  },

  'jntuh': {
    id: 'jntuh',
    slug: 'jntuh',
    aliases: ['jntu-hyderabad', 'jntu'],
    name: 'JNTU Hyderabad',
    shortName: 'JNTUH',
    fullName: 'Jawaharlal Nehru Technological University Hyderabad (JNTUH)',
    badge: 'State Technological University',
    verified: true,
    established: '2008 (Act) / 1972',
    type: 'State Technical University',
    location: 'Kukatpally, Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    officialWebsite: 'https://jntuh.ac.in',
    websiteDisplay: 'www.jntuh.ac.in',
    accreditation: 'NAAC: A+',
    academicCalendarUrl: 'https://jntuh.ac.in/academics',
    description:
      'Jawaharlal Nehru Technological University Hyderabad (JNTUH) is a premier state technological university in Telangana, India. It offers comprehensive undergraduate, postgraduate, and doctoral degrees in engineering, technology, pharmacy, and management sciences across Telangana.',
    campusImages: [
      {
        url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        caption: 'Main Campus',
        location: 'Kukatpally, Hyderabad'
      },
      {
        url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
        caption: 'Academic & Research Complex',
        location: 'JNTUH Hyderabad'
      }
    ],
    courseCategories: ['All', 'Undergraduate (UG)', 'Postgraduate (PG)'],
    courses: [
      {
        id: 'btech-cse',
        name: 'B.Tech (CSE)',
        fullName: 'B.Tech - Computer Science & Engineering',
        category: 'Undergraduate (UG)',
        degreeLevel: 'UG',
        durationYears: '4 Years',
        semesterCount: 8,
        iconColor: 'orange',
        regulations: [
          {
            id: 'jntuh-r22',
            code: 'R22',
            name: 'Regulation R22 (Revised CBCS)',
            applicableBatches: '2022 - 2026',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH R22 academic regulation grading cutoffs.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on registered course credits.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all successfully completed semesters.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Official JNTUH percentage formula for R22 and R18 regulations.'
            }
          },
          {
            id: 'jntuh-r18',
            code: 'R18',
            name: 'Regulation R18 (CBCS)',
            applicableBatches: '2018 - 2022',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH R18 academic regulation grading cutoffs.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Above Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on registered course credits.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all successfully completed semesters.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Official JNTUH percentage formula for R22 and R18 regulations.'
            }
          },
          {
            id: 'jntuh-r16',
            code: 'R16',
            name: 'Regulation R16',
            applicableBatches: '2016 - 2020',
            status: 'archived',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Archived JNTUH R16 academic regulation.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'B', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'C', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'D', point: 6, performance: 'Fair', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'P', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'R16 weighted semester calculation formula.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'R16 cumulative graduation score.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Standard JNTUH percentage formula.'
            }
          },
          {
            id: 'jntuh-r15',
            code: 'R15',
            name: 'Regulation R15',
            applicableBatches: '2015 - 2019',
            status: 'archived',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Archived legacy regulation.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'B', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'C', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'D', point: 6, performance: 'Fair', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'P', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'R15 semester grade calculation.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'R15 cumulative calculation.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Legacy JNTUH percentage formula.'
            }
          },
          {
            id: 'jntuh-r13',
            code: 'R13',
            name: 'Regulation R13',
            applicableBatches: '2013 - 2017',
            status: 'archived',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Archived marks-based classification scheme.',
            grades: [
              { grade: 'Distinction', point: 10, performance: 'First Class With Distinction', range: '≥ 70', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'First Class', point: 8, performance: 'First Division', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'Second Class', point: 6, performance: 'Second Division', range: '50 – 59', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'Pass Class', point: 5, performance: 'Passed', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'Fail', point: 0, performance: 'Failed', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'Percentage-based aggregation',
              sgpaDesc: 'Marks percentage aggregate across academic terms.',
              cgpaFormula: 'Aggregate Percentage = Total Marks Secured / Maximum Marks × 100',
              cgpaDesc: 'Absolute aggregate percentage classification.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Direct aggregate scale.'
            }
          }
        ]
      },
      {
        id: 'btech-ece',
        name: 'B.Tech (ECE)',
        fullName: 'B.Tech - Electronics & Communication Engineering',
        category: 'Undergraduate (UG)',
        degreeLevel: 'UG',
        durationYears: '4 Years',
        semesterCount: 8,
        iconColor: 'cyan',
        regulations: [
          {
            id: 'ece-r22',
            code: 'R22',
            name: 'Regulation R22 (Revised CBCS)',
            applicableBatches: '2022 - 2026',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH R22 regulation for ECE.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'Semester Grade Point Average based on registered course credits.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative Grade Point Average of all successfully completed semesters.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'Official JNTUH percentage formula for R22 regulations.'
            }
          }
        ]
      },
      {
        id: 'mtech',
        name: 'M.Tech',
        fullName: 'Master of Technology',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'emerald',
        regulations: [
          {
            id: 'mtech-r22',
            code: 'R22',
            name: 'Regulation R22',
            applicableBatches: '2022 - 2024',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH PG engineering evaluation.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'M.Tech term performance weighted formula.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative M.Tech degree rating.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'JNTUH standard scaling.'
            }
          }
        ]
      },
      {
        id: 'mba',
        name: 'MBA',
        fullName: 'Master of Business Administration',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'purple',
        regulations: [
          {
            id: 'mba-r22',
            code: 'R22',
            name: 'Regulation R22',
            applicableBatches: '2022 - 2024',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH MBA evaluation norms.',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'MBA term score calculation.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'MBA cumulative graduation score.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'JNTUH standard scaling.'
            }
          }
        ]
      },
      {
        id: 'mca',
        name: 'MCA',
        fullName: 'Master of Computer Applications',
        category: 'Postgraduate (PG)',
        degreeLevel: 'PG',
        durationYears: '2 Years',
        semesterCount: 4,
        iconColor: 'blue',
        regulations: [
          {
            id: 'jntuh-mca-r22',
            code: 'R22',
            name: 'Regulation R22',
            applicableBatches: '2022 - 2024',
            status: 'active',
            isSpecialOUGradeRule: false,
            gradingSchemeNote: 'Official JNTUH MCA regulation standards (uses standard O-grade).',
            grades: [
              { grade: 'O', point: 10, performance: 'Outstanding', range: '≥ 90', badgeColor: 'bg-amber-500/20 text-brandAmber border border-amber-500/40' },
              { grade: 'A+', point: 9, performance: 'Excellent', range: '80 – 89', badgeColor: 'bg-emerald-500/20 text-brandGreen border border-emerald-500/40' },
              { grade: 'A', point: 8, performance: 'Very Good', range: '70 – 79', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
              { grade: 'B+', point: 7, performance: 'Good', range: '60 – 69', badgeColor: 'bg-blue-500/20 text-brandBlue border border-blue-500/40' },
              { grade: 'B', point: 6, performance: 'Average', range: '50 – 59', badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' },
              { grade: 'C', point: 5, performance: 'Pass', range: '40 – 49', badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
              { grade: 'F', point: 0, performance: 'Fail', range: '< 40', badgeColor: 'bg-pink-500/20 text-brandPink border border-pink-500/40' }
            ],
            calculationRule: {
              sgpaFormula: 'SGPA = Σ (Credit × Grade Point) / Σ Credits',
              sgpaDesc: 'MCA semester evaluation formula.',
              cgpaFormula: 'CGPA = Σ (Total Credit Points) / Σ (Total Credits)',
              cgpaDesc: 'Cumulative MCA score.',
              percentageFormula: 'Percentage = (CGPA - 0.5) × 10',
              percentageDesc: 'JNTUH official percentage conversion.'
            }
          }
        ]
      }
    ],
    guidelines: [
      {
        title: 'Credit Weighting & Degree Award',
        description:
          'Under JNTU Hyderabad regulations, B.Tech students must complete 160 total credits (under R18/R22) with a minimum CGPA of 5.0 to be awarded the degree in First/Second Class.'
      },
      {
        title: 'Promotion & Detention Rules',
        description:
          'JNTUH enforces strict minimum credit requirements for semester promotion: students must secure at least 50% of the total credits up to the second year to be promoted to third year, and 60% of total credits to be promoted to fourth year.'
      },
      {
        title: 'Percentage Conversion Formula',
        description:
          'The official formula prescribed by JNTUH for conversion of CGPA to percentage is: Equivalent Percentage = (CGPA - 0.5) × 10.'
      },
      {
        title: 'Backlog Clearance & Grace Marks',
        description:
          'Failed subjects (grade F) carry 0 grade points. Students can clear backlogs in regular or supplementary examinations. Subject-wise exemption and grace marks are subject to JNTUH academic council circulars for each regulation.'
      }
    ],
    faqs: [
      {
        id: 1,
        q: '1. Which JNTU regulations are supported on ResultPoint?',
        a: 'ResultPoint supports all major JNTU Hyderabad regulations including R22, R18, R16, R15, and R13 for B.Tech, M.Tech, MBA, and MCA degrees, with verified credit allocations.'
      },
      {
        id: 2,
        q: '2. How does ResultPoint convert JNTUH CGPA to percentage?',
        a: 'Under JNTUH official regulations, equivalent percentage is calculated using the official formula: Percentage = (CGPA - 0.5) × 10.'
      },
      {
        id: 3,
        q: '3. Can I plan and calculate backlog clearance for JNTU?',
        a: 'Yes! Our specialized Backlog Calculator allows you to add uncleared subjects, compute backlog credits, and model required CGPA recovery targets for upcoming semesters.'
      },
      {
        id: 4,
        q: '4. Where can I find official JNTUH exam results and timetables?',
        a: 'Official notifications, schedules, and results are published on the official portals: results.jntuh.ac.in and exams.jntuh.ac.in.'
      }
    ],
    relatedResources: [
      { name: 'Official Website', url: 'https://jntuh.ac.in', linkText: 'www.jntuh.ac.in' },
      { name: 'Examination Portal', url: 'https://exams.jntuh.ac.in', linkText: 'exams.jntuh.ac.in' },
      { name: 'Results Portal', url: 'https://results.jntuh.ac.in', linkText: 'results.jntuh.ac.in' },
      { name: 'Academic Regulations', url: 'https://jntuh.ac.in/academics', linkText: 'jntuh.ac.in/regulations' }
    ],
    relatedUniversities: [
      { name: 'Osmania University', state: 'Telangana', short: 'OU', route: '/universities/osmania-university', color: 'bg-emerald-500/10 text-brandGreen' },
      { name: 'JNTU Kakinada', state: 'Andhra Pradesh', short: 'JNTUK', route: '/universities', color: 'bg-blue-500/10 text-brandBlue' },
      { name: 'Andhra University', state: 'Andhra Pradesh', short: 'AU', route: '/universities', color: 'bg-purple-500/10 text-brandPurple' }
    ]
  }
};

/**
 * Resolves university details by id or alias slug.
 * @param {string} idOrSlug - e.g. 'osmania-university', 'ou', 'jntuh'
 * @returns {object|null}
 */
export function getUniversityDetails(idOrSlug) {
  if (!idOrSlug) return null;
  const normalized = String(idOrSlug).trim().toLowerCase();

  for (const key of Object.keys(UNIVERSITY_DETAILS_DATA)) {
    const uni = UNIVERSITY_DETAILS_DATA[key];
    if (
      uni.id.toLowerCase() === normalized ||
      uni.slug.toLowerCase() === normalized ||
      uni.shortName.toLowerCase() === normalized ||
      (Array.isArray(uni.aliases) && uni.aliases.some((a) => a.toLowerCase() === normalized))
    ) {
      return uni;
    }
  }

  return null;
}
