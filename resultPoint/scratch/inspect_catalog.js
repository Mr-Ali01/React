const fs = require('fs');

// Read academicCatalogService.js directly to inspect universities and courses
const fileContent = fs.readFileSync('src/services/academicCatalogService.js', 'utf8');

// Quick evaluate of DEFAULT_CATALOG by extracting substring
const startIdx = fileContent.indexOf('const DEFAULT_CATALOG = {');
const endIdx = fileContent.indexOf('const STORAGE_KEY_CATALOG =');
const catalogStr = fileContent.substring(startIdx + 'const DEFAULT_CATALOG = '.length, endIdx).trim().replace(/;$/, '');

try {
  // Use Function to safely evaluate object literal
  const catalog = new Function('return ' + catalogStr)();
  console.log('Universities count:', catalog.universities.length);
  catalog.universities.forEach(u => {
    console.log(`Univ: ${u.id} - ${u.shortName} (${u.name}), Courses: ${u.courses.length}`);
    u.courses.forEach(c => {
      console.log(`   -> Course: ${c.id} - ${c.name} [${c.level}], Regs: ${c.regulations?.length || 0}`);
      c.regulations?.forEach(r => {
        console.log(`       Reg: ${r.id} (${r.code}), Batches: ${JSON.stringify(r.effectiveBatches)}, GradeScale: ${r.gradeScale?.map(g => g.grade).join(',')}`);
      });
    });
  });
} catch (e) {
  console.error('Error parsing:', e.message);
}
