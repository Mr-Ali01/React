import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing ResultPoint About Page Component & Route Registration...\n');

// 1. Verify File Existence
const aboutFilePath = 'src/pages/About/index.jsx';
assert(fs.existsSync(aboutFilePath), 'src/pages/About/index.jsx must exist');

const content = fs.readFileSync(aboutFilePath, 'utf8');

// 2. Verify Key Sections & Content
assert(content.includes('What is'), 'Must include "What is ResultPoint?"');
assert(content.includes('Why We Built'), 'Must include "Why We Built ResultPoint?"');
assert(content.includes('100K+'), 'Must include 100K+ stats');
assert(content.includes('Our Mission'), 'Must include "Our Mission"');
assert(content.includes('Our Vision'), 'Must include "Our Vision"');
assert(content.includes('Our Values'), 'Must include "Our Values"');
assert(content.includes('Arjun Mehta'), 'Must include Team member Arjun Mehta');
assert(content.includes('Priya Sharma'), 'Must include Team member Priya Sharma');
assert(content.includes('Rahul Verma'), 'Must include Team member Rahul Verma');
assert(content.includes('Sneha Reddy'), 'Must include Team member Sneha Reddy');
assert(content.includes('Join Thousands of Students Today'), 'Must include CTA banner');

// 3. Verify Lucide React Icons
assert(content.includes("from 'lucide-react'"), 'Must import icons from lucide-react');
assert(!content.includes('data-lucide'), 'Raw data-lucide attributes must be converted to React components');
assert(!content.includes('class='), 'Raw class attributes must be converted to className');

// 4. Verify Route Registration in App.jsx
const appContent = fs.readFileSync('src/App.jsx', 'utf8');
assert(appContent.includes("import About from './pages/About'"), 'App.jsx must import About component');
assert(appContent.includes('path="/about"'), 'App.jsx must define route for /about');

console.log('✔ All About Page component and routing assertions passed successfully!');
