/**
 * Migration script to extract document and form content from original oasis-john.html
 * and inject them into the refactored template's ng-content slots
 */

const fs = require('fs');
const path = require('path');

const originalHtmlPath = path.join(__dirname, 'src/app/oasis-john/oasis-john.html');
const refactoredHtmlPath = path.join(__dirname, 'src/app/oasis-john/oasis-john-refactored.html');
const outputHtmlPath = path.join(__dirname, 'src/app/oasis-john/oasis-john-complete.html');

console.log('📄 Reading original HTML...');
const originalHtml = fs.readFileSync(originalHtmlPath, 'utf-8');

console.log('📄 Reading refactored HTML...');
const refactoredHtml = fs.readFileSync(refactoredHtmlPath, 'utf-8');

// Extract document content (lines between document-viewer div and the next main section)
console.log('🔍 Extracting document content...');
const docViewerStart = originalHtml.indexOf('<div id="document-viewer"');
const docViewerEnd = originalHtml.indexOf('</div>\n    </main>', docViewerStart);

if (docViewerStart === -1 || docViewerEnd === -1) {
  console.error('❌ Could not find document viewer section');
  process.exit(1);
}

// Extract just the inner content of document-viewer (the three document divs)
const docViewerContent = originalHtml.substring(docViewerStart, docViewerEnd);
const docContentStart = docViewerContent.indexOf('<!-- Discharge Summary - Page 1 -->');
const documentContent = docViewerContent.substring(docContentStart);

console.log(`✅ Extracted ${documentContent.length} characters of document content`);

// Extract form content (right column after document viewer)
console.log('🔍 Extracting form content...');

// Find the form section (starts after document viewer, in the third aside)
const formAsidePattern = /<aside[\s\S]*?class="col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"[\s\S]*?<!-- Form Content -->/;
const match = originalHtml.match(formAsidePattern);

let formContent = '';
if (match) {
  const formStart = originalHtml.indexOf(match[0]);
  const formContentStart = originalHtml.indexOf('<!-- Form Content -->', formStart);
  const formEnd = originalHtml.indexOf('</aside>\n  </main>', formContentStart);

  if (formContentStart !== -1 && formEnd !== -1) {
    formContent = originalHtml.substring(formContentStart, formEnd);
    console.log(`✅ Extracted ${formContent.length} characters of form content`);
  }
} else {
  // Alternative: look for specific form sections
  const altFormStart = originalHtml.indexOf('<!-- M0080 - Discipline -->');
  if (altFormStart !== -1) {
    const altFormEnd = originalHtml.indexOf('</aside>\n  </main>', altFormStart);
    formContent = originalHtml.substring(altFormStart, altFormEnd);
    console.log(`✅ Extracted ${formContent.length} characters of form content (alternative method)`);
  }
}

if (!formContent) {
  console.warn('⚠️  Could not extract form content automatically');
  formContent = '<!-- Form content extraction failed - please copy manually -->';
}

// Inject content into refactored HTML
console.log('💉 Injecting content into refactored template...');

let completeHtml = refactoredHtml;

// Replace document viewer placeholder
const docPlaceholder = /<!-- PLACEHOLDER: Copy document sections from original template here -->/;
completeHtml = completeHtml.replace(docPlaceholder, documentContent);

// Replace form placeholder
const formPlaceholder = /<!-- PLACEHOLDER: Copy form sections from original template here -->/;
completeHtml = completeHtml.replace(formPlaceholder, formContent);

// Write the complete HTML
console.log(`💾 Writing complete HTML to ${outputHtmlPath}...`);
fs.writeFileSync(outputHtmlPath, completeHtml, 'utf-8');

console.log('✅ Migration complete!');
console.log('\n📋 Next steps:');
console.log('1. Review the generated file: oasis-john-complete.html');
console.log('2. If it looks good, replace oasis-john.html:');
console.log('   mv src/app/oasis-john/oasis-john.html src/app/oasis-john/oasis-john.html.backup');
console.log('   mv src/app/oasis-john/oasis-john-complete.html src/app/oasis-john/oasis-john.html');
console.log('3. Replace the TypeScript file:');
console.log('   mv src/app/oasis-john/oasis-john.ts src/app/oasis-john/oasis-john.ts.backup');
console.log('   mv src/app/oasis-john/oasis-john-refactored.ts src/app/oasis-john/oasis-john.ts');
console.log('4. Test with: ng serve');
