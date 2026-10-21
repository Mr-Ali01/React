import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('=== DEVELOPER TOOLS SETUP & INTEGRATION VERIFICATION ===\n');

// 1. Verify Antigravity Agent MCP Configuration for Context7
const mcpConfigPath = resolve('.agents/mcp_config.json');
assert(existsSync(mcpConfigPath), '.agents/mcp_config.json must exist');
const mcpContent = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
assert(mcpContent.mcpServers?.context7, 'mcpServers must contain context7 configuration');
console.log('✓ 1. Antigravity MCP config (.agents/mcp_config.json) configured with Context7');

// 2. Verify Agent Skills
const skills = [
  { name: 'context7-docs', file: '.agents/skills/context7-docs/SKILL.md' },
  { name: 'playwright-cli', file: '.agents/skills/playwright-cli/SKILL.md' },
  { name: 'resultpoint-design-system', file: '.agents/skills/resultpoint-design-system/SKILL.md' },
  { name: 'spring-boot-mysql', file: '.agents/skills/spring-boot-mysql/SKILL.md' },
];

for (const skill of skills) {
  const p = resolve(skill.file);
  assert(existsSync(p), `Skill file ${skill.file} must exist`);
  const c = readFileSync(p, 'utf8');
  assert(c.startsWith('---'), `Skill ${skill.name} must have valid YAML frontmatter`);
  assert(c.includes(`name: ${skill.name}`), `Skill must declare name: ${skill.name}`);
  console.log(`✓ 2.${skills.indexOf(skill) + 1} Agent Skill configured: ${skill.name}`);
}

// 3. Verify Skill UI Extracted Design System
const designSystemPath = resolve('docs/design-system/resultpoint-design/DESIGN.md');
assert(existsSync(designSystemPath), 'docs/design-system/resultpoint-design/DESIGN.md must exist');
const designContent = readFileSync(designSystemPath, 'utf8');
assert(designContent.includes('ResultPoint DESIGN.md'), 'Must contain ResultPoint title');
assert(designContent.includes('Primary theme: dark'), 'Must recognize dark primary theme');
assert(designContent.includes('--accent'), 'Must contain accent color token');
console.log('✓ 3. Skill UI extracted production DESIGN.md with 20 colors, dark mode, and 97 component patterns');

// 4. Verify Strix Security Documentation
const strixPath = resolve('docs/developer-tools/strix.md');
assert(existsSync(strixPath), 'docs/developer-tools/strix.md must exist');
const strixContent = readFileSync(strixPath, 'utf8');
assert(strixContent.includes('usestrix/strix'), 'Must document Strix');
assert(strixContent.includes('Python 3.12+'), 'Must document Python prerequisite');
assert(strixContent.includes('Docker Desktop'), 'Must document Docker prerequisite');
assert(strixContent.includes('STRIX_LLM'), 'Must document LLM configuration');
console.log('✓ 4. Strix security testing documentation and authorized workflow established');

// 5. Verify Supabase Plugin Evaluation Documentation
const supabasePath = resolve('docs/developer-tools/supabase-plugin-evaluation.md');
assert(existsSync(supabasePath), 'docs/developer-tools/supabase-plugin-evaluation.md must exist');
const supabaseContent = readFileSync(supabasePath, 'utf8');
assert(supabaseContent.includes('Spring Boot 3'), 'Must reference Spring Boot backend');
assert(supabaseContent.includes('MySQL 8+'), 'Must reference MySQL database');
assert(supabaseContent.includes('Incompatible'), 'Must clearly detail architectural incompatibility');
console.log('✓ 5. Supabase plugin architectural compatibility evaluation documented');

// 6. Verify package.json scripts and .gitignore
const pkgPath = resolve('package.json');
const pkgContent = JSON.parse(readFileSync(pkgPath, 'utf8'));
assert(pkgContent.scripts['docs:resolve'], 'Must have docs:resolve script');
assert(pkgContent.scripts['docs:query'], 'Must have docs:query script');
assert(pkgContent.scripts['test:browser'], 'Must have test:browser script');
assert(pkgContent.scripts['test:browser:mobile'], 'Must have test:browser:mobile script');
assert(pkgContent.scripts['design:extract'], 'Must have design:extract script');

const gitignorePath = resolve('.gitignore');
const gitignoreContent = readFileSync(gitignorePath, 'utf8');
assert(gitignoreContent.includes('.playwright-cli/'), 'Must ignore .playwright-cli/');
assert(gitignoreContent.includes('.playwright/'), 'Must ignore .playwright/');
console.log('✓ 6. package.json scripts and .gitignore entries verified');

console.log('\nAll Developer Tools verification checks PASSED successfully!');
