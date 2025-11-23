# OASIS-E1 Complete Assessment Items Reference
## Effective January 1, 2025

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Source:** CMS OASIS-E1 Manual (Final Version, December 9, 2024)
**Purpose:** Developer reference for implementing complete OASIS-E1 Start of Care (SOC) assessment

---

## Overview

The OASIS-E1 (Outcome and Assessment Information Set, Version E1) is the standardized assessment tool used by home health agencies to collect and report data on Medicare and Medicaid adult (non-maternity) patients receiving skilled home health services.

### Key Changes from OASIS-E to OASIS-E1 (Effective 1/1/2025)

**Items Removed:**
- M0110 - Episode Timing
- M2200 - Therapy Need
- GG0130 and GG0170 Discharge Goals (Column 2) at SOC/ROC

**Items Added:**
- O0350 - Patient's COVID-19 Vaccination is Up to Date

**Items Revised:**
- M0150 - Current Payment Sources for Home Care
- D0150 - Patient Health Questionnaire (PHQ-2 to 9)
- M2420 - Discharge Disposition
- M0102 - Date of Physician Ordered Start of Care

---

## Total Item Count for SOC Assessment

**Approximate Total:** 89 items (varies based on time point and skip logic)

---

## SECTION-BY-SECTION ITEM LISTING

---

## ADMINISTRATIVE ITEMS (M Items)

### M0010 - CMS Certification Number
**Description:** The CMS Certification Number (CCN) of the agency submitting the assessment
**Response Type:** Text input (10 characters)
**Format:** ##-#### (e.g., 55-9876)
**Required:** Yes
**Notes:** First two digits = state code

### M0014 - Branch State
**Description:** State in which the branch is located
**Response Type:** Select dropdown
**Options:** 2-character state abbreviations (AL, AK, AZ, etc.)
**Required:** Yes

### M0016 - Branch ID Number
**Description:** Unique branch identifier within the agency
**Response Type:** Text input
**Format:** Alphanumeric
**Required:** Yes (if agency has branches)

### M0018 - National Provider Identifier (NPI)
**Description:** The National Provider Identifier for the attending physician
**Response Type:** Text input (10 digits)
**Required:** Yes

### M0020 - Patient ID Number
**Description:** Agency's unique patient identifier
**Response Type:** Text input
**Format:** Alphanumeric
**Required:** Yes

### M0030 - Start of Care Date
**Description:** Date patient was admitted to home health care
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Yes
**Notes:** This is the first billable visit date

### M0032 - Resumption of Care Date
**Description:** Date patient was readmitted after inpatient stay
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Only for ROC assessments

### M0064 - Social Security Number
**Description:** Patient's Social Security Number
**Response Type:** Text input (9 digits)
**Format:** ###-##-####
**Required:** Optional (preferred for Medicare)

### M0066 - Birth Date
**Description:** Patient's date of birth
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Yes

### M0069 - Gender
**Description:** Patient's gender
**Response Type:** Select dropdown
**Options:**
- 1 = Male
- 2 = Female

**Required:** Yes

### M0080 - Discipline of Person Completing Assessment
**Description:** Discipline of clinician who completed the comprehensive assessment
**Response Type:** Select dropdown
**Options:**
- 1 = RN
- 2 = PT
- 3 = SLP/ST
- 4 = OT

**Required:** Yes
**Notes:** Only RN, PT, SLP/ST, or OT can complete OASIS

### M0090 - Date Assessment Completed
**Description:** Date all information gathering for assessment was completed
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Yes
**Notes:** Must be within 5 days of SOC date

### M0100 - This Assessment is Currently Being Completed for the Following Reason
**Description:** Reason/time point for completing assessment
**Response Type:** Select dropdown
**Options:**
- 01 = Start of care - further visits planned
- 03 = Resumption of care (after inpatient stay of 24 hours or more)
- 04 = Recertification (follow-up) reassessment
- 05 = Other follow-up
- 06 = Transferred to an inpatient facility - patient not discharged
- 07 = Transferred to an inpatient facility - patient discharged
- 08 = Death at home
- 09 = Discharge from agency

**Required:** Yes

### M0102 - Date of Physician-Ordered Start of Care (Resumption of Care)
**Description:** Date physician ordered start/resumption of care
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Yes
**Notes:** Revised in E1 for clarification

### M0104 - Date of Referral
**Description:** Date agency received referral for home health services
**Response Type:** Date input (MM/DD/YYYY)
**Required:** Yes

