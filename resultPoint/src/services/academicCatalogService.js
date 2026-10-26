/**
 * ResultPoint Academic Catalog Service
 * Central authority for Universities, Courses, Regulations, Grading Scales, and Semester Structures.
 * Structured for future Spring Boot REST API and MySQL persistence.
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { auditHistoryService } from './auditHistoryService.js';
import { resolveToLocalCatalogId } from './api/catalogApi.js';

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
              effectiveBatches: ['2021-2024', '2022-2025', '2023-2026', '2024-2027', '2025-2027', '2025-2028', '2026-2029'],
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
  ],
  gradingScales: [
    {
      id: 'ugc-10-point',
      name: 'UGC Standard 10-Point Letter Grade Scheme',
      system: '10-point',
      description: 'Standard UGC CBCS 10-point letter grading system adopted by JNTUH, Osmania B.Tech, and technical universities.',
      status: 'active',
      isOfficial: true,
      grades: [
        { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
        { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
        { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
        { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
        { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Above Average', isPass: true },
        { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
      ]
    },
    {
      id: 'ou-s-grade-10-point',
      name: 'Osmania PG / MCA S-Grade 10-Point Scheme',
      system: '10-point',
      description: 'Official Osmania University PG/MCA Choice Based Credit System scale featuring the S (Super) grade.',
      status: 'active',
      isOfficial: true,
      grades: [
        { grade: 'S', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Super', isPass: true },
        { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
        { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
        { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
        { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Fair', isPass: true },
        { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
      ]
    },
    {
      id: 'vtu-cbcs-10-point',
      name: 'VTU CBCS 10-Point Scheme',
      system: '10-point',
      description: 'Visvesvaraya Technological University CBCS grading scheme including P (Pass) grade threshold.',
      status: 'active',
      isOfficial: true,
      grades: [
        { grade: 'O', points: 10, minPercentage: 90, maxPercentage: 100, desc: 'Outstanding', isPass: true },
        { grade: 'A+', points: 9, minPercentage: 80, maxPercentage: 89.99, desc: 'Excellent', isPass: true },
        { grade: 'A', points: 8, minPercentage: 70, maxPercentage: 79.99, desc: 'Very Good', isPass: true },
        { grade: 'B+', points: 7, minPercentage: 60, maxPercentage: 69.99, desc: 'Good', isPass: true },
        { grade: 'B', points: 6, minPercentage: 55, maxPercentage: 59.99, desc: 'Above Average', isPass: true },
        { grade: 'C', points: 5, minPercentage: 50, maxPercentage: 54.99, desc: 'Average', isPass: true },
        { grade: 'P', points: 4, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
      ]
    }
  ],
  calculationRules: [
    {
      id: 'jntuh-r18-r22-rule',
      name: 'JNTUH Standard B.Tech Calculation Rule (R18/R22)',
      description: 'Official JNTU Hyderabad CBCS weighted credit sum for SGPA/CGPA with (CGPA - 0.5) × 10 percentage formula.',
      ruleType: 'percentage',
      universityId: 'jntuh',
      courseId: 'btech-cse',
      regulationId: 'jntuh-cse-r18',
      sgpaFormula: 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: '(CGPA - 0.5) * 10',
      formulaDescription: 'Percentage = (CGPA - 0.5) × 10',
      decimalPrecision: 2,
      roundingMode: 'round',
      minPassingGradePoints: 5.0,
      includeBacklogsInCredits: false,
      status: 'active',
      isOfficial: true,
      ruleVersion: 'JNTUH_R18_V1',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'ou-cbcs-standard-rule',
      name: 'Osmania University Standard CBCS Calculation Rule',
      description: 'Official Osmania University CBCS calculation: weighted credit sum with CGPA × 10 percentage formula.',
      ruleType: 'percentage',
      universityId: 'osmania',
      courseId: 'bca',
      regulationId: 'ou-bca-cbcs',
      sgpaFormula: 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: 'CGPA * 10',
      formulaDescription: 'Percentage = CGPA × 10',
      decimalPrecision: 2,
      roundingMode: 'round',
      minPassingGradePoints: 5.0,
      includeBacklogsInCredits: false,
      status: 'active',
      isOfficial: true,
      ruleVersion: 'OU_CBCS_V1',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'aicte-75-formula-rule',
      name: 'AICTE / National 10-Point Conversion Rule',
      description: 'National AICTE conversion standard: Percentage = (CGPA - 0.75) × 10.',
      ruleType: 'percentage',
      universityId: null,
      courseId: null,
      regulationId: null,
      sgpaFormula: 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: '(CGPA - 0.75) * 10',
      formulaDescription: 'Percentage = (CGPA - 0.75) × 10',
      decimalPrecision: 2,
      roundingMode: 'round',
      minPassingGradePoints: 4.5,
      includeBacklogsInCredits: false,
      status: 'active',
      isOfficial: true,
      ruleVersion: 'AICTE_2018_V1',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'cbse-95-formula-rule',
      name: 'Standard 9.5 Multiplier Rule',
      description: 'Percentage conversion using CGPA × 9.5 multiplier.',
      ruleType: 'percentage',
      universityId: null,
      courseId: null,
      regulationId: null,
      sgpaFormula: 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: 'CGPA * 9.5',
      formulaDescription: 'Percentage = CGPA × 9.5',
      decimalPrecision: 2,
      roundingMode: 'round',
      minPassingGradePoints: 4.0,
      includeBacklogsInCredits: false,
      status: 'active',
      isOfficial: false,
      ruleVersion: 'CBSE_95_V1',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ]
};

const STORAGE_KEY_CATALOG = STORAGE_KEYS.ACADEMIC_CATALOG;
const LEGACY_STORAGE_KEY_CATALOG = STORAGE_KEYS.LEGACY_ACADEMIC_CATALOG || 'resultpoint_academic_catalog';
const CATALOG_SCHEMA_VERSION = 'v7_calculation_rules_crud';

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

/**
 * Safely merge two catalogs without losing custom admin additions or creating duplicates.
 * Preserves target entities and merges in non-duplicate items from source.
 */
function mergeCatalogs(targetCatalog, sourceCatalog) {
  if (!targetCatalog && !sourceCatalog) return { ...DEFAULT_CATALOG, catalogVersion: CATALOG_SCHEMA_VERSION };
  if (!targetCatalog) return sourceCatalog;
  if (!sourceCatalog) return targetCatalog;

  const merged = { ...targetCatalog };
  if (!Array.isArray(merged.universities)) merged.universities = [];
  if (!Array.isArray(merged.gradingScales)) merged.gradingScales = [];
  if (!Array.isArray(merged.calculationRules)) merged.calculationRules = [];

  // 1. Merge universities
  const sourceUniversities = Array.isArray(sourceCatalog.universities) ? sourceCatalog.universities : [];
  sourceUniversities.forEach((srcUniv) => {
    const targetUnivIndex = merged.universities.findIndex((u) => u.id === srcUniv.id);
    if (targetUnivIndex === -1) {
      // University exists in source but not in target - preserve it
      merged.universities.push(srcUniv);
    } else {
      // University exists in both - merge courses
      const targetUniv = merged.universities[targetUnivIndex];
      const targetCourses = Array.isArray(targetUniv.courses) ? [...targetUniv.courses] : [];
      const srcCourses = Array.isArray(srcUniv.courses) ? srcUniv.courses : [];

      srcCourses.forEach((srcCourse) => {
        const targetCourseIndex = targetCourses.findIndex((c) => c.id === srcCourse.id);
        if (targetCourseIndex === -1) {
          targetCourses.push(srcCourse);
        } else {
          // Merge regulations inside course
          const targetCourse = targetCourses[targetCourseIndex];
          const targetRegs = Array.isArray(targetCourse.regulations) ? [...targetCourse.regulations] : [];
          const srcRegs = Array.isArray(srcCourse.regulations) ? srcCourse.regulations : [];

          srcRegs.forEach((srcReg) => {
            const targetRegIndex = targetRegs.findIndex((r) => r.id === srcReg.id);
            if (targetRegIndex === -1) {
              targetRegs.push(srcReg);
            } else {
              // Merge semester curricula
              const targetReg = targetRegs[targetRegIndex];
              const mergedSemesters = { ...(targetReg.semesters || {}), ...(srcReg.semesters || {}) };
              targetRegs[targetRegIndex] = { ...srcReg, ...targetReg, semesters: mergedSemesters };
            }
          });
          targetCourses[targetCourseIndex] = { ...srcCourse, ...targetCourse, regulations: targetRegs };
        }
      });

      merged.universities[targetUnivIndex] = {
        ...srcUniv,
        ...targetUniv,
        courses: targetCourses
      };
    }
  });

  // 2. Merge gradingScales
  const sourceScales = Array.isArray(sourceCatalog.gradingScales) ? sourceCatalog.gradingScales : [];
  sourceScales.forEach((srcScale) => {
    if (!merged.gradingScales.some((s) => s.id === srcScale.id)) {
      merged.gradingScales.push(srcScale);
    }
  });

  // 3. Merge calculationRules
  const sourceCalcRules = Array.isArray(sourceCatalog.calculationRules) ? sourceCatalog.calculationRules : [];
  sourceCalcRules.forEach((srcRule) => {
    if (!merged.calculationRules.some((r) => r.id === srcRule.id)) {
      merged.calculationRules.push(srcRule);
    }
  });

  merged.catalogVersion = CATALOG_SCHEMA_VERSION;
  return merged;
}

