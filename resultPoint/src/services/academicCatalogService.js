/**
 * ResultPoint Academic Catalog Service
 * Central authority for Universities, Courses, Regulations, Grading Scales, and Semester Structures.
 * Structured for future Spring Boot REST API and MySQL persistence.
 */

import { STORAGE_KEYS } from './storageKeys.js';

// Verified Multi-University Catalog Data
const DEFAULT_CATALOG = {
  universities: [
    {
      id: 'jntuh',
      name: 'Jawaharlal Nehru Technological University Hyderabad',
      shortName: 'JNTUH',
      city: 'Hyderabad',
      state: 'Telangana',
      type: 'State Technical University',
      status: 'active',
      courses: [
        {
          id: 'btech-cse',
          name: 'B.Tech - Computer Science & Engineering',
          shortName: 'CSE',
          level: 'UG',
          durationYears: 4,
          totalSemesters: 8,
          totalDegreeCredits: 160,
          regulations: [
            {
              id: 'jntuh-cse-r18',
              code: 'R18',
              name: 'Regulation R18 (CBCS)',
              ruleVersion: 'JNTUH_R18_V1',
              effectiveBatches: ['2018-2022', '2019-2023', '2020-2024', '2021-2025'],
              gradingSystem: '10-point',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Above Average', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: '(CGPA - 0.5) * 10',
                formulaDescription: 'Percentage = (CGPA - 0.5) × 10'
              },
              semesters: {
                1: [
                  { code: 'MA101BS', name: 'Mathematics - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'AP102BS', name: 'Applied Physics', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS103ES', name: 'Programming for Problem Solving', defaultCredits: 4, type: 'Theory' },
                  { code: 'EN104HS', name: 'English', defaultCredits: 2, type: 'Theory' },
                  { code: 'CS105ES', name: 'Programming Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'AP106BS', name: 'Applied Physics Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                2: [
                  { code: 'MA201BS', name: 'Mathematics - II', defaultCredits: 4, type: 'Theory' },
                  { code: 'CH202BS', name: 'Engineering Chemistry', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS203ES', name: 'Data Structures', defaultCredits: 4, type: 'Theory' },
                  { code: 'ME204ES', name: 'Engineering Workshop', defaultCredits: 2.5, type: 'Practical' },
                  { code: 'CS205ES', name: 'Data Structures Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'CH206BS', name: 'Engineering Chemistry Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                3: [
                  { code: 'CS301PC', name: 'Analog and Digital Electronics', defaultCredits: 3, type: 'Theory' },
                  { code: 'CS302PC', name: 'Data Structures & Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS303PC', name: 'Computer Organization & Architecture', defaultCredits: 3, type: 'Theory' },
                  { code: 'CS304PC', name: 'Object Oriented Programming using C++', defaultCredits: 3, type: 'Theory' },
                  { code: 'CS305PC', name: 'Discrete Mathematics', defaultCredits: 3, type: 'Theory' },
                  { code: 'CS306PC', name: 'OOP & DSA Lab', defaultCredits: 2, type: 'Practical' }
                ],
                4: [
                  { code: 'CS401PC', name: 'Machine Learning & AI', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS402PC', name: 'Information Security', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS403PC', name: 'Big Data Analytics', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS404PC', name: 'Mobile Application Development', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS405PC', name: 'Distributed Systems', defaultCredits: 3, type: 'Theory' },
                  { code: 'CS406PC', name: 'AI & Security Lab', defaultCredits: 3, type: 'Practical' }
                ]
              }
            },
            {
              id: 'jntuh-cse-r22',
              code: 'R22',
              name: 'Regulation R22 (Revised CBCS)',
              ruleVersion: 'JNTUH_R22_V1',
              effectiveBatches: ['2022-2026', '2023-2027', '2024-2028', '2025-2029', '2026-2030'],
              gradingSystem: '10-point',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 90, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 80, maxPercentage: 89.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 70, maxPercentage: 79.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 60, maxPercentage: 69.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 59.99, desc: 'Average', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: '(CGPA - 0.5) * 10',
                formulaDescription: 'Percentage = (CGPA - 0.5) × 10'
              },
              semesters: {
                1: [
                  { code: 'MA101BS', name: 'Matrices and Calculus', defaultCredits: 4, type: 'Theory' },
                  { code: 'AP102BS', name: 'Engineering Physics', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS103ES', name: 'Programming for Problem Solving', defaultCredits: 4, type: 'Theory' },
                  { code: 'EE104ES', name: 'Basic Electrical Engineering', defaultCredits: 2, type: 'Theory' },
                  { code: 'CS105ES', name: 'Programming Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                2: [
                  { code: 'MA201BS', name: 'Ordinary Differential Equations', defaultCredits: 4, type: 'Theory' },
                  { code: 'CH202BS', name: 'Engineering Chemistry', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS203ES', name: 'Data Structures & Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'CS204ES', name: 'Computer Aided Drafting', defaultCredits: 2.5, type: 'Practical' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'osmania',
      name: 'Osmania University',
      shortName: 'OU',
      city: 'Hyderabad',
      state: 'Telangana',
      type: 'State Public University',
      status: 'active',
      courses: [
        // ================= UG COURSES (5) ================= //
        {
          id: 'bca',
          name: 'BCA — Bachelor of Computer Applications',
          shortName: 'BCA',
          level: 'UG',
          durationYears: 3,
          totalSemesters: 6,
          totalDegreeCredits: 150,
          regulations: [
            {
              id: 'ou-bca-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_BCA_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2028', '2026-2029'],
              gradingSystem: '10-point (S-Grade Scheme)',
              gradeScale: [
                { grade: 'S', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Super', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'BCA101', name: 'Mathematical Foundations of Computer Science', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA102', name: 'Programming in C', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA103', name: 'Discrete Mathematics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA104', name: 'Information Technology & PC Software', defaultCredits: 3, type: 'Theory' },
                  { code: 'BCA105', name: 'Communicative English', defaultCredits: 2, type: 'Theory' },
                  { code: 'BCA106', name: 'C Programming Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BCA107', name: 'IT Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                2: [
                  { code: 'BCA201', name: 'Data Structures using C++', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA202', name: 'Computer Organization & Architecture', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA203', name: 'Probability & Statistics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA204', name: 'Environmental Studies', defaultCredits: 2, type: 'Theory' },
                  { code: 'BCA205', name: 'Data Structures Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BCA206', name: 'C++ OOP Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                3: [
                  { code: 'BCA301', name: 'Java Programming', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA302', name: 'Database Management Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA303', name: 'Operating Systems Principles', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA304', name: 'Software Engineering', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA305', name: 'Java Programming Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BCA306', name: 'DBMS Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                4: [
                  { code: 'BCA401', name: 'Web Technologies', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA402', name: 'Computer Networks', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA403', name: 'Design and Analysis of Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA404', name: 'Python Programming', defaultCredits: 3, type: 'Theory' },
                  { code: 'BCA405', name: 'Web Technologies Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BCA406', name: 'Python Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                5: [
                  { code: 'BCA501', name: 'Cloud Computing & Services', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA502', name: 'Information Security', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA503', name: 'Mobile Application Development', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA504', name: 'Data Mining & Warehousing', defaultCredits: 3, type: 'Theory' },
                  { code: 'BCA505', name: 'Mobile App Lab', defaultCredits: 2, type: 'Practical' }
                ],
                6: [
                  { code: 'BCA601', name: 'Artificial Intelligence & Machine Learning', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA602', name: 'Internet of Things (IoT)', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA603', name: 'Major Project & Viva-Voce', defaultCredits: 8, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'bcom-gen',
          name: 'B.Com. General — Bachelor of Commerce',
          shortName: 'B.Com. Gen',
          level: 'UG',
          durationYears: 3,
          totalSemesters: 6,
          totalDegreeCredits: 150,
          regulations: [
            {
              id: 'ou-bcom-gen-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_BCOM_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2028', '2026-2029'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'BC101', name: 'Financial Accounting - I', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC102', name: 'Business Organization and Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC103', name: 'English - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'BC104', name: 'Second Language - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'BC105', name: 'Environmental Studies', defaultCredits: 2, type: 'Theory' }
                ],
                2: [
                  { code: 'BC201', name: 'Financial Accounting - II', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC202', name: 'Business Laws', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC203', name: 'Banking and Financial Systems', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC204', name: 'English - II', defaultCredits: 4, type: 'Theory' },
                  { code: 'BC205', name: 'Second Language - II', defaultCredits: 4, type: 'Theory' }
                ],
                3: [
                  { code: 'BC301', name: 'Advanced Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC302', name: 'Income Tax - I', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC303', name: 'Business Statistics - I', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC304', name: 'Entrepreneurial Development', defaultCredits: 4, type: 'Theory' }
                ],
                4: [
                  { code: 'BC401', name: 'Corporate Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC402', name: 'Income Tax - II', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC403', name: 'Business Statistics - II', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC404', name: 'Universal Human Values', defaultCredits: 2, type: 'Theory' }
                ],
                5: [
                  { code: 'BC501', name: 'Cost Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC502', name: 'Goods and Services Tax (GST)', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC503', name: 'Auditing Principles', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC504', name: 'Computerized Accounting', defaultCredits: 4, type: 'Practical' }
                ],
                6: [
                  { code: 'BC601', name: 'Management Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC602', name: 'Company Law', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC603', name: 'Financial Institutions & Markets', defaultCredits: 5, type: 'Theory' },
                  { code: 'BC604', name: 'Commerce Internship / Project Report', defaultCredits: 4, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'bcom-ca',
          name: 'B.Com. Computer Applications',
          shortName: 'B.Com. CA',
          level: 'UG',
          durationYears: 3,
          totalSemesters: 6,
          totalDegreeCredits: 150,
          regulations: [
            {
              id: 'ou-bcom-ca-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_BCOM_CA_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2028', '2026-2029'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'BCA101', name: 'Financial Accounting - I', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA102', name: 'Business Organization and Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA103', name: 'Information Technology Applications', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA104', name: 'IT Applications Practical Lab', defaultCredits: 2, type: 'Practical' },
                  { code: 'BCA105', name: 'English - I', defaultCredits: 4, type: 'Theory' }
                ],
                2: [
                  { code: 'BCA201', name: 'Financial Accounting - II', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA202', name: 'Business Laws', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA203', name: 'Relational Database Management Systems (RDBMS)', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA204', name: 'RDBMS Practical Lab', defaultCredits: 2, type: 'Practical' },
                  { code: 'BCA205', name: 'English - II', defaultCredits: 4, type: 'Theory' }
                ],
                3: [
                  { code: 'BCA301', name: 'Advanced Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA302', name: 'Income Tax', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA303', name: 'Business Statistics - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA304', name: 'Web Technologies for Commerce', defaultCredits: 4, type: 'Theory' }
                ],
                4: [
                  { code: 'BCA401', name: 'Corporate Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA402', name: 'Business Statistics - II', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA403', name: 'E-Commerce Applications', defaultCredits: 4, type: 'Theory' },
                  { code: 'BCA404', name: 'E-Commerce Practical Lab', defaultCredits: 2, type: 'Practical' }
                ],
                5: [
                  { code: 'BCA501', name: 'Cost Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA502', name: 'Computerized Accounting using Tally', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA503', name: 'Management Information Systems (MIS)', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA504', name: 'Tally Practical Lab', defaultCredits: 2, type: 'Practical' }
                ],
                6: [
                  { code: 'BCA601', name: 'Management Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA602', name: 'Cyber Security & Digital Law', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA603', name: 'ERP Systems in Business', defaultCredits: 5, type: 'Theory' },
                  { code: 'BCA604', name: 'Commerce & IT Project / Internship', defaultCredits: 4, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'bsc',
          name: 'B.Sc. — Bachelor of Science',
          shortName: 'B.Sc.',
          level: 'UG',
          durationYears: 3,
          totalSemesters: 6,
          totalDegreeCredits: 150,
          regulations: [
            {
              id: 'ou-bsc-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_BSC_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2028', '2026-2029'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'BS101', name: 'Differential and Integral Calculus', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS102', name: 'Mechanics and General Physics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS103', name: 'Programming in C', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS104', name: 'Physics Laboratory - I', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS105', name: 'C Programming Laboratory', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS106', name: 'English - I', defaultCredits: 4, type: 'Theory' }
                ],
                2: [
                  { code: 'BS201', name: 'Differential Equations', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS202', name: 'Thermal Physics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS203', name: 'Data Structures and Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS204', name: 'Physics Laboratory - II', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS205', name: 'Data Structures Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS206', name: 'English - II', defaultCredits: 4, type: 'Theory' }
                ],
                3: [
                  { code: 'BS301', name: 'Real Analysis', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS302', name: 'Electromagnetism', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS303', name: 'Database Management Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS304', name: 'Physics Lab - III', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS305', name: 'DBMS Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                4: [
                  { code: 'BS401', name: 'Algebra & Group Theory', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS402', name: 'Optics and Spectroscopy', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS403', name: 'Python Programming', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS404', name: 'Optics Lab', defaultCredits: 1.5, type: 'Practical' },
                  { code: 'BS405', name: 'Python Lab', defaultCredits: 1.5, type: 'Practical' }
                ],
                5: [
                  { code: 'BS501', name: 'Linear Algebra', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS502', name: 'Modern Physics & Quantum Mechanics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS503', name: 'Operating Systems Principles', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS504', name: 'Electronics and Modern Physics Lab', defaultCredits: 2, type: 'Practical' }
                ],
                6: [
                  { code: 'BS601', name: 'Numerical Analysis', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS602', name: 'Solid State Physics', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS603', name: 'Web Technologies and Services', defaultCredits: 4, type: 'Theory' },
                  { code: 'BS604', name: 'Science Project & Seminar', defaultCredits: 4, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'bba',
          name: 'BBA — Bachelor of Business Administration',
          shortName: 'BBA',
          level: 'UG',
          durationYears: 3,
          totalSemesters: 6,
          totalDegreeCredits: 150,
          regulations: [
            {
              id: 'ou-bba-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_BBA_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2028', '2026-2029'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'BBA101', name: 'Principles of Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA102', name: 'Basics of Marketing', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA103', name: 'Business Economics', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA104', name: 'English - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'BBA105', name: 'Environmental Studies', defaultCredits: 2, type: 'Theory' }
                ],
                2: [
                  { code: 'BBA201', name: 'Organizational Behavior', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA202', name: 'Business Statistics', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA203', name: 'Financial Accounting & Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA204', name: 'Human Resource Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA205', name: 'English - II', defaultCredits: 4, type: 'Theory' }
                ],
                3: [
                  { code: 'BBA301', name: 'Operations Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA302', name: 'Financial Markets & Services', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA303', name: 'Consumer Behavior', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA304', name: 'Business Research Methodology', defaultCredits: 4, type: 'Theory' }
                ],
                4: [
                  { code: 'BBA401', name: 'Strategic Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA402', name: 'Supply Chain & Logistics Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA403', name: 'Business Ethics & Corporate Governance', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA404', name: 'IT for Managers', defaultCredits: 4, type: 'Theory' }
                ],
                5: [
                  { code: 'BBA501', name: 'Entrepreneurship Development', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA502', name: 'International Business Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA503', name: 'Major Elective - I (Finance/Marketing/HR)', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA504', name: 'Major Elective - II', defaultCredits: 5, type: 'Theory' }
                ],
                6: [
                  { code: 'BBA601', name: 'Digital Marketing & Analytics', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA602', name: 'Major Elective - III', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA603', name: 'Major Elective - IV', defaultCredits: 5, type: 'Theory' },
                  { code: 'BBA604', name: 'Management Internship & Project Report', defaultCredits: 6, type: 'Project' }
                ]
              }
            }
          ]
        },

        // ================= PG COURSES (5) ================= //
        {
          id: 'mca',
          name: 'MCA — Master of Computer Applications',
          shortName: 'MCA',
          level: 'PG',
          durationYears: 2,
          totalSemesters: 4,
          totalDegreeCredits: 80,
          regulations: [
            {
              id: 'ou-mca-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS 2-Year)',
              ruleVersion: 'OU_MCA_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2023', '2022-2024', '2023-2025', '2024-2026', '2025-2027', '2026-2028'],
              gradingSystem: '10-point (S-Grade Scheme)',
              gradeScale: [
                { grade: 'S', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Super', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'MCA101', name: 'Discrete Mathematics', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA102', name: 'Probability & Statistics', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA103', name: 'Computer Architecture & OS', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA104', name: 'Data Structures & Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA105', name: 'Software Engineering', defaultCredits: 3, type: 'Theory' },
                  { code: 'MCA106', name: 'DSA Lab', defaultCredits: 2, type: 'Practical' }
                ],
                2: [
                  { code: 'MCA201', name: 'Database Management Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA202', name: 'Computer Networks', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA203', name: 'Object Oriented Programming Java', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA204', name: 'Web Fundamentals & Scripting', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA205', name: 'DBMS Lab', defaultCredits: 2, type: 'Practical' }
                ],
                3: [
                  { code: 'MCA301', name: 'Cloud Computing & DevOps', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA302', name: 'Machine Learning', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA303', name: 'Information Security', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA304', name: 'Full Stack Development', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA305', name: 'Project Work Phase I', defaultCredits: 4, type: 'Project' }
                ],
                4: [
                  { code: 'MCA401', name: 'Deep Learning & NLP', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA402', name: 'Distributed Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCA403', name: 'Major Project & Viva-Voce', defaultCredits: 12, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'mba',
          name: 'MBA — Master of Business Administration',
          shortName: 'MBA',
          level: 'PG',
          durationYears: 2,
          totalSemesters: 4,
          totalDegreeCredits: 104,
          regulations: [
            {
              id: 'ou-mba-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_MBA_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2023', '2022-2024', '2023-2025', '2024-2026', '2025-2027', '2026-2028'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'MBA101', name: 'Management and Organizational Behavior', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA102', name: 'Accounting for Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA103', name: 'Marketing Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA104', name: 'Statistics for Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA105', name: 'Economics for Managers', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA106', name: 'IT Applications for Management', defaultCredits: 4, type: 'Practical' }
                ],
                2: [
                  { code: 'MBA201', name: 'Human Resource Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA202', name: 'Financial Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA203', name: 'Operations Research', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA204', name: 'Business Research Methods', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA205', name: 'Operations Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA206', name: 'Business Analytics Lab', defaultCredits: 4, type: 'Practical' }
                ],
                3: [
                  { code: 'MBA301', name: 'Strategic Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA302', name: 'Supply Chain Management', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA303', name: 'Specialization Major Elective - I', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA304', name: 'Specialization Major Elective - II', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA305', name: 'Summer Internship Project & Seminar', defaultCredits: 6, type: 'Project' }
                ],
                4: [
                  { code: 'MBA401', name: 'Entrepreneurship Development', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA402', name: 'Business Law & Corporate Ethics', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA403', name: 'Specialization Major Elective - III', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA404', name: 'Specialization Major Elective - IV', defaultCredits: 4, type: 'Theory' },
                  { code: 'MBA405', name: 'Comprehensive Project & Viva-Voce', defaultCredits: 8, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'mcom',
          name: 'M.Com. — Master of Commerce',
          shortName: 'M.Com.',
          level: 'PG',
          durationYears: 2,
          totalSemesters: 4,
          totalDegreeCredits: 96,
          regulations: [
            {
              id: 'ou-mcom-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_MCOM_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2023', '2022-2024', '2023-2025', '2024-2026', '2025-2027', '2026-2028'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'COM101', name: 'Managerial Economics', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM102', name: 'Principles of Marketing', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM103', name: 'Financial Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM104', name: 'Organization Theory & Behavior', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM105', name: 'Accounting for Managers', defaultCredits: 4, type: 'Theory' }
                ],
                2: [
                  { code: 'COM201', name: 'Advanced Managerial Accounting', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM202', name: 'Business Environment & Policy', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM203', name: 'Marketing Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM204', name: 'Human Resource Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM205', name: 'Investment Management', defaultCredits: 4, type: 'Theory' }
                ],
                3: [
                  { code: 'COM301', name: 'Research Methodology & Statistical Analysis', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM302', name: 'Direct Taxes & Tax Planning', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM303', name: 'Cost Control & Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM304', name: 'Security Analysis & Portfolio Management', defaultCredits: 5, type: 'Theory' }
                ],
                4: [
                  { code: 'COM401', name: 'International Finance', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM402', name: 'Indirect Taxes (GST Law & Practice)', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM403', name: 'Strategic Financial Management', defaultCredits: 5, type: 'Theory' },
                  { code: 'COM404', name: 'Comprehensive Research Project & Viva-Voce', defaultCredits: 8, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'msc-cs',
          name: 'M.Sc. Computer Science',
          shortName: 'M.Sc. CS',
          level: 'PG',
          durationYears: 2,
          totalSemesters: 4,
          totalDegreeCredits: 96,
          regulations: [
            {
              id: 'ou-msccs-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_MSCCS_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2023', '2022-2024', '2023-2025', '2024-2026', '2025-2027', '2026-2028'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'MCS101', name: 'Advanced Data Structures and Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS102', name: 'Computer Architecture & Parallel Processing', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS103', name: 'Discrete Mathematical Structures', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS104', name: 'Software Engineering & Object Design', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS105', name: 'Advanced Data Structures Lab', defaultCredits: 2, type: 'Practical' }
                ],
                2: [
                  { code: 'MCS201', name: 'Design & Analysis of Algorithms', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS202', name: 'Advanced Database Management Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS203', name: 'Operating Systems & Distributed Computing', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS204', name: 'Web Technologies & Frameworks', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS205', name: 'Advanced DBMS Lab', defaultCredits: 2, type: 'Practical' }
                ],
                3: [
                  { code: 'MCS301', name: 'Machine Learning & Predictive Analysis', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS302', name: 'Information and Network Security', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS303', name: 'Cloud Computing Technologies', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS304', name: 'Data Science & Big Data Analytics', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS305', name: 'Machine Learning Lab', defaultCredits: 2, type: 'Practical' }
                ],
                4: [
                  { code: 'MCS401', name: 'Deep Learning & Neural Networks', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS402', name: 'Internet of Things (IoT) Systems', defaultCredits: 4, type: 'Theory' },
                  { code: 'MCS403', name: 'Major Research Project Work & Viva-Voce', defaultCredits: 12, type: 'Project' }
                ]
              }
            }
          ]
        },
        {
          id: 'ma-eng',
          name: 'M.A. English',
          shortName: 'M.A. Eng',
          level: 'PG',
          durationYears: 2,
          totalSemesters: 4,
          totalDegreeCredits: 96,
          regulations: [
            {
              id: 'ou-maeng-cbcs',
              code: 'CBCS',
              name: 'Choice Based Credit System (CBCS)',
              ruleVersion: 'OU_MAENG_CBCS_V1',
              verificationStatus: 'verified',
              effectiveBatches: ['2021-2023', '2022-2024', '2023-2025', '2024-2026', '2025-2027', '2026-2028'],
              gradingSystem: '10-point (O-Grade Scheme)',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
                { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'ENG101', name: 'English Poetry (14th to 17th Century)', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG102', name: 'English Drama (16th & 17th Century)', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG103', name: 'English Prose and Fiction', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG104', name: 'The Structure of Modern English', defaultCredits: 5, type: 'Theory' }
                ],
                2: [
                  { code: 'ENG201', name: '18th & 19th Century English Poetry', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG202', name: '18th & 19th Century Drama and Fiction', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG203', name: 'Literary Criticism: Classical to Modern', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG204', name: 'English Language Teaching (ELT) Principles', defaultCredits: 5, type: 'Theory' }
                ],
                3: [
                  { code: 'ENG301', name: '20th Century British Literature', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG302', name: 'American Literature: 19th and 20th Century', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG303', name: 'Indian Writing in English', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG304', name: 'Postcolonial Studies & World Literatures', defaultCredits: 5, type: 'Theory' }
                ],
                4: [
                  { code: 'ENG401', name: 'Contemporary Literary Theory & Cultural Studies', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG402', name: 'Women’s Writing in English', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG403', name: 'Linguistics & Stylistics in Literature', defaultCredits: 5, type: 'Theory' },
                  { code: 'ENG404', name: 'Master’s Dissertation & Viva-Voce', defaultCredits: 8, type: 'Project' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'anna-univ',
      name: 'Anna University',
      shortName: 'Anna Univ',
      city: 'Chennai',
      state: 'Tamil Nadu',
      type: 'State Technical University',
      status: 'active',
      courses: [
        {
          id: 'btech-it',
          name: 'B.Tech - Information Technology',
          shortName: 'IT',
          level: 'UG',
          durationYears: 4,
          totalSemesters: 8,
          totalDegreeCredits: 165,
          regulations: [
            {
              id: 'anna-it-r21',
              code: 'R2021',
              name: 'Regulation 2021',
              ruleVersion: 'ANNA_R21_V1',
              effectiveBatches: ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', '2026-2030'],
              gradingSystem: '10-point',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 91, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 81, maxPercentage: 90.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 71, maxPercentage: 80.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 61, maxPercentage: 70.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 60.99, desc: 'Average', isPass: true },
                { grade: 'RA', points: 0, minPercentage: 0, maxPercentage: 49.99, desc: 'Re-appear', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: 'CGPA * 10',
                formulaDescription: 'Percentage = CGPA × 10'
              },
              semesters: {
                1: [
                  { code: 'IP3151', name: 'Induction Programme', defaultCredits: 0, type: 'Theory' },
                  { code: 'HS3151', name: 'Professional English - I', defaultCredits: 3, type: 'Theory' },
                  { code: 'MA3151', name: 'Matrices and Calculus', defaultCredits: 4, type: 'Theory' },
                  { code: 'PH3151', name: 'Engineering Physics', defaultCredits: 3, type: 'Theory' },
                  { code: 'CY3151', name: 'Engineering Chemistry', defaultCredits: 3, type: 'Theory' },
                  { code: 'GE3151', name: 'Problem Solving and Python Programming', defaultCredits: 3, type: 'Theory' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'vtu',
      name: 'Visvesvaraya Technological University',
      shortName: 'VTU',
      city: 'Belagavi',
      state: 'Karnataka',
      type: 'State Technical University',
      status: 'active',
      courses: [
        {
          id: 'btech-cse',
          name: 'B.E. - Computer Science & Engineering',
          shortName: 'CSE',
          level: 'UG',
          durationYears: 4,
          totalSemesters: 8,
          totalDegreeCredits: 160,
          regulations: [
            {
              id: 'vtu-cse-2021',
              code: '2021 Scheme',
              name: 'CBCS 2021 Scheme',
              ruleVersion: 'VTU_2021_V1',
              effectiveBatches: ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', '2026-2030'],
              gradingSystem: '10-point',
              gradeScale: [
                { grade: 'O', points: 10, minPercentage: 90, maxPercentage: 100, desc: 'Outstanding', isPass: true },
                { grade: 'A+', points: 9, minPercentage: 80, maxPercentage: 89.99, desc: 'Excellent', isPass: true },
                { grade: 'A', points: 8, minPercentage: 70, maxPercentage: 79.99, desc: 'Very Good', isPass: true },
                { grade: 'B+', points: 7, minPercentage: 60, maxPercentage: 69.99, desc: 'Good', isPass: true },
                { grade: 'B', points: 6, minPercentage: 55, maxPercentage: 59.99, desc: 'Above Average', isPass: true },
                { grade: 'C', points: 5, minPercentage: 50, maxPercentage: 54.99, desc: 'Average', isPass: true },
                { grade: 'P', points: 4, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
                { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
              ],
              calculationRule: {
                sgpaFormula: 'WEIGHTED_CREDIT_SUM',
                cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
                percentageFormula: '(CGPA - 0.75) * 10',
                formulaDescription: 'Percentage = (CGPA - 0.75) × 10'
              },
              semesters: {
                1: [
                  { code: '21MAT11', name: 'Calculus and Differential Equations', defaultCredits: 3, type: 'Theory' },
                  { code: '21PHY12', name: 'Engineering Physics', defaultCredits: 3, type: 'Theory' },
                  { code: '21ELE13', name: 'Basic Electrical Engineering', defaultCredits: 3, type: 'Theory' },
                  { code: '21CIV14', name: 'Elements of Civil Engineering', defaultCredits: 3, type: 'Theory' },
                  { code: '21EVN15', name: 'Environmental Studies', defaultCredits: 1, type: 'Theory' }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
};

const STORAGE_KEY_CATALOG = 'rp_academic_catalog';
const CATALOG_SCHEMA_VERSION = 'v5_batches_2026_s_grade';

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse ${key}:`, err);
    return fallback;
  }
}

function safeSet(key, val) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to store ${key}:`, err);
  }
}

export const academicCatalogService = {
  initialize() {
    const existing = safeGet(STORAGE_KEY_CATALOG, null);
    const osmaniaUniv = existing?.universities?.find((u) => u.id === 'osmania');
    const needsMigration =
      !existing ||
      !existing.universities ||
      existing.catalogVersion !== CATALOG_SCHEMA_VERSION ||
      !osmaniaUniv ||
      (osmaniaUniv.courses?.length || 0) < 10;

    if (needsMigration) {
      safeSet(STORAGE_KEY_CATALOG, { ...DEFAULT_CATALOG, catalogVersion: CATALOG_SCHEMA_VERSION });
    }
  },

  getCatalog() {
    this.initialize();
    return safeGet(STORAGE_KEY_CATALOG, DEFAULT_CATALOG);
  },

  getUniversities() {
    const catalog = this.getCatalog();
    return catalog.universities.map((u) => ({
      id: u.id,
      name: u.name,
      shortName: u.shortName,
      city: u.city,
      state: u.state,
      type: u.type,
      courseCount: u.courses?.length || 0
    }));
  },

  getUniversityById(univId) {
    const catalog = this.getCatalog();
    return catalog.universities.find((u) => u.id === univId) || null;
  },

  getCoursesByUniversity(univId) {
    const univ = this.getUniversityById(univId);
    if (!univ || !univ.courses) return [];
    return univ.courses.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      level: c.level,
      durationYears: c.durationYears,
      totalSemesters: c.totalSemesters,
      totalDegreeCredits: c.totalDegreeCredits,
      regulationCount: c.regulations?.length || 0
    }));
  },

  getCourse(univId, courseId) {
    const univ = this.getUniversityById(univId);
    if (!univ || !univ.courses) return null;
    return univ.courses.find((c) => c.id === courseId) || null;
  },

  getRegulationsByCourse(univId, courseId) {
    const course = this.getCourse(univId, courseId);
    if (!course || !course.regulations) return [];
    return course.regulations.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      ruleVersion: r.ruleVersion,
      effectiveBatches: r.effectiveBatches || [],
      gradingSystem: r.gradingSystem,
      verificationStatus: r.verificationStatus || 'verified',
      formulaDescription: r.calculationRule?.formulaDescription || 'Standard weighted credit sum'
    }));
  },

  getRegulation(univId, courseId, regulationId) {
    const course = this.getCourse(univId, courseId);
    if (!course || !course.regulations) return null;
    return (
      course.regulations.find((r) => r.id === regulationId || r.code.toLowerCase() === String(regulationId).toLowerCase()) ||
      course.regulations[0] ||
      null
    );
  },

  getFullConfiguration(univId, courseId, regulationId) {
    const univ = this.getUniversityById(univId);
    if (!univ) return null;
    const course = this.getCourse(univId, courseId);
    if (!course) return null;
    const regulation = this.getRegulation(univId, courseId, regulationId);
    if (!regulation) return null;

    const isMcaOrBca = ['mca', 'bca'].includes(String(course.id).toLowerCase());

    const gradeScale = (regulation.gradeScale || []).map((g) => {
      if (isMcaOrBca && (g.grade === 'O' || g.desc?.toLowerCase().includes('outstanding'))) {
        return {
          ...g,
          grade: 'S',
          desc: 'Super'
        };
      }
      return g;
    });

    const gradingSystem = isMcaOrBca
      ? (regulation.gradingSystem || '10-point (S-Grade Scheme)').replace(/O-Grade/gi, 'S-Grade')
      : (regulation.gradingSystem || '10-point');

    return {
      university: {
        id: univ.id,
        name: univ.name,
        shortName: univ.shortName,
        state: univ.state
      },
      course: {
        id: course.id,
        name: course.name,
        shortName: course.shortName,
        level: course.level,
        durationYears: course.durationYears,
        totalSemesters: course.totalSemesters,
        totalDegreeCredits: course.totalDegreeCredits
      },
      regulation: {
        id: regulation.id,
        code: regulation.code,
        name: regulation.name,
        ruleVersion: regulation.ruleVersion,
        effectiveBatches: regulation.effectiveBatches,
        gradingSystem,
        verificationStatus: regulation.verificationStatus || 'verified'
      },
      gradeScale,
      calculationRule: regulation.calculationRule || {
        sgpaFormula: 'WEIGHTED_CREDIT_SUM',
        cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
        percentageFormula: 'CGPA * 10'
      },
      semesters: regulation.semesters || {}
    };
  },

  getSemesterSubjects(univId, courseId, regulationId, semesterNumber) {
    const config = this.getFullConfiguration(univId, courseId, regulationId);
    if (!config || !config.semesters) return [];
    const subjects = config.semesters[semesterNumber];
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      return subjects;
    }
    // Fallback: Generate compliant placeholder subjects for unconfigured upper semesters
    const sem = Number(semesterNumber) || 1;
    return [
      { code: `CS${sem}01`, name: `Core Advanced Course I`, defaultCredits: 4, type: 'Theory' },
      { code: `CS${sem}02`, name: `Core Advanced Course II`, defaultCredits: 4, type: 'Theory' },
      { code: `CS${sem}03`, name: `Professional Elective`, defaultCredits: 3, type: 'Theory' },
      { code: `CS${sem}04`, name: `Open Elective Course`, defaultCredits: 3, type: 'Theory' },
      { code: `CS${sem}05`, name: `Laboratory Course`, defaultCredits: 2, type: 'Practical' }
    ];
  },

  // ================= ADMIN MUTATION WORKFLOWS ================= //

  saveCatalog(catalog) {
    safeSet(STORAGE_KEY_CATALOG, catalog);
    return catalog;
  },

  addUniversity(univData) {
    const catalog = this.getCatalog();
    const newUniv = {
      id: univData.id || univData.shortName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: univData.name,
      shortName: univData.shortName,
      city: univData.city || 'Campus',
      state: univData.state || 'State',
      type: univData.type || 'Public University',
      status: 'active',
      courses: univData.courses || []
    };

    catalog.universities.push(newUniv);
    this.saveCatalog(catalog);
    return newUniv;
  },

  updateUniversity(univId, updates) {
    const catalog = this.getCatalog();
    const idx = catalog.universities.findIndex((u) => u.id === univId);
    if (idx !== -1) {
      catalog.universities[idx] = { ...catalog.universities[idx], ...updates };
      this.saveCatalog(catalog);
      return catalog.universities[idx];
    }
    return null;
  },

  addCourse(univId, courseData) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) return null;

    const newCourse = {
      id: courseData.id || courseData.shortName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: courseData.name,
      shortName: courseData.shortName,
      level: courseData.level || 'UG',
      durationYears: Number(courseData.durationYears) || 4,
      totalSemesters: Number(courseData.totalSemesters) || 8,
      totalDegreeCredits: Number(courseData.totalDegreeCredits) || 160,
      regulations: courseData.regulations || []
    };

    if (!univ.courses) univ.courses = [];
    univ.courses.push(newCourse);
    this.saveCatalog(catalog);
    return newCourse;
  },

  addRegulation(univId, courseId, regData) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) return null;
    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) return null;

    const newRegulation = {
      id: regData.id || `${univId}-${courseId}-${regData.code.toLowerCase()}`,
      code: regData.code,
      name: regData.name,
      ruleVersion: regData.ruleVersion || `${regData.code}_V1`,
      effectiveBatches: regData.effectiveBatches || ['2024-2028', '2025-2029'],
      gradingSystem: regData.gradingSystem || '10-point',
      gradeScale: regData.gradeScale || [
        { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
        { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
        { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
        { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
        { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Above Average', isPass: true },
        { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
      ],
      calculationRule: regData.calculationRule || {
        sgpaFormula: 'WEIGHTED_CREDIT_SUM',
        cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
        percentageFormula: '(CGPA - 0.5) * 10'
      },
      semesters: regData.semesters || {}
    };

    if (!course.regulations) course.regulations = [];
    course.regulations.push(newRegulation);
    this.saveCatalog(catalog);
    return newRegulation;
  },

  publishNewRegulationVersion(univId, courseId, regId, versionData) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) return null;
    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) return null;
    const existingReg = course.regulations?.find((r) => r.id === regId);
    if (!existingReg) return null;

    // Create a new versioned regulation without modifying previous historical rule version
    const newVersionedReg = {
      ...existingReg,
      ...versionData,
      id: `${regId}-v${Date.now()}`,
      ruleVersion: versionData.ruleVersion || `${existingReg.ruleVersion}_REVISED`,
      effectiveBatches: versionData.effectiveBatches || existingReg.effectiveBatches,
      publishedAt: new Date().toISOString()
    };

    course.regulations.push(newVersionedReg);
    this.saveCatalog(catalog);
    return newVersionedReg;
  },

  updateSemesterSubjects(univId, courseId, regId, semesterNumber, subjects) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) return false;
    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) return false;
    const reg = course.regulations?.find((r) => r.id === regId);
    if (!reg) return false;

    if (!reg.semesters) reg.semesters = {};
    reg.semesters[semesterNumber] = subjects;
    this.saveCatalog(catalog);
    return true;
  },

  resetToDefaults() {
    const fresh = { ...DEFAULT_CATALOG, catalogVersion: CATALOG_SCHEMA_VERSION };
    safeSet(STORAGE_KEY_CATALOG, fresh);
    return fresh;
  }
};

// Auto-initialize on import
academicCatalogService.initialize();