### M0150 - Current Payment Sources for Home Care
**Description:** Indicate all current payment sources (check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- 0 = None; no charge for current services
- 1 = Medicare (traditional fee-for-service)
- 2 = Medicare (HMO/managed care/Advantage plan)
- 3 = Medicaid (traditional fee-for-service)
- 4 = Medicaid (HMO/managed care)
- 5 = Workers' compensation
- 6 = Title programs (e.g., Title III, V, or XX)
- 7 = Other government (e.g., CHAMPUS, VA)
- 8 = Private insurance
- 9 = Private HMO/managed care
- 10 = Self-pay
- 11 = Other (specify)
- UK = Unknown

**Required:** Yes
**Notes:** Revised in E1 to allow non-Medicare/Medicaid submissions

---

## DEMOGRAPHICS AND PATIENT HISTORY (A Items)

### A1005 - Ethnicity
**Description:** Is the patient of Hispanic, Latino/Latina, or Spanish origin?
**Response Type:** Select dropdown
**Options:**
- 0 = No, not of Hispanic, Latino/Latina, or Spanish origin
- 1 = Yes, Hispanic, Latino/Latina, or Spanish origin
- 9 = Patient declines to respond/unable to respond

**Required:** Yes

### A1010 - Race
**Description:** What is the patient's race? (Check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- A = American Indian or Alaska Native
- B = Asian
- C = Black or African American
- D = Native Hawaiian or Pacific Islander
- E = White
- F = Patient declines to respond/unable to respond

**Required:** Yes
**Notes:** Multiple selections allowed

### A1110 - Language
**Description:** Language assessment
**Response Type:** Two sub-items

**A1110A - What is your preferred language?**
- Response Type: Select dropdown
- Options: English, Spanish, Chinese, French, German, Italian, Portuguese, Russian, Tagalog, Vietnamese, Other (specify)

**A1110B - Do you need or want an interpreter?**
- Response Type: Select dropdown
- Options:
  - 0 = No
  - 1 = Yes
  - 8 = Patient declines to respond

**Required:** Yes

### A1250 - Transportation
**Description:** Does the patient have a car, other vehicle, or public transportation to obtain health care?
**Response Type:** Select dropdown
**Options:**
- 0 = Yes, patient has transportation
- 1 = No, patient does not have transportation
- 9 = Patient declines to respond

**Required:** Yes

### A1700 - Cognitive, Behavioral, and Psychiatric Symptoms
**Description:** Are any of the symptoms demonstrated at least once a week? (Check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- A = Wandering
- B = Verbally abusive behavioral symptoms
- C = Physically abusive behavioral symptoms
- D = Disruptive behavioral symptoms
- E = Delusions
- F = None of the above

**Required:** Yes

### A2120 - Provision of Current Reconciled Medication List to Subsequent Provider
**Description:** Upon discharge, was a complete list of the patient's current reconciled medications provided to the subsequent provider?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- NA = Patient did not have a subsequent provider

**Required:** For discharge assessments only

---

## SENSORY STATUS (B Items)

### B1000 - Vision
**Description:** Ability to see in adequate light (with glasses if used)
**Response Type:** Select dropdown
**Options:**
- 0 = Sees adequately in most situations; can see medication labels, newsprint
- 1 = Sees large print, but not regular print in newspapers/books
- 2 = Sees large objects, but not small objects
- 3 = Sees small objects poorly or not at all
- 4 = No vision; unable to see
- 9 = Patient declines to respond

**Required:** Yes

### B1200 - Hearing (with hearing aid if applicable)
**Description:** Ability to hear (with hearing aid if used)
**Response Type:** Select dropdown
**Options:**
- 0 = No difficulty in normal conversation, social interaction, listening to TV
- 1 = Difficulty in some situations (e.g., when not facing speaker; speaker is across the room; more than one person speaking)
- 2 = Difficulty in many situations (e.g., speaker has to increase volume and speak distinctly; with hearing aid)
- 3 = Difficulty in most/all situations (e.g., speaker has to speak loudly and slowly; even with hearing aid)
- 4 = Unable to hear in all situations
- 9 = Patient declines to respond

**Required:** Yes

---

## COGNITIVE PATTERNS (C Items)

### C0100 - Should Brief Interview for Mental Status (BIMS) be Conducted?
**Description:** Determine if patient is able to complete interview
**Response Type:** Select dropdown
**Options:**
- 0 = No (patient is rarely/never understood)
- 1 = Yes

**Required:** Yes
**Notes:** If 0, skip to C0700 and complete staff assessment

### C0200 - Repetition of Three Words
**Description:** Number of words repeated after first attempt
**Response Type:** Numeric (0-3)
**Required:** If C0100 = 1

### C0300 - Temporal Orientation
**Description:** Series of questions about current year, month, day
**Response Type:** Multiple sub-items (C0300A, C0300B, C0300C)
**Options per item:**
- 0 = Missed
- 1 = Missed by 1 year/month/day
- 2 = Missed by 2-5 years/months/days
- 3 = Missed by more than 5 years/months/6 days
- 4 = Correct

**Required:** If C0100 = 1

### C0400 - Recall
**Description:** Ability to recall three words from C0200
**Response Type:** Multiple sub-items (C0400A, C0400B, C0400C)
**Options per item:**
- 0 = No - could not recall
- 1 = Yes, after cueing
- 2 = Yes, no cue required

**Required:** If C0100 = 1

### C0500 - BIMS Summary Score
**Description:** Total score from C0200-C0400
**Response Type:** Calculated numeric (0-15)
**Interpretation:**
- 13-15 = Cognitively intact
- 8-12 = Moderately impaired
- 0-7 = Severely impaired

**Required:** If C0100 = 1

### C0700 - Short-Term Memory OK
**Description:** Staff assessment - if patient unable to complete BIMS
**Response Type:** Select dropdown
**Options:**
- 0 = Memory OK
- 1 = Memory problem

**Required:** If C0100 = 0

### C0800 - Long-Term Memory OK
**Description:** Staff assessment of long-term memory
**Response Type:** Select dropdown
**Options:**
- 0 = Memory OK
- 1 = Memory problem

**Required:** If C0100 = 0

### C1310 - Signs and Symptoms of Delirium
**Description:** Assessment for delirium (from CAM)
**Response Type:** Four sub-items

**C1310A - Acute Onset Mental Status Change**
- 0 = No
- 1 = Yes

**C1310B - Inattention**
- 0 = Behavior not present
- 1 = Behavior present, fluctuates
- 2 = Behavior present, continuous

**C1310C - Disorganized Thinking**
- 0 = Behavior not present
- 1 = Behavior present, fluctuates
- 2 = Behavior present, continuous

**C1310D - Altered Level of Consciousness**
- 0 = Alert
- 1 = Vigilant
- 2 = Lethargic
- 3 = Stupor
- 4 = Coma

**Required:** Yes
**Notes:** Used to identify delirium based on CAM algorithm

---

## MOOD AND BEHAVIOR PATTERNS (D Items)

### D0150 - Patient Mood Interview (PHQ-2 to 9)
**Description:** Patient Health Questionnaire for depression screening
**Response Type:** Nine sub-items with frequency scoring
**Frequency Options for each item:**
- 0 = Never or 1 day
- 1 = 2-6 days (several days)
- 2 = 7-11 days (half or more of the days)
- 3 = 12-14 days (nearly every day)

**Sub-items (all require "Over the last 2 weeks, how often have you been bothered by..."):**

**D0150A2 - Little interest or pleasure in doing things?**

**D0150B2 - Feeling down, depressed, or hopeless?**

**If either A2 or B2 ≥ 2, continue with D0150C through I2:**

**D0150C2 - Trouble falling or staying asleep, or sleeping too much?**

**D0150D2 - Feeling tired or having little energy?**

**D0150E2 - Poor appetite or overeating?**

**D0150F2 - Feeling bad about yourself - or that you are a failure or have let yourself or your family down?**

**D0150G2 - Trouble concentrating on things, such as reading the newspaper or watching television?**

**D0150H2 - Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?**

**D0150I2 - Thoughts that you would be better off dead, or of hurting yourself in some way?**

**Required:** Yes
**Notes:** Revised in E1 for clarification; replaces OASIS-D M1730

### D0160 - Total Severity Score
**Description:** Sum of D0150A2 through I2
**Response Type:** Calculated numeric (0-27)
**Interpretation:**
- 0-4 = Minimal depression
- 5-9 = Mild depression
- 10-14 = Moderate depression
- 15-19 = Moderately severe depression
- 20-27 = Severe depression

**Required:** Yes

---

## HEALTH CONDITIONS (I Items - Diagnoses)

### I0100 - Inpatient Facility Discharge Date
**Description:** Date patient discharged from inpatient facility
**Response Type:** Date input (MM/DD/YYYY)
**Required:** For SOC after hospitalization

### I0200 - Medical or Treatment Regimen Change
**Description:** Has the patient experienced a change in medical or treatment regimen in the past 14 days?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes

**Required:** Yes

### I8000 - Active Diagnoses - Comorbidities and Co-existing Conditions
**Description:** List all active diagnoses requiring monitoring or treatment
**Response Type:** Multiple ICD-10-CM codes
**Format:** ICD-10-CM diagnosis codes
**Required:** Yes
**Notes:**
- List Primary Diagnosis first (most relevant to home health care)
- Then list other diagnoses (comorbidities) in order of clinical significance
- Include diagnoses that affect patient's functional status, require monitoring, or influence care planning
- PDGM-relevant high-impact comorbidities should be coded when present

**Implementation Details:**
- Minimum: 1 primary diagnosis
- Typical: 5-10 diagnoses
- Each diagnosis requires:
  - ICD-10-CM code (text input)
  - Diagnosis description (text)
  - Symptom control rating (for some diagnoses)

---

## HEALTH CONDITIONS (J Items)

### J0510 - Pain Effect on Sleep
**Description:** Does pain interfere with sleep?
**Response Type:** Select dropdown
**Options:**
- 0 = Does not apply - no pain
- 1 = Pain does not interfere with sleep
- 2 = Pain interferes with sleep

**Required:** Yes

### J0520 - Pain Interference with Therapy Activities
**Description:** Does pain interfere with therapy activities?
**Response Type:** Select dropdown
**Options:**
- 0 = Does not apply - no pain or no therapy activities
- 1 = Pain does not interfere
- 2 = Pain interferes with therapy

**Required:** Yes

### J1800 - Any Falls Since SOC/ROC
**Description:** Has the patient had any falls since SOC (or ROC if resumption)?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes

**Required:** Yes

### J1900 - Number of Falls Since SOC/ROC
**Description:** If J1800 = 1, record number of falls with and without injury
**Response Type:** Three numeric sub-items

**J1900A - No Injury**
- Number of falls with no injury (0-99)

**J1900B - Injury (except major)**
- Number of falls with minor injury (0-99)

**J1900C - Major Injury**
- Number of falls with major injury (bone fractures, joint dislocations, closed head injury) (0-99)

**Required:** If J1800 = 1

### J2030 - Shortness of Breath (Dyspnea)
**Description:** When does the patient experience shortness of breath?
**Response Type:** Select dropdown
**Options:**
- 0 = Not short of breath
- 1 = When walking more than 20 feet, climbing stairs
- 2 = With moderate exertion (e.g., while dressing, using commode or bedpan)
- 3 = With minimal exertion or with ADLs
- 4 = At rest

**Required:** Yes

---

## FUNCTIONAL ABILITIES (GG Items)

### GG0100 - Prior Functioning: Everyday Activities
**Description:** Prior to the current illness, what was the patient's usual ability?
**Response Type:** Three sub-items

**GG0100A - Self-Care**
**GG0100B - Indoor Mobility**
**GG0100C - Stairs**

**Options for each:**
- 3 = Independent
- 2 = Needed some help
- 1 = Dependent
- 8 = Unknown
- 9 = Not applicable

**Required:** Yes

### GG0110 - Prior Device Use
**Description:** Did the patient use any of the following prior to illness? (Check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- A = Manual wheelchair
- B = Motorized wheelchair/scooter
- C = Mechanical lift
- D = Walker
- E = Orthotics/prosthetics
- F = None of the above
- Z = Unknown

**Required:** Yes

### GG0130 - Self-Care (Admission Performance)
**Description:** Code patient's usual performance at admission using 6-point scale
**Response Type:** Multiple sub-items with standardized scale

**Coding Scale (for all GG0130 items):**
- 06 = Independent - Patient completes activity by themself with no assistance
- 05 = Setup or clean-up assistance - Helper sets up or cleans up; patient completes activity
- 04 = Supervision or touching assistance - Helper provides verbal cues/touching/steadying
- 03 = Partial/moderate assistance - Patient completes 50-74% of activity; helper does 26-49%
- 02 = Substantial/maximal assistance - Patient completes 25-49% of activity; helper does 51-75%
- 01 = Dependent - Helper does all of the activity (or patient does <25%)
- 07 = Patient refused
- 09 = Not applicable
- 10 = Not attempted due to environmental limitations
- 88 = Not attempted due to medical condition or safety concerns

**GG0130 Sub-items:**

**GG0130A - Eating**
- Use of suitable utensils to bring food/drink to mouth and swallow

**GG0130B - Oral Hygiene**
- Brushing teeth, denture care, mouth care

**GG0130C - Toileting Hygiene**
- Cleaning perineal area, adjusting clothing before/after toilet use

**GG0130E - Shower/Bathe Self**
- Washing, rinsing, drying body from neck down (excluding washing back and hair)

**GG0130F - Upper Body Dressing**
- Dressing/undressing above the waist

**GG0130G - Lower Body Dressing**
- Dressing/undressing below the waist, including footwear

**GG0130H - Putting on/Taking off Footwear**
- Shoes, socks, slippers, orthotics

**Required:** Yes for SOC
**Notes:** E1 removed Discharge Goal column (Column 2) for SOC/ROC

### GG0170 - Mobility (Admission Performance)
**Description:** Code patient's usual performance at admission using same 6-point scale
**Response Type:** Multiple sub-items with standardized scale

**Uses same 06-01, 07, 09, 10, 88 coding as GG0130**

**GG0170 Sub-items:**

**GG0170A - Roll Left and Right**
- Rolling from lying on back to left and right side, and return to lying on back

**GG0170B - Sit to Lying**
- Moving from sitting to lying on bed

**GG0170C - Lying to Sitting on Side of Bed**
- Moving from lying on back to sitting on side of bed with feet flat on floor

**GG0170D - Sit to Stand**
- Coming to standing position from sitting in chair/wheelchair/bed

**GG0170E - Chair/Bed-to-Chair Transfer**
- Transfer to and from bed to chair (or wheelchair)

**GG0170F - Toilet Transfer**
- Getting on and off toilet

**GG0170G - Car Transfer**
- Transferring in and out of car/vehicle

**GG0170I - Walk 10 Feet**
- Walking 10 feet in room/corridor

**GG0170J - Walk 50 Feet with Two Turns**
- Walking 50 feet with two turns

**GG0170K - Walk 150 Feet**
- Walking 150 feet

**GG0170L - Walking 10 Feet on Uneven Surfaces**
- Walking 10 feet on uneven/irregular surfaces

**GG0170M - 1 Step (Curb)**
- Going up and down one step/curb

**GG0170N - 4 Steps**
- Going up and down four steps

**GG0170O - 12 Steps**
- Going up and down 12 steps

**GG0170P - Picking up Object**
- Bending/stooping to pick up object from floor

**GG0170Q - Wheel 50 Feet with Two Turns**
- Propelling wheelchair 50 feet with two turns (if walk items not applicable)

**GG0170R - Wheel 150 Feet**
- Propelling wheelchair 150 feet

**Required:** Yes for SOC
**Notes:** E1 removed Discharge Goal column for SOC/ROC

---

## NUTRITIONAL STATUS (K Items)

### K0520 - Nutritional Approaches
**Description:** Check all nutritional approaches that apply
**Response Type:** Multiple checkboxes
**Options:**
- A = Parenteral/IV feeding
- B = Feeding tube (e.g., nasogastric, G-tube, J-tube, PEG)
- C = Mechanically altered diet
- D = Therapeutic diet
- Z = None of the above

**Required:** Yes

---

## INTEGUMENTARY STATUS (M Items)

### M1200 - Vision and Hearing
**Description:** Multiple assessment of sensory status (Note: May be combined with B items above)

### M1306 - Does this patient have at least one Unhealed Pressure Ulcer/Injury at Stage 2 or Higher or designated as Unstageable?
**Description:** Presence of unhealed pressure ulcer/injury
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes

**Required:** Yes
**Notes:** Excludes Stage 1 and all healed ulcers

### M1307 - The Oldest Stage 2 Pressure Ulcer that is present at discharge
**Description:** How long has the patient had the oldest Stage 2 pressure ulcer?
**Response Type:** Select dropdown
**Options:**
- 1 = Developed since SOC
- 2 = Present at SOC and acquired in this facility
- 3 = Present at SOC and acquired elsewhere
- NA = No Stage 2 pressure ulcer

**Required:** If M1306 = 1

### M1311 - Current Number of Unhealed Pressure Ulcers/Injuries at Each Stage
**Description:** Number of pressure ulcers/injuries at each stage
**Response Type:** Multiple numeric sub-items

**For each stage, two sub-items:**
1. Number of pressure ulcers/injuries
2. Number present at most recent SOC/ROC

**Stages:**

**M1311A1/A2 - Stage 2**
- Partial thickness loss of dermis, shallow open ulcer with red/pink wound bed

**M1311B1/B2 - Stage 3**
- Full thickness tissue loss, subcutaneous fat may be visible

**M1311C1/C2 - Stage 4**
- Full thickness tissue loss with exposed bone, tendon, or muscle

**M1311D1/D2 - Unstageable: Non-removable dressing/device**

**M1311E1/E2 - Unstageable: Slough and/or eschar**

**M1311F1/F2 - Unstageable: Deep tissue injury**

**Required:** If M1306 = 1

### M1320 - Current Number of Stage 1 Pressure Injuries
**Description:** Number of Stage 1 pressure injuries present
**Response Type:** Numeric (0-99)
**Required:** Yes

### M1322 - Current Number of Unhealed Pressure Ulcers/Injuries at Each Stage
**Description:** Detailed staging and tracking
**Notes:** Similar structure to M1311 with additional detail

### M1324 - Stage of Most Problematic Unhealed Pressure Ulcer/Injury
**Description:** Identify the most problematic pressure ulcer stage
**Response Type:** Select dropdown
**Options:**
- 1 = Stage 1
- 2 = Stage 2
- 3 = Stage 3
- 4 = Stage 4
- A1 = Unstageable: Known but not stageable due to coverage
- A2 = Unstageable: Known but not stageable due to deep tissue injury
- A3 = Unstageable: Suspected deep tissue injury
- NA = No pressure ulcers

**Required:** Yes

### M1330 - Does this patient have a Stasis Ulcer?
**Description:** Presence of venous/stasis ulcer
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes, patient has unhealed stasis ulcer(s)
- 2 = Yes, patient has healing stasis ulcer(s), but no unhealed

**Required:** Yes

### M1332 - Current Number of Stasis Ulcers
**Description:** Number of unhealed and healing stasis ulcers
**Response Type:** Two numeric sub-items
- M1332A - Number of unhealed stasis ulcers (0-99)
- M1332B - Number of healing stasis ulcers (0-99)

**Required:** If M1330 > 0

### M1334 - Status of Most Problematic Stasis Ulcer
**Description:** Current status of most problematic stasis ulcer
**Response Type:** Select dropdown
**Options:**
- 1 = Fully granulating
- 2 = Early/partial granulation
- 3 = Not healing
- NA = No stasis ulcer

**Required:** If M1330 > 0

### M1340 - Does this patient have a Surgical Wound?
**Description:** Presence of surgical wound
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes, patient has a surgical wound

**Required:** Yes

### M1342 - Status of Most Problematic Surgical Wound
**Description:** Current status of most problematic surgical wound
**Response Type:** Select dropdown
**Options:**
- 0 = Newly epithelialized
- 1 = Fully granulating
- 2 = Early/partial granulation
- 3 = Not healing
- NA = No surgical wound

**Required:** If M1340 = 1

### M1350 - Does the patient have a Skin Lesion or Open Wound?
**Description:** Presence of other skin lesions/wounds
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes

**Required:** Yes
**Notes:** Excludes pressure ulcers, stasis ulcers, and surgical wounds

---

## RESPIRATORY STATUS (M Items)

### M1400 - When is the patient dyspneic or noticeably Short of Breath?
**Description:** Level of dyspnea
**Response Type:** Select dropdown
**Options:**
- 0 = Never, patient is not short of breath
- 1 = When walking more than 20 feet, climbing stairs
- 2 = With moderate exertion (e.g., while dressing, using commode)
- 3 = With minimal exertion (e.g., while eating, talking, or performing other ADLs) or with agitation
- 4 = At rest (during day or night)

**Required:** Yes

---

## ELIMINATION STATUS (M Items)

### M1600 - Has this patient been treated for a Urinary Tract Infection in the past 14 days?
**Description:** Recent UTI treatment
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- NA = Patient on prophylactic treatment
- UK = Unknown

**Required:** Yes

### M1610 - Urinary Incontinence or Urinary Catheter Presence
**Description:** Current urinary status
**Response Type:** Select dropdown
**Options:**
- 0 = No incontinence or catheter
- 1 = Patient is incontinent
- 2 = Patient requires a urinary catheter (external, indwelling, intermittent, or suprapubic)

**Required:** Yes

### M1620 - Bowel Incontinence Frequency
**Description:** Frequency of bowel incontinence
**Response Type:** Select dropdown
**Options:**
- 0 = Very rarely or never has bowel incontinence
- 1 = Less than once weekly
- 2 = One to three times weekly
- 3 = Four to six times weekly
- 4 = On a daily basis
- 5 = More often than once daily
- NA = Patient has an ostomy for bowel elimination
- UK = Unknown

**Required:** Yes

### M1630 - Ostomy for Bowel Elimination
**Description:** Presence of bowel ostomy
**Response Type:** Select dropdown
**Options:**
- 0 = Patient does not have an ostomy for bowel elimination
- 1 = Patient's ostomy was not related to an inpatient facility stay and did not necessitate change in medical or treatment regimen
- 2 = Patient's ostomy was related to an inpatient facility stay or did necessitate change in medical or treatment regimen

**Required:** Yes

---

## MEDICATIONS (M Items)

### M2001 - Drug Regimen Review
**Description:** Does a complete drug regimen review indicate potential clinically significant medication issues?
**Response Type:** Select dropdown
**Options:**
- 0 = No issues found during review
- 1 = Issues found during review
- 9 = No review conducted

**Required:** Yes

### M2003 - Medication Follow-up
**Description:** If issues identified in M2001, was follow-up conducted?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- NA = No issues found

**Required:** If M2001 = 1

### M2005 - Medication Intervention
**Description:** If issues identified, was medication intervention provided?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- NA = No issues found

**Required:** If M2001 = 1

### M2010 - Patient/Caregiver High Risk Drug Education
**Description:** Has the patient/caregiver received education on high-risk medications?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- NA = Patient not taking any high-risk drugs

**Required:** Yes

### M2020 - Management of Oral Medications
**Description:** Patient's current ability to prepare and take all oral medications reliably and safely
**Response Type:** Select dropdown
**Options:**
- 0 = Able to independently take the correct oral medication(s) and proper dosage(s) at the correct times
- 1 = Able to take medication(s) at the correct times if individual dosages are prepared in advance by another person or using a drug dispensing device
- 2 = Able to take medication(s) at the correct times if given reminders by another person at the appropriate times
- 3 = Unable to take medication unless administered by another person
- NA = No oral medications prescribed

**Required:** Yes
**Notes:** Refers to ability, not compliance or willingness

### M2030 - Management of Injectable Medications
**Description:** Patient's ability to prepare and administer injectable medications
**Response Type:** Select dropdown
**Options:**
- 0 = Able to independently take the correct injectable medication, at the correct times
- 1 = Able to take injectable medication at the correct times if individual syringes are prepared in advance by another person
- 2 = Able to take injectable medication if another person prepares the injection and prompts the patient to take it at the correct times
- 3 = Unable to take injectable medication unless administered by another person
- NA = No injectable medications prescribed

**Required:** Yes

---

## MEDICATION ITEMS (N Items)

### N0415 - High-Risk Drug Classes: Use and Indication
**Description:** For each high-risk drug class, indicate if patient is taking and if indication is documented
**Response Type:** Multiple sub-items with two columns each

**Drug Classes:**

**N0415A - Anticoagulant**
**N0415B - Antiplatelet**
**N0415C - Antipsychotic**
**N0415D - Antibiotic**
**N0415E - Opioid**
**N0415F - Hypoglycemic (Diabetes medication)**

**For each drug class:**
- Column 1: Is patient currently taking? (0 = No, 1 = Yes)
- Column 2: If taking, is indication documented? (0 = No, 1 = Yes, NA = Not taking)

**Required:** Yes
**Notes:** Include all medications used by any route in any setting

---

## CARE MANAGEMENT (M Items)

### M2102 - Types and Sources of Assistance
**Description:** Determine ability of patient/caregiver to meet patient needs (check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- ADL assistance
- IADL assistance
- Medication administration
- Medical procedures/treatments
- Management/supervision of complex medical equipment
- Advocacy or facilitation of patient's participation in care
- Financial management
- Emotional/psychological support
- Aide services not listed above
- No assistance needed in any of the above areas OR
- Caregiver not likely to be able to provide assistance

**Required:** Yes

### M2250 - Plan of Care Synopsis
**Description:** Does the plan of care include therapies or interventions for the following? (Check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- Medication management
- Nutrition/hydration/elimination
- Skin care
- Pain management
- Behavioral/psychiatric care
- Cardiac/circulatory care
- Respiratory care
- Diabetes care
- Other (specify)

**Required:** Yes

### M2300 - Emergent Care
**Description:** Since SOC/ROC, has patient received emergency care?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes, used hospital emergency department without hospitalization
- 2 = Yes, hospitalized (including ER visit)

**Required:** For follow-up and discharge assessments

### M2310 - Reason for Emergent Care
**Description:** If M2300 > 0, reason for emergent care (check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- Improper medication administration, adverse effects, toxicity
- Injury caused by fall
- Respiratory issues
- Cardiac issues
- Hypo/hyperglycemia
- GI bleeding, obstruction
- Urinary tract infection
- IV catheter-related infection
- Wound infection
- Uncontrolled pain
- Acute mental/behavioral problem
- Other (specify)

**Required:** If M2300 > 0

### M2420 - Discharge Disposition
**Description:** Where is patient after discharge from agency?
**Response Type:** Select dropdown
**Options:**
- 1 = Patient remained in community (not admitted to hospital, nursing home, or rehab facility)
- 2 = Patient transferred to noninstitutional hospice
- 3 = Unknown (agency doesn't know)

**Required:** For discharge assessments
**Notes:** Revised in E1

---

## SPECIAL TREATMENTS AND PROCEDURES (O Items)

### O0110 - Special Treatments, Procedures, and Programs
**Description:** Special treatments received (check all that apply)
**Response Type:** Multiple checkboxes
**Options:**
- A1 = Parenteral/IV feeding
- A2 = Enteral feeding (nasogastric, G-tube, J-tube, PEG)
- B1 = IV medications (excluding antibiotics)
- B2 = IV antibiotics
- C1 = Oxygen therapy
- C2 = Ventilator/respirator
- D1 = Tracheostomy care
- E1 = Chemotherapy (IV)
- E2 = Chemotherapy (oral)
- F1 = Radiation
- G1 = Dialysis (hemodialysis)
- G2 = Dialysis (peritoneal)
- H1 = IV access (peripheral line)
- H2 = IV access (PICC line)
- H3 = IV access (central line/port)
- Z = None of the above

**Required:** Yes

### O0350 - Patient's COVID-19 Vaccination is Up to Date
**Description:** Is patient's COVID-19 vaccination up to date per CDC definition?
**Response Type:** Select dropdown
**Options:**
- 0 = No
- 1 = Yes
- 2 = Patient is not eligible for COVID-19 vaccination
- 3 = Unknown

**Required:** Yes
**Notes:** NEW ITEM in OASIS-E1 (effective 1/1/2025)

---

## IMPLEMENTATION NOTES FOR DEVELOPERS

### Form Structure Recommendations

1. **Progressive Disclosure:** Use skip logic to hide/show items based on responses
2. **Validation:** Implement real-time validation for required fields
3. **Auto-calculation:** Calculate summary scores (e.g., BIMS, PHQ-9, GG scores)
4. **ICD-10 Integration:** Provide ICD-10 code lookup/search functionality
5. **Save/Resume:** Allow clinicians to save partial assessments
6. **Audit Trail:** Track who entered data and when

### Response Type Implementation

**Select Dropdown:**
```html
<select id="item-code" required>
  <option value="">- Select -</option>
  <option value="0">0 - Description</option>
  <option value="1">1 - Description</option>
</select>
```

**Multiple Checkboxes:**
```html
<div id="item-code">
  <label><input type="checkbox" name="item-code" value="A"> A - Description</label>
  <label><input type="checkbox" name="item-code" value="B"> B - Description</label>
</div>
```

**Numeric Input:**
```html
<input type="number" id="item-code" min="0" max="99" required>
```

**Date Input:**
```html
<input type="date" id="item-code" required>
```

**Text Input:**
```html
<input type="text" id="item-code" maxlength="10" required>
```

### PDGM Clinical Groupings

The primary diagnosis (I8000 first code) determines the clinical group:
- **MS-Rehab:** Stroke, neurological conditions, orthopedic
- **Behavioral Health:** Psychiatric, depression, anxiety
- **Complex Nursing:** Wounds, infections, IV medications
- **MMTA (Medical Management, Therapy, Activities):** Other medical conditions

### Comorbidity Adjustment

High-impact comorbidities for PDGM payment adjustment include:
- Heart failure
- COPD
- Diabetes with complications
- Peripheral vascular disease
- Pressure ulcers
- Malnutrition
- And others per CMS PDGM specifications

### Functional Impairment Level

Calculated from GG0130 and GG0170 scores:
- **Low:** Higher independence (more 05-06 scores)
- **Medium:** Moderate assistance needed (more 03-04 scores)
- **High:** Substantial assistance needed (more 01-02 scores)

---

## QUALITY MEASURES USING OASIS-E1 DATA

1. **Improvement in Dyspnea** (M1400)
2. **Improvement in Bed Transferring** (GG0170E)
3. **Discharge to Community** (M2420)
4. **Acute Care Hospitalization** (M2300)
5. **Emergency Department Use Without Hospitalization** (M2300)
6. **Improvement in Management of Oral Medications** (M2020)
7. **Drug Regimen Review** (M2001)
8. **COVID-19 Vaccination** (O0350) - NEW in E1
9. **Discharge Function Score** (GG0130 and GG0170 select items)

---

## RESOURCES

**Official CMS Documentation:**
- [OASIS-E1 All Items (35 pages)](https://www.cms.gov/files/document/oasis-e1-all-item-508.pdf)
- [OASIS-E1 Manual Final (December 9, 2024)](https://www.cms.gov/files/document/oasis-e1-manualfinal12-9-2024.pdf)
- [CMS OASIS Data Sets](https://www.cms.gov/medicare/quality/home-health/oasis-data-sets)

**Educational Resources:**
- [OASIS Answers - E1 Guidance](https://oasisanswers.com/cms-posts-final-oasis-e1-guidance-manual-effective-1-1-2025/)
- [McBee Associates - OASIS-E1 Changes](https://mcbeeassociates.com/insights/blog/get-ready-for-change-moving-from-oasis-e-to-oasis-e1/)
- [MatrixCare - E1 Updates](https://www.matrixcare.com/blog/everything-to-know-about-oasis-e1-changes-in-2025/)

---

## DOCUMENT HISTORY

**Version 1.0** - November 23, 2025
- Initial comprehensive reference compiled from official CMS sources
- Includes all OASIS-E1 items effective January 1, 2025
- Based on final CMS OASIS-E1 Manual (December 9, 2024)

---

**End of Reference Document**