export const academicCatalogService = {
  initialize() {
    // 1. Check legacy and canonical storage keys
    const canonicalRaw = safeGet(STORAGE_KEY_CATALOG, null);
    const legacyRaw = safeGet(LEGACY_STORAGE_KEY_CATALOG, null);

    let activeCatalog = null;

    if (canonicalRaw && legacyRaw) {
      // Both keys have data: merge them cleanly without data loss or duplicates
      activeCatalog = mergeCatalogs(canonicalRaw, legacyRaw);
      safeSet(STORAGE_KEY_CATALOG, activeCatalog);
    } else if (!canonicalRaw && legacyRaw) {
      // Migrate legacy data to canonical key
      activeCatalog = legacyRaw;
      safeSet(STORAGE_KEY_CATALOG, activeCatalog);
    } else if (canonicalRaw) {
      activeCatalog = canonicalRaw;
    }

    // 2. Check if baseline default catalog must be merged (idempotent, preserves custom data)
    if (!activeCatalog || !Array.isArray(activeCatalog.universities) || activeCatalog.universities.length === 0) {
      activeCatalog = { ...DEFAULT_CATALOG, catalogVersion: CATALOG_SCHEMA_VERSION };
      safeSet(STORAGE_KEY_CATALOG, activeCatalog);
    } else {
      // Ensure official seed universities (OU, JNTUH), grading scales, and calculation rules exist
      const osmaniaUniv = activeCatalog.universities.find((u) => u.id === 'osmania');
      const jntuhUniv = activeCatalog.universities.find((u) => u.id === 'jntuh');

      const needsSeedMerge =
        !osmaniaUniv ||
        (osmaniaUniv.courses?.length || 0) < 10 ||
        !jntuhUniv ||
        activeCatalog.catalogVersion !== CATALOG_SCHEMA_VERSION;

      if (needsSeedMerge) {
        // Safe merge with DEFAULT_CATALOG so any custom added universities/courses/rules are preserved!
        activeCatalog = mergeCatalogs(activeCatalog, DEFAULT_CATALOG);
        safeSet(STORAGE_KEY_CATALOG, activeCatalog);
      }

      if (!Array.isArray(activeCatalog.gradingScales) || activeCatalog.gradingScales.length === 0) {
        activeCatalog.gradingScales = [...(DEFAULT_CATALOG.gradingScales || [])];
        safeSet(STORAGE_KEY_CATALOG, activeCatalog);
      }

      if (!Array.isArray(activeCatalog.calculationRules) || activeCatalog.calculationRules.length === 0) {
        activeCatalog.calculationRules = [...(DEFAULT_CATALOG.calculationRules || [])];
        safeSet(STORAGE_KEY_CATALOG, activeCatalog);
      }
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
      city: u.city || '',
      state: u.state || '',
      type: u.type || 'State University',
      status: u.status || 'active',
      website: u.website || '',
      logo: u.logo || null,
      description: u.description || '',
      courses: u.courses || [],
      courseCount: u.courses?.length || 0,
      coursesCount: u.courses?.length || 0
    }));
  },

  getUniversityById(univId) {
    if (!univId) return null;
    const catalog = this.getCatalog();
    const normalized = String(univId).trim().toLowerCase();
    const localId = resolveToLocalCatalogId(normalized);
    return (
      catalog.universities.find(
        (u) =>
          (u.id && (u.id.toLowerCase() === normalized || u.id.toLowerCase() === localId)) ||
          (u.shortName && (u.shortName.toLowerCase() === normalized || u.shortName.toLowerCase() === localId))
      ) || null
    );
  },

  getUniversity(univId) {
    return this.getUniversityById(univId);
  },

  getCoursesByUniversity(univId) {
    const univ = this.getUniversityById(univId);
    if (!univ || !univ.courses) return [];
    return univ.courses.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      level: c.level || 'UG',
      durationYears: c.durationYears || 4,
      totalSemesters: c.totalSemesters || 8,
      totalDegreeCredits: c.totalDegreeCredits || 160,
      status: c.status || 'active',
      regulations: c.regulations || [],
      regulationCount: c.regulations?.length || 0
    }));
  },

  getCourse(univId, courseId) {
    if (!courseId) return null;
    const univ = this.getUniversityById(univId);
    if (!univ || !univ.courses) return null;
    const normalized = String(courseId).trim().toLowerCase();
    const localId = resolveToLocalCatalogId(normalized);
    return (
      univ.courses.find(
        (c) =>
          (c.id && (c.id.toLowerCase() === normalized || c.id.toLowerCase() === localId)) ||
          (c.shortName && (c.shortName.toLowerCase() === normalized || c.shortName.toLowerCase() === localId))
      ) || null
    );
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
    if (!regulationId) return course.regulations[0] || null;
    const normalized = String(regulationId).trim().toLowerCase();
    const localId = resolveToLocalCatalogId(normalized);
    return (
      course.regulations.find(
        (r) =>
          (r.id && (r.id.toLowerCase() === normalized || r.id.toLowerCase() === localId)) ||
          (r.code && (r.code.toLowerCase() === normalized || r.code.toLowerCase() === localId))
      ) ||
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

    const isOu = univ.id === 'osmania' || univ.id === 'ou' || univ.id === 'uni_ou' || String(univ.shortName).toLowerCase() === 'ou';
    const isOuMcaOrBca = isOu && (
      ['mca', 'bca', 'course_ou_mca', 'course_ou_bca'].includes(String(course.id).toLowerCase()) ||
      ['mca', 'bca'].includes(String(course.shortName).toLowerCase())
    );

    const gradeScale = (regulation.gradeScale || []).map((g) => {
      if (isOuMcaOrBca && (g.grade === 'O' || g.desc?.toLowerCase().includes('outstanding'))) {
        return {
          ...g,
          grade: 'S',
          desc: 'Super'
        };
      }
      return g;
    });

    const gradingSystem = isOuMcaOrBca
      ? (regulation.gradingSystem || '10-point (S-Grade Scheme)').replace(/O-Grade/gi, 'S-Grade')
      : (regulation.gradingSystem || '10-point');

    let resolvedCalcRule = null;
    if (regulation.calculationRuleId) {
      const foundRule = this.getCalculationRule(regulation.calculationRuleId);
      if (foundRule) {
        resolvedCalcRule = {
          id: foundRule.id,
          name: foundRule.name,
          sgpaFormula: foundRule.sgpaFormula,
          cgpaFormula: foundRule.cgpaFormula,
          percentageFormula: foundRule.percentageFormula,
          formulaDescription: foundRule.formulaDescription
        };
      }
    }
    if (!resolvedCalcRule && regulation.calculationRule) {
      resolvedCalcRule = { ...regulation.calculationRule };
    }
    if (!resolvedCalcRule) {
      if (univ.id === 'jntuh' || univ.id === 'jntu' || univ.id === 'uni_jntuh' || String(univ.shortName).toLowerCase() === 'jntuh') {
        resolvedCalcRule = {
          id: 'jntuh-r18-r22-rule',
          name: 'JNTUH Standard Formula',
          sgpaFormula: 'WEIGHTED_CREDIT_SUM',
          cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
          percentageFormula: '(CGPA - 0.5) * 10',
          formulaDescription: 'Percentage = (CGPA - 0.5) × 10'
        };
      } else {
        resolvedCalcRule = {
          id: 'ou-cbcs-standard-rule',
          name: 'OU Standard CBCS Formula',
          sgpaFormula: 'WEIGHTED_CREDIT_SUM',
          cgpaFormula: 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
          percentageFormula: 'CGPA * 10',
          formulaDescription: 'Percentage = CGPA × 10'
        };
      }
    }

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
        calculationRuleId: regulation.calculationRuleId || resolvedCalcRule?.id,
        verificationStatus: regulation.verificationStatus || 'verified'
      },
      gradeScale,
      calculationRule: resolvedCalcRule,
      semesters: regulation.semesters || {}
    };
  },

  getSemesterSubjects(univId, courseId, regulationId, semesterNumber) {
    const config = this.getFullConfiguration(univId, courseId, regulationId);
    if (!config || !config.semesters) return [];
    const subjects = config.semesters[semesterNumber];
    if (Array.isArray(subjects)) {
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_catalog_updated', { detail: catalog }));
      window.dispatchEvent(new Event('storage'));
    }
    return catalog;
  },

  addUniversity(univData) {
    if (!univData || !univData.name || !univData.name.trim()) {
      throw new Error('University name is required.');
    }
    if (!univData.shortName || !univData.shortName.trim()) {
      throw new Error('University acronym / short name is required.');
    }

    const trimmedName = univData.name.trim();
    const trimmedShortName = univData.shortName.trim().toUpperCase();

    if (trimmedName.length < 3) {
      throw new Error('University name must be at least 3 characters long.');
    }
    if (trimmedShortName.length < 2) {
      throw new Error('Short code must be at least 2 characters long.');
    }

    if (univData.website && univData.website.trim()) {
      const url = univData.website.trim();
      if (!/^https?:\/\/.+/i.test(url)) {
        throw new Error('Official website must be a valid URL starting with http:// or https://');
      }
    }

    const catalog = this.getCatalog();
    const candidateId = (univData.id || trimmedShortName).toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (catalog.universities.some((u) => u.id === candidateId)) {
      throw new Error(`A university with identifier "${candidateId}" already exists.`);
    }

    if (catalog.universities.some((u) => u.shortName.toUpperCase() === trimmedShortName)) {
      throw new Error(`A university with acronym "${trimmedShortName}" already exists.`);
    }

    if (catalog.universities.some((u) => u.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A university with name "${trimmedName}" already exists.`);
    }

    const newUniv = {
      id: candidateId,
      name: trimmedName,
      shortName: trimmedShortName,
      city: (univData.city || '').trim(),
      state: (univData.state || '').trim(),
      type: univData.type || 'State Public University',
      website: (univData.website || '').trim(),
      logo: univData.logo || null,
      description: (univData.description || '').trim(),
      status: univData.status || 'active',
      courses: Array.isArray(univData.courses) ? univData.courses : [],
      createdAt: new Date().toISOString()
    };

    catalog.universities.push(newUniv);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'UNIVERSITY_ADDED',
        entityType: 'university',
        entityId: newUniv.id,
        entityName: newUniv.name,
        details: `Added new university "${newUniv.name}" (${newUniv.shortName}) to the catalog.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newUniv;
  },

  updateUniversity(univId, updates = {}) {
    const catalog = this.getCatalog();
    const idx = catalog.universities.findIndex((u) => u.id === univId);
    if (idx === -1) {
      throw new Error(`University with ID "${univId}" does not exist.`);
    }

    const existing = catalog.universities[idx];

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (trimmedName.length < 3) {
        throw new Error('University name must be at least 3 characters long.');
      }
      if (catalog.universities.some((u) => u.id !== univId && u.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error(`Another university with name "${trimmedName}" already exists.`);
      }
    }

    if (updates.shortName !== undefined) {
      const trimmedShort = updates.shortName.trim().toUpperCase();
      if (trimmedShort.length < 2) {
        throw new Error('Short code must be at least 2 characters long.');
      }
      if (catalog.universities.some((u) => u.id !== univId && u.shortName.toUpperCase() === trimmedShort)) {
        throw new Error(`Another university with acronym "${trimmedShort}" already exists.`);
      }
    }

    if (updates.website && updates.website.trim()) {
      const url = updates.website.trim();
      if (!/^https?:\/\/.+/i.test(url)) {
        throw new Error('Official website must be a valid URL starting with http:// or https://');
      }
    }

    catalog.universities[idx] = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      shortName: updates.shortName !== undefined ? updates.shortName.trim().toUpperCase() : existing.shortName,
      city: updates.city !== undefined ? updates.city.trim() : existing.city,
      state: updates.state !== undefined ? updates.state.trim() : existing.state,
      type: updates.type !== undefined ? updates.type : existing.type,
      website: updates.website !== undefined ? updates.website.trim() : existing.website,
      logo: updates.logo !== undefined ? updates.logo : existing.logo,
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      status: updates.status !== undefined ? updates.status : (existing.status || 'active'),
      updatedAt: new Date().toISOString()
    };

    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'UNIVERSITY_UPDATED',
        entityType: 'university',
        entityId: univId,
        entityName: catalog.universities[idx].name,
        details: `Updated metadata for university "${catalog.universities[idx].name}".`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return catalog.universities[idx];
  },

  setUniversityStatus(univId, newStatus) {
    if (!['active', 'inactive', 'archived'].includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be "active", "inactive", or "archived".`);
    }

    const updated = this.updateUniversity(univId, { status: newStatus });

    try {
      auditHistoryService.recordEvent({
        action: newStatus === 'archived' ? 'UNIVERSITY_ARCHIVED' : 'UNIVERSITY_STATUS_CHANGED',
        entityType: 'university',
        entityId: univId,
        entityName: updated.name,
        details: `Set status of university "${updated.name}" to ${newStatus}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return updated;
  },

  checkUniversityReferences(univId) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) return { canDelete: true, totalReferences: 0 };

    const courseCount = Array.isArray(univ.courses) ? univ.courses.length : 0;
    let regulationCount = 0;
    if (univ.courses) {
      univ.courses.forEach((c) => {
        if (Array.isArray(c.regulations)) regulationCount += c.regulations.length;
      });
    }

    let studentProfileCount = 0;
    let educationRecordCount = 0;
    let resultCount = 0;

    try {
      const users = safeGet(STORAGE_KEYS.USERS, []);
      studentProfileCount += users.filter(
        (u) => u.universityId === univId || (u.university && u.university.toLowerCase().includes(univ.shortName.toLowerCase()))
      ).length;

      const student = safeGet(STORAGE_KEYS.STUDENT, null);
      if (student && student.universityId === univId) studentProfileCount++;
    } catch { }

    try {
      const eduRecords = safeGet(STORAGE_KEYS.EDUCATION_RECORDS, []);
      educationRecordCount += eduRecords.filter((r) => r.universityId === univId).length;
    } catch { }

    try {
      const results = safeGet(STORAGE_KEYS.RESULTS, []);
      resultCount += results.filter((r) => r.universityId === univId).length;
    } catch { }

    const totalReferences = courseCount + regulationCount + studentProfileCount + educationRecordCount + resultCount;

    const reasons = [];
    if (courseCount > 0) reasons.push(`${courseCount} configured course${courseCount === 1 ? '' : 's'}`);
    if (regulationCount > 0) reasons.push(`${regulationCount} regulation${regulationCount === 1 ? '' : 's'}`);
    if (studentProfileCount > 0) reasons.push(`${studentProfileCount} student profile${studentProfileCount === 1 ? '' : 's'}`);
    if (educationRecordCount > 0) reasons.push(`${educationRecordCount} education record${educationRecordCount === 1 ? '' : 's'}`);
    if (resultCount > 0) reasons.push(`${resultCount} semester result${resultCount === 1 ? '' : 's'}`);

    const reason = totalReferences > 0
      ? `Cannot permanently delete "${univ.name}": It is referenced by ${reasons.join(', ')}. Please Archive this university instead to preserve historical academic integrity.`
      : null;

    return {
      canDelete: totalReferences === 0,
      courseCount,
      regulationCount,
      studentProfileCount,
      educationRecordCount,
      resultCount,
      totalReferences,
      reason,
      reasons,
      details: {
        courses: courseCount,
        regulations: regulationCount,
        studentProfiles: studentProfileCount,
        educationRecords: educationRecordCount,
        savedResults: resultCount,
        studentRecords: studentProfileCount + educationRecordCount
      }
    };
  },

  archiveUniversity(univId) {
    return this.setUniversityStatus(univId, 'archived');
  },

  deleteUniversity(univId) {
    const refCheck = this.checkUniversityReferences(univId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const catalog = this.getCatalog();
    const idx = catalog.universities.findIndex((u) => u.id === univId);
    if (idx === -1) {
      throw new Error(`University with ID "${univId}" does not exist.`);
    }

    const deleted = catalog.universities.splice(idx, 1)[0];
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'UNIVERSITY_DELETED',
        entityType: 'university',
        entityId: univId,
        entityName: deleted.name,
        details: `Permanently deleted unreferenced university "${deleted.name}".`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return deleted;
  },

  addCourse(univId, courseData) {
    if (!univId) {
      throw new Error('Parent university ID is required.');
    }
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) {
      throw new Error(`Parent university with ID "${univId}" does not exist.`);
    }

    if (!courseData || !courseData.name || !courseData.name.trim()) {
      throw new Error('Course full name is required.');
    }
    if (!courseData.shortName || !courseData.shortName.trim()) {
      throw new Error('Course acronym / short code is required.');
    }

    const trimmedName = courseData.name.trim();
    const trimmedShort = courseData.shortName.trim().toUpperCase();

    if (trimmedName.length < 3) {
      throw new Error('Course full name must be at least 3 characters long.');
    }
    if (trimmedShort.length < 1) {
      throw new Error('Course short code must not be empty.');
    }

    const semesters = Number(courseData.totalSemesters);
    if (isNaN(semesters) || semesters < 1 || semesters > 12) {
      throw new Error('Total semesters must be a valid number between 1 and 12.');
    }

    const duration = Number(courseData.durationYears);
    if (isNaN(duration) || duration < 1 || duration > 6) {
      throw new Error('Course duration must be a valid number between 1 and 6 years.');
    }

    const credits = Number(courseData.totalDegreeCredits);
    if (isNaN(credits) || credits <= 0) {
      throw new Error('Total degree credits must be a positive number greater than 0.');
    }

    if (!univ.courses) univ.courses = [];

    const candidateId = (courseData.id || trimmedShort.toLowerCase()).toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (univ.courses.some((c) => c.id === candidateId)) {
      throw new Error(`A course with identifier "${candidateId}" already exists under ${univ.shortName}.`);
    }

    if (univ.courses.some((c) => c.shortName.toUpperCase() === trimmedShort)) {
      throw new Error(`A course with acronym "${trimmedShort}" already exists under ${univ.shortName}.`);
    }

    if (univ.courses.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`A course with name "${trimmedName}" already exists under ${univ.shortName}.`);
    }

    const newCourse = {
      id: candidateId,
      name: trimmedName,
      shortName: trimmedShort,
      level: courseData.level || 'UG',
      durationYears: duration,
      totalSemesters: semesters,
      totalDegreeCredits: credits,
      status: courseData.status || 'active',
      regulations: Array.isArray(courseData.regulations) ? courseData.regulations : [],
      createdAt: new Date().toISOString()
    };

    univ.courses.push(newCourse);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'COURSE_ADDED',
        entityType: 'course',
        entityId: newCourse.id,
        entityName: newCourse.name,
        details: `Added new course "${newCourse.name}" (${newCourse.shortName}, ${newCourse.level}) under ${univ.shortName}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newCourse;
  },

  updateCourse(univId, courseId, updates = {}) {
    if (!univId) throw new Error('Parent university ID is required.');
    if (!courseId) throw new Error('Course ID is required.');

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) throw new Error(`Parent university with ID "${univId}" does not exist.`);

    if (!univ.courses) univ.courses = [];
    const idx = univ.courses.findIndex((c) => c.id === courseId);
    if (idx === -1) {
      throw new Error(`Course with ID "${courseId}" does not exist under ${univ.shortName}.`);
    }

    const existing = univ.courses[idx];

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (trimmedName.length < 3) {
        throw new Error('Course full name must be at least 3 characters long.');
      }
      if (univ.courses.some((c) => c.id !== courseId && c.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error(`Another course with name "${trimmedName}" already exists under ${univ.shortName}.`);
      }
    }

    if (updates.shortName !== undefined) {
      const trimmedShort = updates.shortName.trim().toUpperCase();
      if (trimmedShort.length < 1) {
        throw new Error('Course short code cannot be empty.');
      }
      if (univ.courses.some((c) => c.id !== courseId && c.shortName.toUpperCase() === trimmedShort)) {
        throw new Error(`Another course with acronym "${trimmedShort}" already exists under ${univ.shortName}.`);
      }
    }

    if (updates.totalSemesters !== undefined) {
      const s = Number(updates.totalSemesters);
      if (isNaN(s) || s < 1 || s > 12) {
        throw new Error('Total semesters must be between 1 and 12.');
      }
    }

    if (updates.durationYears !== undefined) {
      const d = Number(updates.durationYears);
      if (isNaN(d) || d < 1 || d > 6) {
        throw new Error('Duration in years must be between 1 and 6.');
      }
    }

    if (updates.totalDegreeCredits !== undefined) {
      const cr = Number(updates.totalDegreeCredits);
      if (isNaN(cr) || cr <= 0) {
        throw new Error('Total degree credits must be a positive number greater than 0.');
      }
    }

    univ.courses[idx] = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      shortName: updates.shortName !== undefined ? updates.shortName.trim().toUpperCase() : existing.shortName,
      level: updates.level !== undefined ? updates.level : (existing.level || 'UG'),
      durationYears: updates.durationYears !== undefined ? Number(updates.durationYears) : existing.durationYears,
      totalSemesters: updates.totalSemesters !== undefined ? Number(updates.totalSemesters) : existing.totalSemesters,
      totalDegreeCredits: updates.totalDegreeCredits !== undefined ? Number(updates.totalDegreeCredits) : existing.totalDegreeCredits,
      status: updates.status !== undefined ? updates.status : (existing.status || 'active'),
      regulations: existing.regulations || [],
      updatedAt: new Date().toISOString()
    };

    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'COURSE_UPDATED',
        entityType: 'course',
        entityId: courseId,
        entityName: univ.courses[idx].name,
        details: `Updated metadata for course "${univ.courses[idx].name}" under ${univ.shortName}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return univ.courses[idx];
  },

  setCourseStatus(univId, courseId, newStatus) {
    if (!['active', 'inactive', 'archived'].includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be "active", "inactive", or "archived".`);
    }

    const updated = this.updateCourse(univId, courseId, { status: newStatus });

    try {
      auditHistoryService.recordEvent({
        action: newStatus === 'archived' ? 'COURSE_ARCHIVED' : 'COURSE_STATUS_CHANGED',
        entityType: 'course',
        entityId: courseId,
        entityName: updated.name,
        details: `Set status of course "${updated.name}" to ${newStatus}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return updated;
  },

  checkCourseReferences(univId, courseId) {
    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ || !univ.courses) return { canDelete: true, totalReferences: 0 };

    const course = univ.courses.find((c) => c.id === courseId);
    if (!course) return { canDelete: true, totalReferences: 0 };

    const regulationCount = Array.isArray(course.regulations) ? course.regulations.length : 0;
    let studentProfileCount = 0;
    let educationRecordCount = 0;
    let resultCount = 0;

    try {
      const users = safeGet(STORAGE_KEYS.USERS, []);
      studentProfileCount += users.filter(
        (u) =>
          u.courseId === courseId ||
          (u.course && u.course.toLowerCase() === course.shortName.toLowerCase())
      ).length;

      const student = safeGet(STORAGE_KEYS.STUDENT, null);
      if (
        student &&
        (student.courseId === courseId ||
          (student.course && student.course.toLowerCase() === course.shortName.toLowerCase()))
      ) {
        studentProfileCount++;
      }
    } catch { }

    try {
      const eduRecords = safeGet(STORAGE_KEYS.EDUCATION_RECORDS, []);
      educationRecordCount += eduRecords.filter(
        (r) =>
          r.courseId === courseId ||
          (r.course && r.course.toLowerCase() === course.shortName.toLowerCase())
      ).length;
    } catch { }

    try {
      const results = safeGet(STORAGE_KEYS.RESULTS, []);
      resultCount += results.filter(
        (r) =>
          r.courseId === courseId ||
          (r.course && r.course.toLowerCase() === course.shortName.toLowerCase())
      ).length;
    } catch { }

    const totalReferences = regulationCount + studentProfileCount + educationRecordCount + resultCount;

    const reasons = [];
    if (regulationCount > 0) reasons.push(`${regulationCount} configured regulation${regulationCount === 1 ? '' : 's'}`);
    if (studentProfileCount > 0) reasons.push(`${studentProfileCount} student profile${studentProfileCount === 1 ? '' : 's'}`);
    if (educationRecordCount > 0) reasons.push(`${educationRecordCount} education record${educationRecordCount === 1 ? '' : 's'}`);
    if (resultCount > 0) reasons.push(`${resultCount} saved semester calculation result${resultCount === 1 ? '' : 's'}`);

    const reason = totalReferences > 0
      ? `Cannot permanently delete course "${course.name}": It is referenced by ${reasons.join(', ')}. Please Archive this course instead to preserve academic calculation history.`
      : null;

    return {
      canDelete: totalReferences === 0,
      regulationCount,
      studentProfileCount,
      educationRecordCount,
      resultCount,
      totalReferences,
      reason,
      reasons,
      details: {
        regulations: regulationCount,
        studentProfiles: studentProfileCount,
        educationRecords: educationRecordCount,
        savedResults: resultCount,
        studentRecords: studentProfileCount + educationRecordCount
      }
    };
  },

  archiveCourse(univId, courseId) {
    return this.setCourseStatus(univId, courseId, 'archived');
  },

  deleteCourse(univId, courseId) {
    const refCheck = this.checkCourseReferences(univId, courseId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ || !univ.courses) {
      throw new Error(`University with ID "${univId}" does not exist.`);
    }

    const idx = univ.courses.findIndex((c) => c.id === courseId);
    if (idx === -1) {
      throw new Error(`Course with ID "${courseId}" does not exist.`);
    }

    const deleted = univ.courses.splice(idx, 1)[0];
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'COURSE_DELETED',
        entityType: 'course',
        entityId: courseId,
        entityName: deleted.name,
        details: `Permanently deleted unreferenced course "${deleted.name}" under ${univ.shortName}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return deleted;
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

  getSubject(univId, courseId, regId, semesterNumber, subjectCode) {
    const subjects = this.getSemesterSubjects(univId, courseId, regId, semesterNumber);
    return subjects.find((s) => s.code.toUpperCase() === String(subjectCode).toUpperCase()) || null;
  },

  getSemesterTotalCredits(univId, courseId, regId, semesterNumber) {
    const subjects = this.getSemesterSubjects(univId, courseId, regId, semesterNumber);
    return subjects
      .filter((s) => s.status !== 'archived')
      .reduce((sum, s) => sum + (Number(s.defaultCredits !== undefined ? s.defaultCredits : s.credits) || 0), 0);
  },

  addSubject(univId, courseId, regId, semesterNumber, subjectData) {
    if (!subjectData || typeof subjectData !== 'object') {
      throw new Error('Subject details are required.');
    }

    const code = (subjectData.code || '').trim().toUpperCase();
    const name = (subjectData.name || '').trim();

    if (!code || code.length < 2) {
      throw new Error('Subject code is required and must be at least 2 characters.');
    }
    if (!name || name.length < 2) {
      throw new Error('Subject title / name is required and must be at least 2 characters.');
    }

    const rawCredits = subjectData.defaultCredits !== undefined ? subjectData.defaultCredits : subjectData.credits;
    const credits = Number(rawCredits !== undefined && rawCredits !== '' ? rawCredits : 4);
    if (isNaN(credits) || credits < 0 || credits > 30) {
      throw new Error('Credits must be a valid non-negative number between 0 and 30.');
    }

    let maxMarks;
    let passMarks;
    if (subjectData.maxMarks !== undefined && subjectData.maxMarks !== null && subjectData.maxMarks !== '') {
      maxMarks = Number(subjectData.maxMarks);
      if (isNaN(maxMarks) || maxMarks <= 0) {
        throw new Error('Maximum marks must be a positive number.');
      }
      if (subjectData.passMarks !== undefined && subjectData.passMarks !== null && subjectData.passMarks !== '') {
        passMarks = Number(subjectData.passMarks);
        if (isNaN(passMarks) || passMarks < 0) {
          throw new Error('Passing marks must be a non-negative number.');
        }
        if (passMarks > maxMarks) {
          throw new Error(`Passing marks (${passMarks}) cannot exceed maximum marks (${maxMarks}).`);
        }
      }
    }

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist under ${univ.shortName}.`);

    const reg = course.regulations?.find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist under ${course.shortName}.`);

    const semNum = Number(semesterNumber);
    if (!semNum || semNum < 1 || semNum > (course.totalSemesters || 12)) {
      throw new Error(`Invalid semester number: ${semesterNumber}. Must be between 1 and ${course.totalSemesters || 12}.`);
    }

    if (!reg.semesters) reg.semesters = {};
    if (!Array.isArray(reg.semesters[semNum])) {
      reg.semesters[semNum] = [];
    }

    const existingIndex = reg.semesters[semNum].findIndex(
      (s) => s.code.toUpperCase() === code
    );
    if (existingIndex !== -1) {
      throw new Error(`Subject with code "${code}" already exists in Semester ${semNum} of regulation "${reg.code || reg.name}".`);
    }

    const newSubject = {
      code,
      name,
      defaultCredits: credits,
      type: subjectData.type || 'Theory',
      ...(maxMarks !== undefined && { maxMarks }),
      ...(passMarks !== undefined && { passMarks }),
      status: subjectData.status || 'active',
      createdAt: new Date().toISOString()
    };

    reg.semesters[semNum].push(newSubject);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'SUBJECT_ADDED',
        entityType: 'subject',
        entityId: newSubject.code,
        entityName: newSubject.name,
        semesterNumber: semNum,
        semesterLabel: `Semester ${semNum}`,
        credits: newSubject.defaultCredits,
        details: `Added subject "${newSubject.name}" (${newSubject.code}) with ${newSubject.defaultCredits} credits in ${univ.shortName} • ${course.shortName} • Sem ${semNum}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newSubject;
  },

  updateSubject(univId, courseId, regId, semesterNumber, subjectCode, updates) {
    if (!updates || typeof updates !== 'object') {
      throw new Error('Update payload is required.');
    }

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist under ${univ.shortName}.`);

    const reg = course.regulations?.find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist under ${course.shortName}.`);

    const semNum = Number(semesterNumber);
    if (!reg.semesters || !Array.isArray(reg.semesters[semNum])) {
      throw new Error(`No subjects configured for Semester ${semNum}.`);
    }

    const subIdx = reg.semesters[semNum].findIndex(
      (s) => s.code.toUpperCase() === String(subjectCode).toUpperCase()
    );
    if (subIdx === -1) {
      throw new Error(`Subject with code "${subjectCode}" was not found in Semester ${semNum}.`);
    }

    const existing = reg.semesters[semNum][subIdx];

    // Validate new code if changed
    let updatedCode = existing.code;
    if (updates.code) {
      const trimmedCode = updates.code.trim().toUpperCase();
      if (trimmedCode.length < 2) {
        throw new Error('Subject code must be at least 2 characters.');
      }
      if (trimmedCode !== existing.code.toUpperCase()) {
        const conflict = reg.semesters[semNum].some(
          (s, idx) => idx !== subIdx && s.code.toUpperCase() === trimmedCode
        );
        if (conflict) {
          throw new Error(`Subject code "${trimmedCode}" is already in use by another subject in Semester ${semNum}.`);
        }
        updatedCode = trimmedCode;
      }
    }

    // Validate name if provided
    let updatedName = existing.name;
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (trimmedName.length < 2) {
        throw new Error('Subject name must be at least 2 characters.');
      }
      updatedName = trimmedName;
    }

    // Validate credits if provided
    let updatedCredits = existing.defaultCredits !== undefined ? existing.defaultCredits : (existing.credits || 4);
    const candidateCredits = updates.defaultCredits !== undefined ? updates.defaultCredits : updates.credits;
    if (candidateCredits !== undefined && candidateCredits !== '') {
      const numCredits = Number(candidateCredits);
      if (isNaN(numCredits) || numCredits < 0 || numCredits > 30) {
        throw new Error('Credits must be a valid non-negative number between 0 and 30.');
      }
      updatedCredits = numCredits;
    }

    // Validate maxMarks & passMarks
    let updatedMaxMarks = existing.maxMarks;
    let updatedPassMarks = existing.passMarks;

    if (updates.maxMarks !== undefined) {
      if (updates.maxMarks === '' || updates.maxMarks === null) {
        updatedMaxMarks = undefined;
      } else {
        const mm = Number(updates.maxMarks);
        if (isNaN(mm) || mm <= 0) {
          throw new Error('Maximum marks must be a positive number.');
        }
        updatedMaxMarks = mm;
      }
    }

    if (updates.passMarks !== undefined) {
      if (updates.passMarks === '' || updates.passMarks === null) {
        updatedPassMarks = undefined;
      } else {
        const pm = Number(updates.passMarks);
        if (isNaN(pm) || pm < 0) {
          throw new Error('Passing marks must be a non-negative number.');
        }
        updatedPassMarks = pm;
      }
    }

    if (updatedMaxMarks !== undefined && updatedPassMarks !== undefined) {
      if (updatedPassMarks > updatedMaxMarks) {
        throw new Error(`Passing marks (${updatedPassMarks}) cannot exceed maximum marks (${updatedMaxMarks}).`);
      }
    }

    const updatedSubject = {
      ...existing,
      code: updatedCode,
      name: updatedName,
      defaultCredits: updatedCredits,
      type: updates.type || existing.type || 'Theory',
      status: updates.status || existing.status || 'active',
      updatedAt: new Date().toISOString()
    };

    if (updatedMaxMarks !== undefined) updatedSubject.maxMarks = updatedMaxMarks;
    else delete updatedSubject.maxMarks;

    if (updatedPassMarks !== undefined) updatedSubject.passMarks = updatedPassMarks;
    else delete updatedSubject.passMarks;

    reg.semesters[semNum][subIdx] = updatedSubject;
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'SUBJECT_UPDATED',
        entityType: 'subject',
        entityId: updatedSubject.code,
        entityName: updatedSubject.name,
        semesterNumber: semNum,
        semesterLabel: `Semester ${semNum}`,
        credits: updatedSubject.defaultCredits,
        details: `Updated subject "${updatedSubject.name}" (${updatedSubject.code}) in ${univ.shortName} • ${course.shortName} • Sem ${semNum}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return updatedSubject;
  },

  setSubjectStatus(univId, courseId, regId, semesterNumber, subjectCode, status) {
    if (!['active', 'inactive', 'archived'].includes(status)) {
      throw new Error(`Invalid status: "${status}". Must be active, inactive, or archived.`);
    }
    return this.updateSubject(univId, courseId, regId, semesterNumber, subjectCode, { status });
  },

  checkSubjectReferences(univId, courseId, regId, semesterNumber, subjectCode) {
    const codeUpper = String(subjectCode).trim().toUpperCase();

    // 1. Saved student semester results
    let resultCount = 0;
    try {
      const allResults = safeGet(STORAGE_KEYS.RESULTS, []);
      if (Array.isArray(allResults)) {
        resultCount = allResults.filter(
          (r) =>
            Array.isArray(r.subjects) &&
            r.subjects.some((s) => (s.code || '').trim().toUpperCase() === codeUpper)
        ).length;
      }
      const savedResults = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
      if (Array.isArray(savedResults)) {
        const extra = savedResults.filter(
          (r) =>
            Array.isArray(r.subjects) &&
            r.subjects.some((s) => (s.code || '').trim().toUpperCase() === codeUpper) &&
            !allResults.some((ar) => ar.id === r.id)
        ).length;
        resultCount += extra;
      }
    } catch { }

    // 2. Backlog tracker records
    let backlogCount = 0;
    try {
      const allBacklogs = safeGet(STORAGE_KEYS.BACKLOGS, []);
      if (Array.isArray(allBacklogs)) {
        backlogCount = allBacklogs.filter(
          (b) =>
            (b.subjectCode && b.subjectCode.trim().toUpperCase() === codeUpper) ||
            (b.code && b.code.trim().toUpperCase() === codeUpper)
        ).length;
      }
    } catch { }

    const totalReferences = resultCount + backlogCount;
    const reasons = [];
    if (resultCount > 0) reasons.push(`${resultCount} saved student semester result snapshot${resultCount === 1 ? '' : 's'}`);
    if (backlogCount > 0) reasons.push(`${backlogCount} student backlog record${backlogCount === 1 ? '' : 's'}`);

    const reason = totalReferences > 0
      ? `Cannot permanently delete subject "${subjectCode}": It is referenced by ${reasons.join(', ')}. Please Archive this subject instead to preserve student academic transcripts and grade history.`
      : null;

    return {
      canDelete: totalReferences === 0,
      resultCount,
      backlogCount,
      totalReferences,
      reason,
      reasons,
      details: {
        savedResults: resultCount,
        backlogs: backlogCount
      }
    };
  },

  archiveSubject(univId, courseId, regId, semesterNumber, subjectCode) {
    const updated = this.setSubjectStatus(univId, courseId, regId, semesterNumber, subjectCode, 'archived');
    try {
      auditHistoryService.recordEvent({
        action: 'SUBJECT_ARCHIVED',
        entityType: 'subject',
        entityId: updated.code,
        entityName: updated.name,
        semesterNumber: Number(semesterNumber),
        semesterLabel: `Semester ${semesterNumber}`,
        details: `Archived subject "${updated.name}" (${updated.code}). Historical references and transcripts remain fully intact.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }
    return updated;
  },

  deleteSubject(univId, courseId, regId, semesterNumber, subjectCode) {
    const refCheck = this.checkSubjectReferences(univId, courseId, regId, semesterNumber, subjectCode);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist.`);

    const reg = course.regulations?.find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist.`);

    const semNum = Number(semesterNumber);
    if (!reg.semesters || !Array.isArray(reg.semesters[semNum])) {
      throw new Error(`No subjects configured for Semester ${semNum}.`);
    }

    const subIdx = reg.semesters[semNum].findIndex(
      (s) => s.code.toUpperCase() === String(subjectCode).toUpperCase()
    );
    if (subIdx === -1) {
      throw new Error(`Subject with code "${subjectCode}" was not found in Semester ${semNum}.`);
    }

    const deleted = reg.semesters[semNum].splice(subIdx, 1)[0];
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'SUBJECT_DELETED',
        entityType: 'subject',
        entityId: deleted.code,
        entityName: deleted.name,
        semesterNumber: semNum,
        semesterLabel: `Semester ${semNum}`,
        details: `Permanently deleted unreferenced subject "${deleted.name}" (${deleted.code}) from ${univ.shortName} • ${course.shortName} • Sem ${semNum}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return deleted;
  },

  // ================= GRADING RULES & SCALES WORKFLOWS ================= //

  validateGradeScale(grades, options = { checkCoverage: false }) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(grades) || grades.length === 0) {
      errors.push('Grading scale must contain at least one grade tier.');
      return { isValid: false, errors, warnings };
    }

    const seenSymbols = new Set();
    const parsedGrades = [];

    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      const symbol = String(g.grade || '').trim().toUpperCase();

      if (!symbol) {
        errors.push(`Grade entry at row ${i + 1} is missing a grade letter/symbol.`);
        continue;
      }

      if (seenSymbols.has(symbol)) {
        errors.push(`Duplicate grade symbol "${symbol}" found. Grade symbols must be unique within a scale.`);
      }
      seenSymbols.add(symbol);

      const points = Number(g.points);
      if (isNaN(points) || points < 0 || points > 100) {
        errors.push(`Grade "${symbol}" has invalid grade points (${g.points}). Must be a finite number between 0 and 100.`);
      }

      const minPercentage = Number(g.minPercentage);
      const maxPercentage = Number(g.maxPercentage);

      if (isNaN(minPercentage) || minPercentage < 0 || minPercentage > 100) {
        errors.push(`Grade "${symbol}" has invalid minimum percentage (${g.minPercentage}). Must be between 0 and 100.`);
      }

      if (isNaN(maxPercentage) || maxPercentage < 0 || maxPercentage > 100) {
        errors.push(`Grade "${symbol}" has invalid maximum percentage (${g.maxPercentage}). Must be between 0 and 100.`);
      }

      if (!isNaN(minPercentage) && !isNaN(maxPercentage)) {
        if (minPercentage > maxPercentage) {
          errors.push(`For grade "${symbol}", minimum marks (${minPercentage}%) cannot exceed maximum marks (${maxPercentage}%).`);
        }
      }

      parsedGrades.push({
        ...g,
        symbol,
        points,
        minPercentage,
        maxPercentage,
        index: i
      });
    }

    // Check for overlapping marks ranges
    for (let i = 0; i < parsedGrades.length; i++) {
      for (let j = i + 1; j < parsedGrades.length; j++) {
        const a = parsedGrades[i];
        const b = parsedGrades[j];
        if (isNaN(a.minPercentage) || isNaN(a.maxPercentage) || isNaN(b.minPercentage) || isNaN(b.maxPercentage)) continue;
        if (a.minPercentage > a.maxPercentage || b.minPercentage > b.maxPercentage) continue;

        // Two ranges [minA, maxA] and [minB, maxB] strictly overlap if:
        // max(minA, minB) < min(maxA, maxB)
        const overlapStart = Math.max(a.minPercentage, b.minPercentage);
        const overlapEnd = Math.min(a.maxPercentage, b.maxPercentage);

        if (overlapStart < overlapEnd) {
          errors.push(
            `Marks range overlap detected between "${a.symbol}" (${a.minPercentage}%-${a.maxPercentage}%) and "${b.symbol}" (${b.minPercentage}%-${b.maxPercentage}%).`
          );
        }
      }
    }

    // Check for gaps / incomplete coverage if requested
    if (options.checkCoverage && errors.length === 0 && parsedGrades.length > 0) {
      const sortedByMin = [...parsedGrades].sort((a, b) => a.minPercentage - b.minPercentage);

      // Check lower bound (starts at 0)
      if (sortedByMin[0].minPercentage > 0) {
        warnings.push(`Scale does not cover marks from 0% to ${sortedByMin[0].minPercentage}%.`);
      }

      // Check upper bound (ends at 100)
      const lastTier = sortedByMin[sortedByMin.length - 1];
      if (lastTier.maxPercentage < 100) {
        warnings.push(`Scale does not cover marks from ${lastTier.maxPercentage}% to 100%.`);
      }

      // Check interior gaps
      for (let k = 0; k < sortedByMin.length - 1; k++) {
        const current = sortedByMin[k];
        const next = sortedByMin[k + 1];
        const gap = next.minPercentage - current.maxPercentage;
        if (gap > 0.05) {
          warnings.push(
            `Gap detected between "${current.symbol}" (max ${current.maxPercentage}%) and "${next.symbol}" (min ${next.minPercentage}%).`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  getGradingScales() {
    const catalog = this.getCatalog();
    return Array.isArray(catalog.gradingScales) ? catalog.gradingScales : [];
  },

  getGradingScale(scaleId) {
    const scales = this.getGradingScales();
    const idClean = String(scaleId || '').trim().toLowerCase();
    return scales.find((s) => s.id.toLowerCase() === idClean) || null;
  },

  addGradingScale(scaleData) {
    if (!scaleData || typeof scaleData !== 'object') {
      throw new Error('Grading scale data is required.');
    }

    const name = (scaleData.name || '').trim();
    if (!name || name.length < 3) {
      throw new Error('Grading scale name is required and must be at least 3 characters.');
    }

    const rawId = (scaleData.id || name).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!rawId || rawId.length < 2) {
      throw new Error('Grading scale ID must be at least 2 characters.');
    }

    const catalog = this.getCatalog();
    if (!Array.isArray(catalog.gradingScales)) {
      catalog.gradingScales = [];
    }

    if (catalog.gradingScales.some((s) => s.id.toLowerCase() === rawId.toLowerCase())) {
      throw new Error(`A grading scale with identifier "${rawId}" already exists.`);
    }

    const grades = Array.isArray(scaleData.grades) && scaleData.grades.length > 0
      ? scaleData.grades
      : [
        { grade: 'O', points: 10, minPercentage: 85, maxPercentage: 100, desc: 'Outstanding', isPass: true },
        { grade: 'A+', points: 9, minPercentage: 75, maxPercentage: 84.99, desc: 'Excellent', isPass: true },
        { grade: 'A', points: 8, minPercentage: 65, maxPercentage: 74.99, desc: 'Very Good', isPass: true },
        { grade: 'B+', points: 7, minPercentage: 55, maxPercentage: 64.99, desc: 'Good', isPass: true },
        { grade: 'B', points: 6, minPercentage: 50, maxPercentage: 54.99, desc: 'Above Average', isPass: true },
        { grade: 'C', points: 5, minPercentage: 40, maxPercentage: 49.99, desc: 'Pass', isPass: true },
        { grade: 'F', points: 0, minPercentage: 0, maxPercentage: 39.99, desc: 'Fail', isPass: false }
      ];

    const validation = this.validateGradeScale(grades, { checkCoverage: false });
    if (!validation.isValid) {
      throw new Error(`Invalid grading scale: ${validation.errors.join(' ')}`);
    }

    const newScale = {
      id: rawId,
      name,
      system: scaleData.system || '10-point',
      description: (scaleData.description || '').trim(),
      status: scaleData.status || 'active',
      isOfficial: Boolean(scaleData.isOfficial),
      grades: grades.map((g) => ({
        grade: String(g.grade || '').trim().toUpperCase(),
        points: Number(g.points) || 0,
        minPercentage: Number(g.minPercentage) || 0,
        maxPercentage: Number(g.maxPercentage) || 100,
        desc: String(g.desc || '').trim(),
        isPass: g.isPass !== undefined ? Boolean(g.isPass) : Number(g.points) > 0
      })),
      createdAt: new Date().toISOString()
    };

    catalog.gradingScales.push(newScale);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'GRADING_SCALE_ADDED',
        entityType: 'grading_scale',
        entityId: newScale.id,
        entityName: newScale.name,
        details: `Created new grading scale "${newScale.name}" (${newScale.id}) with ${newScale.grades.length} grade tiers.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newScale;
  },

  updateGradingScale(scaleId, updates) {
    if (!updates || typeof updates !== 'object') {
      throw new Error('Update payload is required.');
    }

    const catalog = this.getCatalog();
    if (!Array.isArray(catalog.gradingScales)) {
      catalog.gradingScales = [];
    }

    const idx = catalog.gradingScales.findIndex((s) => s.id.toLowerCase() === String(scaleId).toLowerCase());
    if (idx === -1) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    const existing = catalog.gradingScales[idx];

    let updatedName = existing.name;
    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed || trimmed.length < 3) {
        throw new Error('Grading scale name must be at least 3 characters.');
      }
      updatedName = trimmed;
    }

    let updatedGrades = existing.grades;
    if (updates.grades !== undefined) {
      const validation = this.validateGradeScale(updates.grades, { checkCoverage: false });
      if (!validation.isValid) {
        throw new Error(`Invalid grade entries: ${validation.errors.join(' ')}`);
      }
      updatedGrades = updates.grades.map((g) => ({
        grade: String(g.grade || '').trim().toUpperCase(),
        points: Number(g.points) || 0,
        minPercentage: Number(g.minPercentage) || 0,
        maxPercentage: Number(g.maxPercentage) || 100,
        desc: String(g.desc || '').trim(),
        isPass: g.isPass !== undefined ? Boolean(g.isPass) : Number(g.points) > 0
      }));
    }

    const updatedScale = {
      ...existing,
      name: updatedName,
      system: updates.system || existing.system || '10-point',
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      status: updates.status || existing.status || 'active',
      isOfficial: updates.isOfficial !== undefined ? Boolean(updates.isOfficial) : existing.isOfficial,
      grades: updatedGrades,
      updatedAt: new Date().toISOString()
    };

    catalog.gradingScales[idx] = updatedScale;
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'GRADING_SCALE_UPDATED',
        entityType: 'grading_scale',
        entityId: updatedScale.id,
        entityName: updatedScale.name,
        details: `Updated grading scale "${updatedScale.name}" (${updatedScale.id}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return updatedScale;
  },

  setGradingScaleStatus(scaleId, status) {
    if (!['active', 'archived'].includes(status)) {
      throw new Error(`Invalid status "${status}". Must be active or archived.`);
    }
    return this.updateGradingScale(scaleId, { status });
  },

  addGradeEntry(scaleId, entryData) {
    if (!entryData || typeof entryData !== 'object') {
      throw new Error('Grade entry details are required.');
    }

    const scale = this.getGradingScale(scaleId);
    if (!scale) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    const symbol = String(entryData.grade || '').trim().toUpperCase();
    if (!symbol) {
      throw new Error('Grade symbol is required (e.g. "A+").');
    }

    const proposedGrades = [
      ...scale.grades,
      {
        grade: symbol,
        points: Number(entryData.points) || 0,
        minPercentage: Number(entryData.minPercentage) || 0,
        maxPercentage: Number(entryData.maxPercentage) || 100,
        desc: String(entryData.desc || '').trim(),
        isPass: entryData.isPass !== undefined ? Boolean(entryData.isPass) : Number(entryData.points) > 0
      }
    ];

    const validation = this.validateGradeScale(proposedGrades, { checkCoverage: false });
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    return this.updateGradingScale(scaleId, { grades: proposedGrades });
  },

  updateGradeEntry(scaleId, gradeSymbol, updates) {
    const scale = this.getGradingScale(scaleId);
    if (!scale) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    const symbolClean = String(gradeSymbol || '').trim().toUpperCase();
    const entryIdx = scale.grades.findIndex((g) => g.grade.toUpperCase() === symbolClean);
    if (entryIdx === -1) {
      throw new Error(`Grade symbol "${gradeSymbol}" not found in scale "${scale.name}".`);
    }

    const proposedGrades = scale.grades.map((g, idx) => {
      if (idx !== entryIdx) return g;
      return {
        ...g,
        grade: updates.grade ? String(updates.grade).trim().toUpperCase() : g.grade,
        points: updates.points !== undefined ? Number(updates.points) : g.points,
        minPercentage: updates.minPercentage !== undefined ? Number(updates.minPercentage) : g.minPercentage,
        maxPercentage: updates.maxPercentage !== undefined ? Number(updates.maxPercentage) : g.maxPercentage,
        desc: updates.desc !== undefined ? String(updates.desc).trim() : g.desc,
        isPass: updates.isPass !== undefined ? Boolean(updates.isPass) : g.isPass
      };
    });

    const validation = this.validateGradeScale(proposedGrades, { checkCoverage: false });
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    return this.updateGradingScale(scaleId, { grades: proposedGrades });
  },

  deleteGradeEntry(scaleId, gradeSymbol) {
    const scale = this.getGradingScale(scaleId);
    if (!scale) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    if (scale.grades.length <= 1) {
      throw new Error('Cannot delete the last remaining grade tier. A scale must have at least one grade.');
    }

    const symbolClean = String(gradeSymbol || '').trim().toUpperCase();
    const filteredGrades = scale.grades.filter((g) => g.grade.toUpperCase() !== symbolClean);

    if (filteredGrades.length === scale.grades.length) {
      throw new Error(`Grade symbol "${gradeSymbol}" not found in scale "${scale.name}".`);
    }

    return this.updateGradingScale(scaleId, { grades: filteredGrades });
  },

  checkGradingScaleReferences(scaleId) {
    const idClean = String(scaleId || '').trim().toLowerCase();
    const catalog = this.getCatalog();
    const scale = this.getGradingScale(scaleId);

    const referencingRegulations = [];

    (catalog.universities || []).forEach((u) => {
      (u.courses || []).forEach((c) => {
        (c.regulations || []).forEach((r) => {
          if (
            (r.gradingScaleId && r.gradingScaleId.toLowerCase() === idClean) ||
            (!r.gradingScaleId && idClean === 'ugc-10-point')
          ) {
            referencingRegulations.push({
              universityId: u.id,
              universityShortName: u.shortName,
              courseId: c.id,
              courseShortName: c.shortName,
              regulationId: r.id,
              regulationCode: r.code,
              ruleVersion: r.ruleVersion
            });
          }
        });
      });
    });

    // Check saved student results
    let resultCount = 0;
    try {
      const allResults = safeGet(STORAGE_KEYS.RESULTS, []);
      if (Array.isArray(allResults)) {
        resultCount = allResults.filter((res) => {
          return referencingRegulations.some((ref) => ref.regulationId === res.regulationId);
        }).length;
      }
    } catch { }

    const regulationCount = referencingRegulations.length;
    const totalReferences = regulationCount + resultCount;

    const reasons = [];
    if (regulationCount > 0) {
      reasons.push(`${regulationCount} configured regulation${regulationCount === 1 ? '' : 's'}`);
    }
    if (resultCount > 0) {
      reasons.push(`${resultCount} saved student semester result snapshot${resultCount === 1 ? '' : 's'}`);
    }

    const scaleName = scale ? scale.name : scaleId;
    const reason = totalReferences > 0
      ? `Cannot permanently delete grading scale "${scaleName}": It is referenced by ${reasons.join(', ')}. Please Archive this scale instead to protect historical calculation accuracy.`
      : null;

    return {
      canDelete: totalReferences === 0,
      hasReferences: totalReferences > 0,
      regulationCount,
      resultCount,
      totalReferences,
      regulations: referencingRegulations,
      referencingRegulations,
      reasons,
      reason
    };
  },

  archiveGradingScale(scaleId) {
    const updated = this.setGradingScaleStatus(scaleId, 'archived');
    try {
      auditHistoryService.recordEvent({
        action: 'GRADING_SCALE_ARCHIVED',
        entityType: 'grading_scale',
        entityId: updated.id,
        entityName: updated.name,
        details: `Archived grading scale "${updated.name}" (${updated.id}). Existing regulations and historical transcripts remain intact.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }
    return updated;
  },

  deleteGradingScale(scaleId) {
    const refCheck = this.checkGradingScaleReferences(scaleId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const catalog = this.getCatalog();
    const idClean = String(scaleId || '').trim().toLowerCase();
    const idx = (catalog.gradingScales || []).findIndex((s) => s.id.toLowerCase() === idClean);
    if (idx === -1) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    const deleted = catalog.gradingScales.splice(idx, 1)[0];
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'GRADING_SCALE_DELETED',
        entityType: 'grading_scale',
        entityId: deleted.id,
        entityName: deleted.name,
        details: `Permanently deleted unreferenced grading scale "${deleted.name}" (${deleted.id}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return deleted;
  },

  assignGradingScaleToRegulation(univId, courseId, regId, scaleId, options = {}) {
    const scale = this.getGradingScale(scaleId);
    if (!scale) {
      throw new Error(`Grading scale with ID "${scaleId}" does not exist.`);
    }

    if (options.publishNewVersion) {
      return this.publishNewRegulationVersion(univId, courseId, regId, {
        gradingScaleId: scale.id,
        gradingSystem: scale.system || '10-point',
        gradeScale: [...scale.grades],
        ruleVersion: options.ruleVersion || `${scale.id.toUpperCase()}_VERSIONED`
      });
    }

    const catalog = this.getCatalog();
    const univ = catalog.universities.find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = univ.courses?.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist.`);

    const reg = course.regulations?.find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist.`);

    reg.gradingScaleId = scale.id;
    reg.gradingSystem = scale.system || '10-point';
    reg.gradeScale = [...scale.grades];

    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'REGULATION_GRADING_UPDATED',
        entityType: 'grading_scale',
        entityId: scale.id,
        entityName: scale.name,
        details: `Assigned grading scale "${scale.name}" to regulation ${reg.code} (${course.shortName}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return reg;
  },

  publishNewRegulationVersion(univId, courseId, regId, versionData = {}) {
    const catalog = this.getCatalog();
    const univ = (catalog.universities || []).find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = (univ.courses || []).find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist.`);

    const reg = (course.regulations || []).find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist.`);

    const newVersionCode = (versionData.ruleVersion || `${reg.code}_V${(course.regulations?.length || 1) + 1}`).trim();
    const newRegId = `${course.id}-${newVersionCode.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    // Create a new immutable regulation version cloning current regulation with version updates
    const newRegulation = {
      ...JSON.parse(JSON.stringify(reg)),
      id: newRegId,
      code: newVersionCode,
      name: versionData.name || `${reg.name} (${newVersionCode})`,
      ruleVersion: newVersionCode,
      verificationStatus: 'verified',
      isOfficial: reg.isOfficial !== undefined ? reg.isOfficial : true,
      gradingScaleId: versionData.gradingScaleId || reg.gradingScaleId,
      gradingSystem: versionData.gradingSystem || reg.gradingSystem,
      gradeScale: versionData.gradeScale ? [...versionData.gradeScale] : (reg.gradeScale ? [...reg.gradeScale] : []),
      calculationRuleId: versionData.calculationRuleId || reg.calculationRuleId,
      calculationRule: versionData.calculationRule || reg.calculationRule,
      percentageFormula: versionData.percentageFormula || versionData.calculationRule?.percentageFormula || reg.percentageFormula,
      createdAt: new Date().toISOString()
    };

    course.regulations.push(newRegulation);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'REGULATION_VERSION_PUBLISHED',
        entityType: 'regulation',
        entityId: newRegulation.id,
        entityName: newRegulation.name,
        details: `Published new immutable regulation version "${newRegulation.name}" (${newRegulation.code}) for course ${course.name}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newRegulation;
  },

  // =========================================================================
  // CALCULATION RULES MANAGEMENT (Phase 2E)
  // =========================================================================

  validateCalculationRule(ruleData, options = {}) {
    const errors = [];
    const warnings = [];

    if (!ruleData || typeof ruleData !== 'object') {
      return { isValid: false, errors: ['Calculation rule data must be an object.'], warnings };
    }

    // Name
    const name = String(ruleData.name || '').trim();
    if (!name || name.length < 3) {
      errors.push('Calculation rule name is required and must be at least 3 characters.');
    }

    // ID
    const rawId = String(ruleData.id || name).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!rawId || rawId.length < 2) {
      errors.push('Calculation rule ID must be at least 2 characters.');
    }

    // Rule Type
    const validTypes = ['percentage', 'sgpa', 'cgpa', 'composite', 'gpa'];
    const ruleType = ruleData.ruleType || 'percentage';
    if (!validTypes.includes(ruleType)) {
      errors.push(`Invalid rule type "${ruleType}". Supported types are: ${validTypes.join(', ')}.`);
    }

    // Decimal Precision
    const precision = ruleData.decimalPrecision !== undefined ? Number(ruleData.decimalPrecision) : 2;
    if (isNaN(precision) || !Number.isInteger(precision) || precision < 0 || precision > 4) {
      errors.push('Decimal precision must be an integer between 0 and 4.');
    }

    // Rounding Mode
    const validModes = ['round', 'floor', 'ceil', 'truncate'];
    const roundingMode = ruleData.roundingMode || 'round';
    if (!validModes.includes(roundingMode)) {
      errors.push(`Invalid rounding mode "${roundingMode}". Must be one of: ${validModes.join(', ')}.`);
    }

    // Percentage Formula Security & Declarative Validation
    const formulaStr = String(ruleData.percentageFormula || '').trim();
    if (!formulaStr) {
      errors.push('Percentage conversion formula is required.');
    } else {
      // Security: Disallow arbitrary code execution, eval, script tags, statement delimiters
      const forbiddenTokens = ['eval', 'function', '=>', ';', 'window', 'document', 'process', 'require', 'import', '<', '>', '{', '}', '`'];
      const hasForbidden = forbiddenTokens.some(token => formulaStr.toLowerCase().includes(token));
      if (hasForbidden) {
        errors.push('Percentage formula contains prohibited script tokens. Only declarative linear math formulas are permitted.');
      } else {
        // Validate declarative syntax pattern
        const formulaClean = formulaStr.toLowerCase().replace(/\s+/g, '');
        const isLinear = /^\(?cgpa(?:-([0-9.]+))?\)?\*([0-9.]+)$/.test(formulaClean);
        const isStandard = ['cgpa*10', '(cgpa-0.5)*10', '(cgpa-0.75)*10', 'cgpa*9.5'].includes(formulaClean);
        if (!isLinear && !isStandard) {
          errors.push(`Unsupported percentage formula format "${formulaStr}". Must conform to linear conversion pattern, e.g. "CGPA * 10", "(CGPA - 0.5) * 10", or "(CGPA - 0.75) * 10".`);
        }
      }
    }

    // SGPA and CGPA formula validation
    const validSgpa = ['WEIGHTED_CREDIT_SUM', 'SIMPLE_AVERAGE'];
    if (ruleData.sgpaFormula && !validSgpa.includes(ruleData.sgpaFormula)) {
      errors.push(`Unsupported SGPA formula method "${ruleData.sgpaFormula}". Must be one of: ${validSgpa.join(', ')}.`);
    }

    const validCgpa = ['CUMULATIVE_WEIGHTED_CREDIT_SUM', 'SIMPLE_SGPA_AVERAGE'];
    if (ruleData.cgpaFormula && !validCgpa.includes(ruleData.cgpaFormula)) {
      errors.push(`Unsupported CGPA formula method "${ruleData.cgpaFormula}". Must be one of: ${validCgpa.join(', ')}.`);
    }

    // Applicability validation
    const catalog = this.getCatalog();
    if (ruleData.universityId) {
      const u = (catalog.universities || []).find(x => x.id === ruleData.universityId);
      if (!u) {
        errors.push(`Referenced university with ID "${ruleData.universityId}" does not exist.`);
      } else if (ruleData.courseId) {
        const c = (u.courses || []).find(x => x.id === ruleData.courseId);
        if (!c) {
          errors.push(`Referenced course with ID "${ruleData.courseId}" does not exist under university "${u.shortName || u.name}".`);
        } else if (ruleData.regulationId) {
          const r = (c.regulations || []).find(x => x.id === ruleData.regulationId);
          if (!r) {
            errors.push(`Referenced regulation with ID "${ruleData.regulationId}" does not exist under course "${c.name}".`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  getCalculationRules() {
    const catalog = this.getCatalog();
    return Array.isArray(catalog.calculationRules) ? catalog.calculationRules : [];
  },

  getCalculationRule(ruleId) {
    const rules = this.getCalculationRules();
    const cleanId = String(ruleId || '').trim().toLowerCase();
    return rules.find(r => r.id.toLowerCase() === cleanId) || null;
  },

  addCalculationRule(ruleData) {
    if (!ruleData || typeof ruleData !== 'object') {
      throw new Error('Calculation rule data is required.');
    }

    const validation = this.validateCalculationRule(ruleData);
    if (!validation.isValid) {
      throw new Error(`Invalid calculation rule: ${validation.errors.join(' ')}`);
    }

    const cleanId = String(ruleData.id || ruleData.name).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const catalog = this.getCatalog();
    if (!Array.isArray(catalog.calculationRules)) {
      catalog.calculationRules = [];
    }

    if (catalog.calculationRules.some(r => r.id.toLowerCase() === cleanId)) {
      throw new Error(`A calculation rule with identifier "${cleanId}" already exists.`);
    }

    const newRule = {
      id: cleanId,
      name: ruleData.name.trim(),
      description: (ruleData.description || '').trim(),
      ruleType: ruleData.ruleType || 'percentage',
      universityId: ruleData.universityId || null,
      courseId: ruleData.courseId || null,
      regulationId: ruleData.regulationId || null,
      sgpaFormula: ruleData.sgpaFormula || 'WEIGHTED_CREDIT_SUM',
      cgpaFormula: ruleData.cgpaFormula || 'CUMULATIVE_WEIGHTED_CREDIT_SUM',
      percentageFormula: ruleData.percentageFormula || 'CGPA * 10',
      formulaDescription: ruleData.formulaDescription || `Percentage = ${ruleData.percentageFormula || 'CGPA * 10'}`,
      decimalPrecision: Number.isInteger(ruleData.decimalPrecision) ? ruleData.decimalPrecision : 2,
      roundingMode: ruleData.roundingMode || 'round',
      minPassingGradePoints: Number(ruleData.minPassingGradePoints) || 5.0,
      includeBacklogsInCredits: Boolean(ruleData.includeBacklogsInCredits),
      status: ruleData.status || 'active',
      isOfficial: Boolean(ruleData.isOfficial),
      ruleVersion: ruleData.ruleVersion || `${cleanId.toUpperCase()}_V1`,
      createdAt: new Date().toISOString()
    };

    catalog.calculationRules.push(newRule);
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'CALCULATION_RULE_ADDED',
        entityType: 'calculation_rule',
        entityId: newRule.id,
        entityName: newRule.name,
        details: `Created new calculation rule "${newRule.name}" (${newRule.id}) with formula ${newRule.percentageFormula}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return newRule;
  },

  updateCalculationRule(ruleId, updates) {
    if (!updates || typeof updates !== 'object') {
      throw new Error('Update payload is required.');
    }

    const catalog = this.getCatalog();
    if (!Array.isArray(catalog.calculationRules)) {
      catalog.calculationRules = [];
    }

    const cleanId = String(ruleId || '').trim().toLowerCase();
    const idx = catalog.calculationRules.findIndex(r => r.id.toLowerCase() === cleanId);
    if (idx === -1) {
      throw new Error(`Calculation rule with ID "${ruleId}" does not exist.`);
    }

    const existing = catalog.calculationRules[idx];
    const candidate = {
      ...existing,
      ...updates,
      id: existing.id // ID is immutable
    };

    const validation = this.validateCalculationRule(candidate);
    if (!validation.isValid) {
      throw new Error(`Invalid calculation rule update: ${validation.errors.join(' ')}`);
    }

    const updatedRule = {
      ...candidate,
      updatedAt: new Date().toISOString()
    };

    catalog.calculationRules[idx] = updatedRule;
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'CALCULATION_RULE_UPDATED',
        entityType: 'calculation_rule',
        entityId: updatedRule.id,
        entityName: updatedRule.name,
        details: `Updated metadata and parameters for calculation rule "${updatedRule.name}" (${updatedRule.id}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return updatedRule;
  },

  setCalculationRuleStatus(ruleId, status) {
    if (!['active', 'archived'].includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: "active", "archived".`);
    }

    const catalog = this.getCatalog();
    const cleanId = String(ruleId || '').trim().toLowerCase();
    const rule = (catalog.calculationRules || []).find(r => r.id.toLowerCase() === cleanId);
    if (!rule) {
      throw new Error(`Calculation rule with ID "${ruleId}" does not exist.`);
    }

    rule.status = status;
    rule.updatedAt = new Date().toISOString();
    this.saveCatalog(catalog);

    const isArchived = status === 'archived';
    try {
      auditHistoryService.recordEvent({
        action: isArchived ? 'CALCULATION_RULE_ARCHIVED' : 'CALCULATION_RULE_STATUS_CHANGED',
        entityType: 'calculation_rule',
        entityId: rule.id,
        entityName: rule.name,
        details: isArchived
          ? `Archived calculation rule "${rule.name}" (${rule.id}). Historical calculation records remain intact.`
          : `Changed status of calculation rule "${rule.name}" to ${status}.`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return rule;
  },

  archiveCalculationRule(ruleId) {
    return this.setCalculationRuleStatus(ruleId, 'archived');
  },

  checkCalculationRuleReferences(ruleId) {
    const cleanId = String(ruleId || '').trim().toLowerCase();
    const catalog = this.getCatalog();
    const rule = this.getCalculationRule(ruleId);

    const referencingRegulations = [];

    (catalog.universities || []).forEach((u) => {
      (u.courses || []).forEach((c) => {
        (c.regulations || []).forEach((r) => {
          const directMatch = r.calculationRuleId && r.calculationRuleId.toLowerCase() === cleanId;
          const legacyMatch = (!r.calculationRuleId && cleanId === 'jntuh-r18-r22-rule' && u.id === 'jntuh') ||
            (!r.calculationRuleId && cleanId === 'ou-cbcs-standard-rule' && u.id === 'ou');

          if (directMatch || legacyMatch) {
            referencingRegulations.push({
              universityId: u.id,
              universityShortName: u.shortName,
              courseId: c.id,
              courseShortName: c.shortName,
              regulationId: r.id,
              regulationCode: r.code,
              ruleVersion: r.ruleVersion
            });
          }
        });
      });
    });

    let resultCount = 0;
    try {
      const allResults = safeGet(STORAGE_KEYS.RESULTS, []);
      if (Array.isArray(allResults)) {
        resultCount = allResults.filter((res) => {
          return referencingRegulations.some((ref) => ref.regulationId === res.regulationId);
        }).length;
      }
    } catch { }

    const regulationCount = referencingRegulations.length;
    const totalReferences = regulationCount + resultCount;

    const reasons = [];
    if (regulationCount > 0) {
      reasons.push(`${regulationCount} configured regulation${regulationCount === 1 ? '' : 's'}`);
    }
    if (resultCount > 0) {
      reasons.push(`${resultCount} saved student calculation result snapshot${resultCount === 1 ? '' : 's'}`);
    }

    const ruleName = rule ? rule.name : ruleId;
    const reason = totalReferences > 0
      ? `Cannot permanently delete calculation rule "${ruleName}": It is referenced by ${reasons.join(', ')}. Please Archive this rule instead to protect historical calculation accuracy.`
      : null;

    return {
      canDelete: totalReferences === 0,
      hasReferences: totalReferences > 0,
      regulationCount,
      resultCount,
      resultsCount: resultCount,
      totalReferences,
      regulations: referencingRegulations,
      referencingRegulations,
      reasons,
      reason
    };
  },

  deleteCalculationRule(ruleId) {
    const refCheck = this.checkCalculationRuleReferences(ruleId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.reason);
    }

    const catalog = this.getCatalog();
    const cleanId = String(ruleId || '').trim().toLowerCase();
    const idx = (catalog.calculationRules || []).findIndex(r => r.id.toLowerCase() === cleanId);
    if (idx === -1) {
      throw new Error(`Calculation rule with ID "${ruleId}" does not exist.`);
    }

    const deleted = catalog.calculationRules.splice(idx, 1)[0];
    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'CALCULATION_RULE_DELETED',
        entityType: 'calculation_rule',
        entityId: deleted.id,
        entityName: deleted.name,
        details: `Permanently deleted unreferenced calculation rule "${deleted.name}" (${deleted.id}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return deleted;
  },

  assignCalculationRuleToRegulation(univId, courseId, regId, ruleId, options = {}) {
    const rule = this.getCalculationRule(ruleId);
    if (!rule) {
      throw new Error(`Calculation rule with ID "${ruleId}" does not exist.`);
    }

    if (rule.status === 'archived' && !options.allowArchived) {
      throw new Error(`Cannot assign archived calculation rule "${rule.name}". Please activate the rule first.`);
    }

    if (options.publishNewVersion) {
      return this.publishNewRegulationVersion(univId, courseId, regId, {
        calculationRuleId: rule.id,
        calculationRule: {
          sgpaFormula: rule.sgpaFormula,
          cgpaFormula: rule.cgpaFormula,
          percentageFormula: rule.percentageFormula,
          formulaDescription: rule.formulaDescription
        },
        ruleVersion: options.ruleVersion || `${rule.id.toUpperCase()}_VERSIONED`
      });
    }

    const catalog = this.getCatalog();
    const univ = (catalog.universities || []).find((u) => u.id === univId);
    if (!univ) throw new Error(`University with ID "${univId}" does not exist.`);

    const course = (univ.courses || []).find((c) => c.id === courseId);
    if (!course) throw new Error(`Course with ID "${courseId}" does not exist.`);

    const reg = (course.regulations || []).find((r) => r.id === regId);
    if (!reg) throw new Error(`Regulation with ID "${regId}" does not exist.`);

    reg.calculationRuleId = rule.id;
    reg.percentageFormula = rule.percentageFormula;
    reg.calculationRule = {
      sgpaFormula: rule.sgpaFormula,
      cgpaFormula: rule.cgpaFormula,
      percentageFormula: rule.percentageFormula,
      formulaDescription: rule.formulaDescription
    };

    this.saveCatalog(catalog);

    try {
      auditHistoryService.recordEvent({
        action: 'REGULATION_RULE_ASSIGNED',
        entityType: 'calculation_rule',
        entityId: rule.id,
        entityName: rule.name,
        details: `Assigned calculation rule "${rule.name}" (${rule.percentageFormula}) to regulation ${reg.code} (${course.shortName}).`,
        actor: 'Administrator'
      });
    } catch (e) {
      console.warn('Audit record warning:', e);
    }

    return reg;
  },

  resetToDefaults() {
    const fresh = { ...DEFAULT_CATALOG, catalogVersion: CATALOG_SCHEMA_VERSION };
    safeSet(STORAGE_KEY_CATALOG, fresh);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rp_catalog_updated', { detail: fresh }));
      window.dispatchEvent(new Event('storage'));
    }
    return fresh;
  }
};

// Auto-initialize on import
academicCatalogService.initialize();
