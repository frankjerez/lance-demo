# OASIS State Coordination System

## Overview
Comprehensive localStorage persistence system that coordinates all assessment state across components.

## State Services

### 1. **OasisStateService** (Central Coordinator)
**File**: `src/app/services/oasis-state.service.ts`

**Manages**:
- Form field values (`formFieldValues`)
- Items accepted count (`itemsAccepted`)
- Available documents (`documents`)
- Analyzer alert states (`alerts`)

**localStorage Keys**:
- `lance-oasis-form-state-p1` - Form data and progress
- `lance-available-documents` - Available documents
- `lance-analyzer-alert-states` - Alert status (new/reviewed/dismissed)

### 2. **RecommendationStateService**
**File**: `src/app/services/recommendation-state.service.ts`

**Manages**:
- AI recommendation accept/reject status
- Timestamps
- Rejection reasons

**localStorage Key**:
- `lance-recommendation-states`

### 3. **PaymentStateService**
**File**: `src/app/services/payment-state.service.ts`

**Manages**:
- Total payment amount
- Comorbidity adjustments
- Last updated timestamp

**localStorage Key**:
- `lance-payment-state`

### 4. **DocumentStateService**
**File**: `src/app/services/document-state.service.ts`

**Manages**:
- Document upload tracking
- Upload timestamps
- Filenames

**localStorage Key**:
- `lance-document-uploads`

## Data Flow & Recalculation Chain

```
┌──────────────────────┐
│  Document Upload     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ DocumentStateService │
│  + OasisStateService │──────┐
│  (availableDocs)     │      │
└──────────────────────┘      │
                              │
                    ┌─────────▼────────────┐
                    │ Filter               │
                    │ Recommendations &    │
                    │ Alerts               │
                    └─────────┬────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
           ▼                                     ▼
┌──────────────────────┐            ┌──────────────────────┐
│ Accept/Reject        │            │ Analyzer Alert       │
│ Recommendation       │            │ Status Change        │
└──────────┬───────────┘            └──────────┬───────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────┐            ┌──────────────────────┐
│RecommendationService │            │  OasisStateService   │
└──────────┬───────────┘            │  (alertStates)       │
           │                        └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Populate Form Field  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  OasisStateService   │
│  (formFieldValues)   │
└──────────┬───────────┘
           │
           ├────────────────────┐
           │                    │
           ▼                    ▼
┌──────────────────────┐  ┌────────────────┐
│ Update Items Count   │  │ Payment Update │
│  + Progress %        │  │                │
└──────────────────────┘  └────────┬───────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ PaymentService │
                          └────────────────┘
```

## Component Integration

### oasis-john Component

**Uses**:
- OasisStateService (form, documents, alerts, progress)
- RecommendationStateService (recommendation status)
- PaymentStateService (payment calculations)
- DocumentStateService (upload tracking)

**Responsibilities**:
1. Load all state on init
2. Coordinate updates across services
3. Trigger recalculations when dependencies change
4. Sync form field changes to OasisStateService via oasis-form component
5. Update alert status when user reviews/dismisses
6. Ensure payment updates propagate

### oasis-form Component

**Uses**:
- OasisStateService (form field values)

**Responsibilities**:
1. Restore form field values from OasisStateService on init
2. Persist form field values when populated via `populateField()`
3. Support both single-value fields and multi-diagnosis containers
4. Maintain visual state (styling, animations) consistent with data state

### patient-summary Component

**Uses**:
- PaymentStateService (display current payment)

**Responsibilities**:
1. Display current payment from service
2. React to payment changes from oasis-john

## Persistence Behavior

### On Page Load
1. All services load from localStorage in constructor
2. OasisStateService restores: form fields, documents, alerts
3. RecommendationStateService restores: recommendation states
4. PaymentStateService restores: payment calculations
5. DocumentStateService restores: upload tracking

### On User Actions

#### Accept Recommendation
1. Update RecommendationStateService → localStorage
2. Populate form field → OasisStateService.updateFormField() → localStorage
3. Increment items count → OasisStateService.updateItemsAccepted() → localStorage
4. If PDGM-impacting → PaymentStateService.updatePayment() → localStorage
5. Recompute analyzer alerts (hide if linked recommendation accepted)

#### Reject Recommendation
1. Update RecommendationStateService → localStorage
2. Recompute analyzer alerts (show if linked recommendation rejected)

#### Upload Document
1. Update DocumentStateService → localStorage
2. Add to OasisStateService.addAvailableDocument() → localStorage
3. Refilter recommendations and alerts
4. Display newly available recommendations

#### Review/Dismiss Alert
1. Update OasisStateService.updateAlertStatus() → localStorage
2. Update UI to reflect status

#### Fill Form Field (via AI Recommendation or Manual)
1. oasis-form.populateField() updates DOM and visual state
2. Calls OasisStateService.updateFormField() → localStorage (automatic)
3. oasis-john increments items count via OasisStateService.updateItemsAccepted()
4. Progress bar updates automatically via computed property

### On Page Refresh
- All state persists
- Form fields pre-populated
- Recommendations show correct accept/reject status
- Alerts show correct reviewed/dismissed status
- Payment shows current value
- Progress bar shows current percentage

## Reset Behavior

### Reset Button
- Clears OasisStateService form fields and alerts
- Resets OasisStateService available documents to ['referral-doc'] only
- Clears DocumentStateService (uploaded docs removed - users must re-upload)
- Clears RecommendationStateService (all recommendations → pending)
- Resets PaymentStateService to baseline ($2,875.50)
- Restores items count to initial pre-filled value (captured on page load)
- Refilters recommendations/alerts based on only referral-doc being available

## Storage Keys Summary

| Key | Service | Purpose |
|-----|---------|---------|
| `lance-oasis-form-state-p1` | OasisStateService | Form fields + progress |
| `lance-available-documents` | OasisStateService | Available documents |
| `lance-analyzer-alert-states` | OasisStateService | Alert status |
| `lance-recommendation-states` | RecommendationStateService | Recommendation status |
| `lance-payment-state` | PaymentStateService | Payment calculations |
| `lance-document-uploads` | DocumentStateService | Upload tracking |
| `oasis-items-accepted-p1` | *(deprecated)* | Old items count (can remove) |

## Benefits

1. ✅ **Full persistence** - No data loss on refresh
2. ✅ **Coordinated state** - All services work together
3. ✅ **Automatic sync** - Changes propagate automatically
4. ✅ **Type-safe** - TypeScript interfaces for all state
5. ✅ **Error handling** - Try/catch on all localStorage operations
6. ✅ **Debugging** - Console logs with 📦 emoji on load
