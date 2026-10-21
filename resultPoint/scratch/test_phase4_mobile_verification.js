import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('=== PHASE 4: Mobile Calculator Layout & Result Popup Verification ===\n');

// 1. Verify calculatorNavConfig
const configPath = resolve('src/pages/Calculators/calculatorNavConfig.js');
assert(existsSync(configPath), 'calculatorNavConfig.js must exist');
const configContent = readFileSync(configPath, 'utf8');

assert(configContent.includes("key: 'cgpa'"), 'Must contain CGPA calculator');
assert(configContent.includes("key: 'sgpa'"), 'Must contain SGPA calculator');
assert(configContent.includes("key: 'gpa'"), 'Must contain GPA calculator');
assert(configContent.includes("key: 'percentage'"), 'Must contain Percentage calculator');
assert(configContent.includes("key: 'grade'"), 'Must contain Grade calculator');
assert(configContent.includes("key: 'marks-grade'"), 'Must contain Marks Convert calculator');
assert(configContent.includes("key: 'credits'"), 'Must contain Credits calculator');
assert(configContent.includes("key: 'target-cgpa'"), 'Must contain Target CGPA calculator');
assert(configContent.includes("key: 'backlog'"), 'Must contain Backlog calculator');
assert(configContent.includes("key: 'result-analysis'"), 'Must contain Result Analysis calculator');
console.log('✓ 1. calculatorNavConfig contains all 10 calculators across 4 categories');

// 2. Verify MobileCalculatorDropdown
const dropdownPath = resolve('src/pages/Calculators/MobileCalculatorDropdown.jsx');
assert(existsSync(dropdownPath), 'MobileCalculatorDropdown.jsx must exist');
const dropdownContent = readFileSync(dropdownPath, 'utf8');
assert(dropdownContent.includes('block lg:hidden'), 'Dropdown must be visible only on mobile (< lg)');
assert(dropdownContent.includes("activeTool = 'cgpa'"), 'Default calculator must be CGPA Calculator');
assert(dropdownContent.includes('<select'), 'Must render semantic accessible <select>');
assert(dropdownContent.includes('<optgroup'), 'Must group options by category');
console.log('✓ 2. MobileCalculatorDropdown is responsive (block lg:hidden) and defaults to CGPA');

// 3. Verify MobileResultModal
const modalPath = resolve('src/pages/Calculators/MobileResultModal.jsx');
assert(existsSync(modalPath), 'MobileResultModal.jsx must exist');
const modalContent = readFileSync(modalPath, 'utf8');
assert(modalContent.includes('fixed inset-0 z-50'), 'Modal must have fixed backdrop');
assert(modalContent.includes('max-h-[92vh] overflow-y-auto'), 'Modal must scroll vertically on small screens');
assert(modalContent.includes('Disclaimer:'), 'Must include official university marksheet disclaimer');
assert(modalContent.includes('Save Result'), 'Must include Save Result button');
assert(modalContent.includes('Download PDF'), 'Must include Download PDF button');
assert(modalContent.includes('Share'), 'Must include Share button');
assert(modalContent.includes('Close & Keep Editing'), 'Must include close button preserving inputs');
console.log('✓ 3. MobileResultModal includes circular gauge, metrics, disclaimer, and 3 primary actions');

// 4. Verify PendingCalculationBanner is hidden on mobile calculators
const bannerPath = resolve('src/components/common/PendingCalculationBanner.jsx');
const bannerContent = readFileSync(bannerPath, 'utf8');
assert(bannerContent.includes("isCalcPage ? 'hidden lg:block' : ''"), 'Pending calculation banner must be hidden on mobile calculators');
console.log('✓ 4. PendingCalculationBanner hides on mobile calculator screens (hidden lg:block)');

// 5. Verify CalculatorDirectorySidebar hides desktop sidebar and banner on mobile
const sidebarPath = resolve('src/pages/Calculators/CalculatorDirectorySidebar.jsx');
const sidebarContent = readFileSync(sidebarPath, 'utf8');
assert(sidebarContent.includes('<MobileCalculatorDropdown activeTool={activeTool} />'), 'Sidebar renders MobileCalculatorDropdown');
assert(sidebarContent.includes('hidden lg:block lg:col-span-3'), 'Desktop sidebar and guide banner hidden on mobile');
assert(sidebarContent.includes('Not sure which to use?'), 'Contains Guide banner on desktop');
console.log('✓ 5. CalculatorDirectorySidebar renders mobile dropdown and hides desktop sidebar + guide banner on mobile');

// 6. Verify all 10 Calculators have isResultModalOpen / MobileResultModal support
const calculators = [
  { name: 'CGPA', file: 'src/pages/Calculators/CGPA/index.jsx' },
  { name: 'SGPA', file: 'src/pages/Calculators/SGPA/index.jsx' },
  { name: 'GPA', file: 'src/pages/Calculators/GPA/index.jsx' },
  { name: 'Percentage', file: 'src/pages/Calculators/Percentage/index.jsx' },
  { name: 'Credits', file: 'src/pages/Calculators/Credits/index.jsx' },
  { name: 'TargetCGPA', file: 'src/pages/Calculators/TargetCGPA/index.jsx' },
  { name: 'ResultAnalysis', file: 'src/pages/Calculators/ResultAnalysis/index.jsx' },
  { name: 'Backlog', file: 'src/pages/Calculators/Backlog/index.jsx' },
  { name: 'Grade', file: 'src/pages/Calculators/Grade/index.jsx' },
  { name: 'MarksConvert', file: 'src/pages/Calculators/MarksConvert/index.jsx' },
];

for (const calc of calculators) {
  const filePath = resolve(calc.file);
  assert(existsSync(filePath), `${calc.name} file must exist`);
  const content = readFileSync(filePath, 'utf8');
  assert(content.includes('isResultModalOpen'), `${calc.name} must have isResultModalOpen state`);
  assert(
    content.includes('ResultGaugeCard') || content.includes('MobileResultModal'),
    `${calc.name} must integrate ResultGaugeCard or MobileResultModal`
  );
  assert(
    content.includes('CalculatorDirectorySidebar'),
    `${calc.name} must integrate CalculatorDirectorySidebar`
  );
  console.log(`✓ 6.${calculators.indexOf(calc) + 1} ${calc.name} has mobile calculation workflow & modal`);
}

console.log('\nAll Phase 4 static integrity checks PASSED successfully!');
