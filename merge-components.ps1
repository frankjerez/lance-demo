# PowerShell script to merge document and form content into refactored template

Write-Host "🔄 Merging oasis-john components..." -ForegroundColor Cyan

$originalHtml = Get-Content "src\app\oasis-john\oasis-john.html" -Raw
$refactoredHtml = Get-Content "src\app\oasis-john\oasis-john-refactored.html" -Raw

# Extract document content (lines 406 to around 868)
Write-Host "📄 Extracting document viewer content..." -ForegroundColor Yellow

$docStart = $originalHtml.IndexOf('<!-- Discharge Summary - Page 1 -->')
$docEnd = $originalHtml.IndexOf('<!-- RIGHT COLUMN (OASIS Form) -->')

if ($docStart -gt 0 -and $docEnd -gt $docStart) {
    $documentContent = $originalHtml.Substring($docStart, $docEnd - $docStart).Trim()
    Write-Host "  ✅ Extracted $($documentContent.Length) characters" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to extract document content" -ForegroundColor Red
    exit 1
}

# Extract form content (from line 870 to before closing main)
Write-Host "📋 Extracting form content..." -ForegroundColor Yellow

$formStart = $originalHtml.IndexOf('<section class="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">')
$formEnd = $originalHtml.IndexOf('</section>', $formStart) + '</section>'.Length

if ($formStart -gt 0 -and $formEnd -gt $formStart) {
    $formSection = $originalHtml.Substring($formStart, $formEnd - $formStart)

    # Extract just the inner content (remove the outer section tag)
    $innerStart = $formSection.IndexOf('<div class="overflow-y-auto')
    $innerEnd = $formSection.LastIndexOf('</div>')
    $formContent = $formSection.Substring($innerStart, $innerEnd - $innerStart + '</div>'.Length).Trim()

    Write-Host "  ✅ Extracted $($formContent.Length) characters" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to extract form content" -ForegroundColor Red
    exit 1
}

# Replace placeholders in refactored HTML
Write-Host "💉 Injecting content into refactored template..." -ForegroundColor Yellow

$completeHtml = $refactoredHtml -replace '<!-- PLACEHOLDER: Copy document sections from original template here -->', $documentContent
$completeHtml = $completeHtml -replace '<!-- PLACEHOLDER: Copy form sections from original template here -->', $formContent

# Write the complete HTML
$outputPath = "src\app\oasis-john\oasis-john-complete.html"
$completeHtml | Out-File -FilePath $outputPath -Encoding utf8 -NoNewline

Write-Host "✅ Complete HTML written to: $outputPath" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Backup original files:"
Write-Host "   Move-Item src\app\oasis-john\oasis-john.ts src\app\oasis-john\oasis-john.ts.backup"
Write-Host "   Move-Item src\app\oasis-john\oasis-john.html src\app\oasis-john\oasis-john.html.backup"
Write-Host ""
Write-Host "2. Replace with refactored files:"
Write-Host "   Move-Item src\app\oasis-john\oasis-john-refactored.ts src\app\oasis-john\oasis-john.ts -Force"
Write-Host "   Move-Item src\app\oasis-john\oasis-john-complete.html src\app\oasis-john\oasis-john.html -Force"
Write-Host ""
Write-Host "3. Test the application:"
Write-Host "   ng serve"
