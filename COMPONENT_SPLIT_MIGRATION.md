# OASIS-John Component Split - Migration Guide

## ✅ Components Created

The oasis-john component has been successfully split into 4 specialized child components:

### 1. **oasis-header** (`src/app/oasis-header/`)
- Patient information and eligibility check
- Payment display (PDGM)
- Analyzer alert toggle
- Action buttons (Save, Reset, Export)

### 2. **oasis-recommendations** (`src/app/oasis-recommendations/`)
- AI recommendations list
- Analyzer alerts section
- Payment optimization banner
- Recommendation selection, acceptance, and rejection

### 3. **oasis-document-viewer** (`src/app/oasis-document-viewer/`)
- Document tabs (Discharge Summary, Referral, Visit Notes)
- Document content display with evidence highlighting
- Tab switching logic

### 4. **oasis-form** (`src/app/oasis-form/`)
- OASIS assessment form display
- Progress tracking
- Summary card
- Form field population and highlighting

### 5. **oasis-john** (refactored - orchestrator)
- Coordinates all child components
- Manages shared state using Angular signals
- Handles modals (eligibility, export)
- Event orchestration between components

## 🔄 Signal-Based Architecture

The refactored component uses Angular **signals** for reactive state management:

```typescript
// Shared state managed in oasis-john parent
itemsAccepted = signal(0)
currentPayment = signal(2875.5)
showAnalyzer = signal(false)
activeDocId = signal('discharge-doc')
highlightEvidence = signal<EvidenceHighlight | null>(null)
aiRecommendations = signal<AiRecommendation[]>([...])
analyzerAlerts = signal<AnalyzerAlert[]>([])
```

## 📝 Migration Steps

### Step 1: Copy Document Content

The document viewer content (lines ~406-1427 in original `oasis-john.html`) needs to be copied into the `<app-oasis-document-viewer>` ng-content slot in `oasis-john-refactored.html`.

**What to copy:**
```html
<!-- From original oasis-john.html -->
<div id="discharge-doc" class="document-content space-y-6">
  <!-- Discharge Summary pages... -->
</div>

<div id="referral-doc" class="document-content hidden space-y-6">
  <!-- Referral document pages... -->
</div>

<div id="visit-doc" class="document-content hidden space-y-6">
  <!-- Visit note pages... -->
</div>
```

**Where to paste:**
In `oasis-john-refactored.html`, replace the comment inside `<app-oasis-document-viewer>`.

### Step 2: Copy Form Content

The OASIS form content needs to be copied into the `<app-oasis-form>` ng-content slot.

**What to copy:**
All form sections from the original template's right column, including:
- M0080 Discipline sections
- M1005 Inpatient Discharge Date
- M1011 Inpatient Diagnoses
- I8000 Primary/Secondary Diagnosis sections
- GG functional assessment sections
- All other OASIS form fields

**Where to paste:**
In `oasis-john-refactored.html`, replace the comment inside `<app-oasis-form>`.

### Step 3: Backup and Replace

```bash
# 1. Backup original files
cp src/app/oasis-john/oasis-john.ts src/app/oasis-john/oasis-john.ts.backup
cp src/app/oasis-john/oasis-john.html src/app/oasis-john/oasis-john.html.backup

# 2. Replace with refactored versions
mv src/app/oasis-john/oasis-john-refactored.ts src/app/oasis-john/oasis-john.ts
mv src/app/oasis-john/oasis-john-refactored.html src/app/oasis-john/oasis-john.html
```

### Step 4: Update Route Configuration

Ensure `app.routes.ts` imports the refactored component:

```typescript
import { OasisJohnComponent } from './oasis-john/oasis-john';
// ... rest of routes
```

### Step 5: Test the Application

```bash
ng serve
```

Navigate to `/oasisnew` and verify:
- ✅ Header displays patient info and actions
- ✅ Recommendations panel shows AI suggestions
- ✅ Document viewer displays medical documents
- ✅ OASIS form displays on the right
- ✅ Clicking recommendations highlights evidence
- ✅ Accepting recommendations populates form fields
- ✅ Payment updates when high-value diagnoses are accepted
- ✅ Save & Analyzer button triggers alerts
- ✅ Modals (eligibility, export) function correctly

## 🎯 Benefits Achieved

### Before (Monolithic Component)
- ❌ 931 lines in .ts file
- ❌ 1,641 lines in .html file
- ❌ All logic tightly coupled
- ❌ Difficult to test individual pieces
- ❌ Hard to reuse components

### After (Component Architecture)
- ✅ **oasis-header**: ~60 lines TS, ~120 lines HTML
- ✅ **oasis-recommendations**: ~100 lines TS, ~220 lines HTML
- ✅ **oasis-document-viewer**: ~100 lines TS, ~60 lines HTML
- ✅ **oasis-form**: ~80 lines TS, ~70 lines HTML
- ✅ **oasis-john** (orchestrator): ~450 lines TS, ~280 lines HTML
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Testable in isolation
- ✅ Signal-based reactive communication
- ✅ Easier to maintain and extend

## 📊 Component Communication Flow

```
User Action (e.g., click recommendation)
    ↓
oasis-recommendations emits onRecommendationSelect
    ↓
oasis-john handles event & updates signals:
  - activeDocId.set(docId)
  - highlightEvidence.set({...})
    ↓
Child components react via input signals:
  - oasis-document-viewer switches tab
  - oasis-document-viewer highlights evidence
  - oasis-form prepares for field update
```

## 🔍 Key Files

| File | Purpose |
|------|---------|
| `oasis-header/*` | Header bar with patient info and actions |
| `oasis-recommendations/*` | AI recommendations and analyzer alerts |
| `oasis-document-viewer/*` | Medical document display and evidence highlighting |
| `oasis-form/*` | OASIS form display and field management |
| `oasis-john/*` | Main orchestrator component |
| `COMPONENT_SPLIT_MIGRATION.md` | This migration guide |

## 💡 Next Steps

1. Complete Step 1 & 2 (copy content into ng-content slots)
2. Run Step 3 (backup and replace files)
3. Test thoroughly (Step 5)
4. Delete backup files once confirmed working
5. Commit changes to version control

## 🚨 Troubleshooting

### Issue: Components not rendering
- **Fix**: Check that all imports are added to the parent component's `imports` array

### Issue: Signals not updating UI
- **Fix**: Ensure you're calling signal updates with `.set()` or `.update()`, not direct assignment

### Issue: Event handlers not firing
- **Fix**: Verify output event names match between parent and child (e.g., `(onRecommendationSelect)`)

### Issue: Evidence highlighting not working
- **Fix**: Ensure `data-evidence-for` attributes are preserved in document content

## 📚 Additional Resources

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Component Communication Patterns](https://angular.dev/guide/component-interaction)
- [ng-content and Content Projection](https://angular.dev/guide/content-projection)
