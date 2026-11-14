/* Transform the browser-transpiled JSX files with the same Babel build the page loads,
   so a syntax error fails here instead of blanking the app in the browser. */
const fs = require('fs');
const path = require('path');
const Babel = require('/tmp/fe_checks/babel.cjs');

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [];

let bad = 0;
for (const file of files) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  try {
    Babel.transform(code, { presets: ['react'], filename: file });
    console.log(`ok   ${file}`);
  } catch (error) {
    bad += 1;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
process.exit(bad ? 1 : 0);
