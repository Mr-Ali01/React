export const UNIVERSITY_DATA = {
  jntuh: {
    name: 'JNTU Hyderabad',
    courses: {
      'btech-cse': {
        name: 'B.Tech - Computer Science',
        regulations: {
          r18: {
            name: 'R18',
            scale: 10,
            grades: [
              { grade: 'S', points: 10, desc: 'Outstanding' },
              { grade: 'A+', points: 9, desc: 'Excellent' },
              { grade: 'A', points: 8, desc: 'Very Good' },
              { grade: 'B+', points: 7, desc: 'Good' },
              { grade: 'B', points: 6, desc: 'Above Average' },
              { grade: 'C', points: 5, desc: 'Average' },
              { grade: 'D', points: 4, desc: 'Pass' },
              { grade: 'F', points: 0, desc: 'Fail' }
            ],
            semesters: [
              { id: 'sem1', name: 'Semester 1' },
              { id: 'sem2', name: 'Semester 2' },
              { id: 'sem3', name: 'Semester 3' },
              { id: 'sem4', name: 'Semester 4', default: true },
              { id: 'sem5', name: 'Semester 5' },
              { id: 'sem6', name: 'Semester 6' },
              { id: 'sem7', name: 'Semester 7' },
              { id: 'sem8', name: 'Semester 8' }
            ],
            defaultSubjects: [
              { id: '1', name: 'Data Structures', credits: 4, grade: 'A' },
              { id: '2', name: 'Database Management Systems', credits: 4, grade: 'A+' },
              { id: '3', name: 'Operating Systems', credits: 4, grade: 'B+' },
              { id: '4', name: 'Computer Networks', credits: 3, grade: 'A' },
              { id: '5', name: 'Software Engineering', credits: 3, grade: 'B+' },
              { id: '6', name: 'Mathematics-IV', credits: 4, grade: 'A' }
            ]
          },
          r22: {
            name: 'R22',
            scale: 10,
            grades: [
              { grade: 'O', points: 10, desc: 'Outstanding' },
              { grade: 'A+', points: 9, desc: 'Excellent' },
              { grade: 'A', points: 8, desc: 'Very Good' },
              { grade: 'B+', points: 7, desc: 'Good' },
              { grade: 'B', points: 6, desc: 'Above Average' },
              { grade: 'C', points: 5, desc: 'Average' },
              { grade: 'F', points: 0, desc: 'Fail' }
            ],
            semesters: [
              { id: 'sem1', name: 'Semester 1' },
              { id: 'sem2', name: 'Semester 2' },
              { id: 'sem3', name: 'Semester 3' },
              { id: 'sem4', name: 'Semester 4', default: true }
            ],
            defaultSubjects: [
              { id: '1', name: 'Algorithms & Data Structures', credits: 4, grade: 'A+' },
              { id: '2', name: 'Computer Architecture', credits: 3, grade: 'A' },
              { id: '3', name: 'Operating Systems', credits: 4, grade: 'A' },
              { id: '4', name: 'Discrete Mathematics', credits: 3, grade: 'B+' }
            ]
          }
        }
      },
      'btech-ece': {
        name: 'B.Tech - Electronics & Comm',
        regulations: {
          r18: {
            name: 'R18',
            scale: 10,
            grades: [
              { grade: 'S', points: 10, desc: 'Outstanding' },
              { grade: 'A+', points: 9, desc: 'Excellent' },
              { grade: 'A', points: 8, desc: 'Very Good' },
              { grade: 'B+', points: 7, desc: 'Good' },
              { grade: 'B', points: 6, desc: 'Above Average' },
              { grade: 'C', points: 5, desc: 'Average' },
              { grade: 'D', points: 4, desc: 'Pass' },
              { grade: 'F', points: 0, desc: 'Fail' }
            ],
            semesters: [
              { id: 'sem1', name: 'Semester 1' },
              { id: 'sem2', name: 'Semester 2' },
              { id: 'sem3', name: 'Semester 3' },
              { id: 'sem4', name: 'Semester 4', default: true }
            ],
            defaultSubjects: [
              { id: '1', name: 'Signals & Systems', credits: 4, grade: 'A' },
              { id: '2', name: 'Analog Circuits', credits: 4, grade: 'B+' },
              { id: '3', name: 'Electromagnetic Fields', credits: 3, grade: 'A' },
              { id: '4', name: 'Digital System Design', credits: 4, grade: 'A+' }
            ]
          }
        }
      }
    }
  },
  anna: {
    name: 'Anna University',
    courses: {
      'btech-it': {
        name: 'B.Tech - Information Tech',
        regulations: {
          r21: {
            name: 'Regulation 2021',
            scale: 10,
            grades: [
              { grade: 'O', points: 10, desc: 'Outstanding' },
              { grade: 'A+', points: 9, desc: 'Excellent' },
              { grade: 'A', points: 8, desc: 'Very Good' },
              { grade: 'B+', points: 7, desc: 'Good' },
              { grade: 'B', points: 6, desc: 'Average' },
              { grade: 'RA', points: 0, desc: 'Re-appear' }
            ],
            semesters: [
              { id: 'sem1', name: 'Semester 1' },
              { id: 'sem2', name: 'Semester 2' },
              { id: 'sem3', name: 'Semester 3' },
              { id: 'sem4', name: 'Semester 4', default: true }
            ],
            defaultSubjects: [
              { id: '1', name: 'Data Structures & Algorithms', credits: 3, grade: 'O' },
              { id: '2', name: 'Computer Networks', credits: 3, grade: 'A+' },
              { id: '3', name: 'Database Management', credits: 3, grade: 'A' }
            ]
          }
        }
      }
    }
  }
};