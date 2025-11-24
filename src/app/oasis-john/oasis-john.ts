import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { OasisHeaderComponent } from '../oasis-header/oasis-header';
import {
  OasisRecommendationsComponent,
  AiRecommendation,
  AnalyzerAlert,
  AiRecommendationStatus,
  AnalyzerAlertStatus,
} from '../oasis-recommendations/oasis-recommendations';
import {
  OasisDocumentViewerComponent,
  EvidenceHighlight,
} from '../oasis-document-viewer/oasis-document-viewer';
import { OasisFormComponent } from '../oasis-form/oasis-form';
import { PaymentStateService } from '../services/payment-state.service';
import { DocumentStateService } from '../services/document-state.service';
import { RecommendationStateService } from '../services/recommendation-state.service';
import { OasisStateService } from '../services/oasis-state.service';

@Component({
  selector: 'app-oasis-john',
  templateUrl: './oasis-john.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    OasisHeaderComponent,
    OasisRecommendationsComponent,
    OasisDocumentViewerComponent,
    OasisFormComponent,
  ],
  styleUrls: ['./oasis-john.css'],
})
export class OasisJohnComponent implements OnInit, AfterViewInit {
  public router = inject(Router);
  private paymentStateService = inject(PaymentStateService);
  private documentStateService = inject(DocumentStateService);
  private recommendationStateService = inject(RecommendationStateService);
  private oasisStateService = inject(OasisStateService);

  // Document mapping: patient-summary doc IDs -> oasis-john doc IDs
  private readonly DOC_MAPPING = {
    doc1: 'discharge-doc' as const,
    doc2: 'referral-doc' as const,
    doc5: 'visit-doc' as const,
  };

  @ViewChild(OasisFormComponent) oasisFormComponent!: OasisFormComponent;
  @ViewChild(OasisDocumentViewerComponent) documentViewerComponent!: OasisDocumentViewerComponent;

  // Signals for shared state
  totalItems = signal(89);
  currentPayment = signal(2875.5);
  showAnalyzer = signal(false);
  isSavingAssessment = signal(false);
  hasBeenSaved = signal(false); // Track if assessment has been saved
  selectedAlertId = signal<string | null>(null);
  activeDocId = signal<'discharge-doc' | 'referral-doc' | 'visit-doc'>('referral-doc'); // Default to referral since it's the only one uploaded initially
  highlightEvidence = signal<EvidenceHighlight | null>(null);

  // Computed from OasisStateService
  itemsAccepted = computed(() => this.oasisStateService.form().itemsAccepted);
  availableDocs = computed(() => new Set(this.oasisStateService.documents() as ('discharge-doc' | 'referral-doc' | 'visit-doc')[]));

  // Track collapsed form sections
  collapsedSections = signal<Set<string>>(new Set());

  // Store the initial pre-filled count (default pre-filled fields in the form)
  private initialPrefilledCount = 18; // ~20% completion (18/89 items)

  // AI Recommendations state - All recommendations (before filtering)
  private allAiRecommendations = signal<AiRecommendation[]>([
    {
      id: 'rec-primary',
      kind: 'icd',
      headerLabel: 'Primary Diagnosis • I8000',
      title: 'I63.511 – Cerebral infarction due to embolism of right middle cerebral artery',
      rationaleHtml:
        'Documented right MCA territory infarct with persistent left-sided hemiparesis and NIHSS scores described in the Discharge Summary support selection of <span class="font-semibold">I63.511</span> as the primary diagnosis.',
      contextLabel: 'PDGM: Neuro / Stroke',
      evidenceDocLabel: 'Discharge Summary',
      badgeLabel: 'Recommended',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      selectionOasisKey: 'I8000-primary',
      evidenceDocId: 'discharge-doc',
      formFieldId: 'form-I8000-primary-answer',
      oasisTargetId: 'I8000-primary',
      acceptValue: 'I63.511 - Cerebral infarction due to embolism of right middle cerebral artery',
      triggersPdgmUpdate: true,
      progressIncrement: 25,
      status: 'pending',
    },
    {
      id: 'rec-aspiration',
      kind: 'icd',
      headerLabel: 'Comorbidity • I8000',
      title: 'J69.0 – Aspiration pneumonia, right lower lobe',
      rationaleHtml:
        'Hospital course describes hypoxemia, fever, and right lower lobe infiltrate treated as <span class="font-semibold">aspiration pneumonia</span>, now resolved at discharge. This supports adding J69.0 as a comorbidity.',
      contextLabel: 'Comorbidity adjustment',
      evidenceDocLabel: 'Discharge Summary',
      badgeLabel: 'High impact',
      badgeClass: 'bg-blue-50 text-blue-700',
      selectionOasisKey: 'I8000-aspiration',
      evidenceDocId: 'discharge-doc',
      formFieldId: 'form-I8000-comorbidity-answer',
      oasisTargetId: 'I8000-comorbidity',
      acceptValue: 'J69.0 - Aspiration pneumonia, right lower lobe',
      triggersPdgmUpdate: true,
      progressIncrement: 20,
      status: 'pending',
    },
    {
      id: 'rec-dysphagia',
      kind: 'icd',
      headerLabel: 'Additional Comorbidity • I8000',
      title: 'R13.19 – Other dysphagia',
      rationaleHtml:
        'VFSS shows moderate-to-severe oropharyngeal <span class="font-semibold">dysphagia</span> with silent aspiration of thin liquids, requiring pureed solids and nectar-thick liquids with supervision. This supports adding R13.19 as an additional diagnosis.',
      contextLabel: 'No direct tier change',
      evidenceDocLabel: 'Discharge Summary',
      badgeLabel: 'Swallow risk',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      selectionOasisKey: 'I8000-dysphagia',
      evidenceDocId: 'discharge-doc',
      formFieldId: 'form-I8000-other-diagnoses-container',
      oasisTargetId: 'I8000-dysphagia',
      acceptValue: 'R13.19 - Other dysphagia',
      triggersPdgmUpdate: false,
      progressIncrement: 5,
      status: 'pending',
    },
    {
      id: 'rec-diabetes',
      kind: 'icd',
      headerLabel: 'Additional Comorbidity • I8000',
      title: 'E11.40 – Type 2 diabetes mellitus with diabetic neuropathy',
      rationaleHtml:
        'Past medical history lists type 2 diabetes with neuropathy and new basal-bolus insulin regimen with BG checks before meals and at bedtime. This supports capturing <span class="font-semibold">E11.40</span> as an additional comorbidity.',
      contextLabel: 'No direct tier change',
      evidenceDocLabel: 'Discharge, Referral',
      selectionOasisKey: 'I8000-diabetes',
      evidenceDocId: 'discharge-doc',
      formFieldId: 'form-I8000-other-diagnoses-container',
      oasisTargetId: 'I8000-diabetes',
      acceptValue: 'E11.40 - Type 2 diabetes mellitus with diabetic neuropathy',
      triggersPdgmUpdate: false,
      progressIncrement: 5,
      status: 'pending',
    },
    {
      id: 'rec-htn',
      kind: 'icd',
      headerLabel: 'Additional Comorbidity • I8000',
      title: 'I10 – Essential hypertension',
      rationaleHtml:
        'Uncontrolled hypertension is repeatedly referenced as a key stroke risk factor requiring strict BP control with Amlodipine and Lisinopril, supporting capture of <span class="font-semibold">I10</span>.',
      contextLabel: 'No direct tier change',
      evidenceDocLabel: 'Discharge, Referral',
      selectionOasisKey: 'I8000-htn',
      evidenceDocId: 'discharge-doc',
      formFieldId: 'form-I8000-other-diagnoses-container',
      oasisTargetId: 'I8000-htn',
      acceptValue: 'I10 - Essential hypertension',
      triggersPdgmUpdate: false,
      progressIncrement: 5,
      status: 'pending',
    },
    {
      id: 'rec-gg-mobility',
      kind: 'gg',
      headerLabel: 'Functional Mobility • GG0170',
      title: '03 – Partial/moderate assistance for short-distance ambulation and transfers',
      rationaleHtml:
        'PT/OT document left hemiparesis with need for moderate to maximal assistance for transfers and short-distance ambulation (25–50 ft) with a rolling walker, wheelchair dependent for community mobility. This supports coding GG0170 items at a partial/moderate assistance level.',
      contextLabel: 'Mobility',
      evidenceDocLabel: 'Referral / Therapy notes',
      selectionOasisKey: 'GG0170-mobility',
      evidenceDocId: 'referral-doc',
      formFieldId: 'form-GG0170C-answer',
      oasisTargetId: 'GG0170C',
      ggValue: '03',
      triggersPdgmUpdate: false,
      progressIncrement: 0,
      status: 'pending',
    },
  ]);

  // Filtered recommendations based on available documents
  aiRecommendations = signal<AiRecommendation[]>([]);

  // Analyzer alerts state
  private allAnalyzerAlerts = signal<AnalyzerAlert[]>([
    {
      id: 'alert-aspiration-missed',
      type: 'coding_opportunity',
      severity: 'high',
      status: 'new',
      title: 'Aspiration pneumonia documented but not present in OASIS I8000',
      description:
        'Discharge Summary documents aspiration pneumonia (J69.0). This diagnosis is not currently captured in I8000 comorbidity fields. Please double-check whether this was intentionally excluded.',
      evidenceDocId: 'discharge-doc',
      evidenceAnchorId: 'I8000-aspiration',
      relatedOasisItem: 'I8000-comorbidity',
      hippsImpact: {
        delta: 287,
        description: 'Potential comorbidity tier increase (+$287 illustrative).',
      },
      linkedRecommendationId: 'rec-aspiration',
    },
    {
      id: 'alert-limb-findings-inconsistent',
      type: 'inconsistency',
      severity: 'medium',
      status: 'new',
      title: 'Lower extremity findings in visit note not reflected in OASIS',
      description:
        'Visit note documents +2 pitting edema, cool feet, faint pedal pulses, dark discoloration of the right great toe, and pain with walking relieved by rest. The current OASIS submission does not show any active wound, ulcer, or lower extremity perfusion issue. Please double-check for consistency.',
      evidenceDocId: 'visit-doc',
      evidenceAnchorId: 'analyzer-toe',
      relatedOasisItem: 'Skin/ulcers or vascular status',
      linkedRecommendationId: undefined,
    },
  ]);

  analyzerAlerts = signal<AnalyzerAlert[]>([]);

  pendingRejectCard: HTMLElement | null = null;
  pendingRejectRecommendation: AiRecommendation | null = null;

  get hasAnalyzerAlerts(): boolean {
    return this.analyzerAlerts().length > 0;
  }

  get newAnalyzerAlertCount(): number {
    return this.analyzerAlerts().filter((a) => a.status === 'new').length;
  }

  constructor() {
    // No longer needed - OasisStateService handles persistence automatically
  }

  ngOnInit(): void {
    this.initializeAvailableDocuments();
    this.filterRecommendationsAndAlerts();
    this.restoreSavedRecommendationStates();
    this.handleNavigationState();
    // Items accepted count restored automatically by OasisStateService
    this.collapseAllSections(); // Start with all sections collapsed
    this.showPage('copilot-page');
  }

  /**
   * Handle navigation state to set the active document tab
   */
  private handleNavigationState(): void {
    const state = window.history.state as any;

    if (state && state.openDocumentId) {
      const docId = state.openDocumentId;
      console.log('📄 Opening document from navigation:', docId);

      // Map patient-summary doc ID to oasis-john doc ID
      const oasisDocId = this.DOC_MAPPING[docId as keyof typeof this.DOC_MAPPING];

      if (oasisDocId && this.availableDocs().has(oasisDocId)) {
        console.log('📄 Setting active document to:', oasisDocId);
        this.activeDocId.set(oasisDocId);
      }
    }
  }

  /**
   * Check which documents are available (uploaded) and update the availableDocs signal
   */
  private initializeAvailableDocuments(): void {
    const available = new Set<'discharge-doc' | 'referral-doc' | 'visit-doc'>();

    // Check each document using the DocumentStateService
    Object.entries(this.DOC_MAPPING).forEach(([patientSummaryDocId, oasisDocId]) => {
      if (this.documentStateService.isDocumentUploaded(patientSummaryDocId)) {
        available.add(oasisDocId);
      }
    });

    // Referral doc (doc2) is always available by default (hardcoded in patient-summary)
    available.add('referral-doc');

    // Update OasisStateService with available documents
    available.forEach(docId => this.oasisStateService.addAvailableDocument(docId));
    console.log('📄 Available documents:', Array.from(available));
  }

  /**
   * Filter recommendations and alerts based on available documents
   */
  private filterRecommendationsAndAlerts(): void {
    const available = this.availableDocs();

    // Filter recommendations to only show those with available evidence documents
    const filteredRecs = this.allAiRecommendations().filter((rec) =>
      available.has(rec.evidenceDocId)
    );
    this.aiRecommendations.set(filteredRecs);
    console.log('📋 Filtered recommendations:', filteredRecs.length, 'of', this.allAiRecommendations().length);

    // Filter analyzer alerts to only show those with available evidence documents
    const filteredAlerts = this.allAnalyzerAlerts().filter((alert) =>
      available.has(alert.evidenceDocId)
    );
    this.analyzerAlerts.set(filteredAlerts);
    console.log('⚠️ Filtered analyzer alerts:', filteredAlerts.length, 'of', this.allAnalyzerAlerts().length);
  }

  /**
   * Restore saved recommendation states from the service
   */
  private restoreSavedRecommendationStates(): void {
    const savedStates = this.recommendationStateService.getAllRecommendationStates();

    if (savedStates.size === 0) {
      console.log('💾 No saved recommendation states found');
      return;
    }

    // Update recommendations with saved statuses
    this.aiRecommendations.update((recs) =>
      recs.map((rec) => {
        const savedState = savedStates.get(rec.id);
        if (savedState) {
          console.log(`💾 Restoring ${rec.id} status: ${savedState.status}`);
          return { ...rec, status: savedState.status };
        }
        return rec;
      })
    );

    // Recompute analyzer alerts after restoring states
    this.computeAnalyzerAlerts();

    console.log('💾 Recommendation states restored');
  }

  ngAfterViewInit(): void {
    // Populate form fields for accepted recommendations after view is initialized
    const savedStates = this.recommendationStateService.getAllRecommendationStates();

    if (savedStates.size > 0) {
      // Collect sections that need to be expanded
      const sectionsToExpand = new Set<string>();

      this.aiRecommendations().forEach((rec) => {
        const savedState = savedStates.get(rec.id);
        if (savedState && savedState.status === 'accepted') {
          const sectionId = this.getSectionIdForField(rec.formFieldId);
          if (sectionId) {
            sectionsToExpand.add(sectionId);
          }
        }
      });

      // Expand all sections with accepted recommendations
      sectionsToExpand.forEach(sectionId => this.expandSection(sectionId));

      // Populate fields after a brief delay to allow sections to expand
      setTimeout(() => {
        this.aiRecommendations().forEach((rec) => {
          const savedState = savedStates.get(rec.id);
          if (savedState && savedState.status === 'accepted') {
            console.log(`💾 Populating form field for ${rec.id}`);

            const isOtherDiagnosis = rec.formFieldId === 'form-I8000-other-diagnoses-container';
            this.oasisFormComponent.populateField(
              rec.formFieldId,
              rec.acceptValue || rec.ggValue || '',
              isOtherDiagnosis
            );

            // Update items accepted count
            this.oasisStateService.updateItemsAccepted(this.itemsAccepted() + 1);

            // Update payment if applicable
            if (rec.triggersPdgmUpdate) {
              this.updatePaymentDisplay(rec);
            }
          }
        });
      }, 200);
    }

    // Set initial pre-filled count after view initialization
    setTimeout(() => {
      // Set to initial pre-filled count if no saved state exists
      const currentCount = this.itemsAccepted();
      if (currentCount === 0) {
        this.oasisStateService.updateItemsAccepted(this.initialPrefilledCount);
        console.log(`💾 Set initial pre-filled count: ${this.initialPrefilledCount} items (${Math.round((this.initialPrefilledCount / this.totalItems()) * 100)}%)`);
      } else {
        console.log(`💾 Restored from saved state: ${currentCount} items (${Math.round((currentCount / this.totalItems()) * 100)}%)`);
      }
    }, 500);
  }

  // ======= Event Handlers from Child Components =======

  handleBackToDashboard(): void {
    this.router.navigate(['/patients', 'p1', 'summary']);
  }

  handleQuickEligibilityCheck(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button) return;

    const originalHTML = button.innerHTML;

    button.innerHTML =
      '<ion-icon name="hourglass-outline" class="text-sm animate-spin"></ion-icon><span>Checking...</span>';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
      this.showModal('eligibility-modal');
      this.updateEligibilityTimestamp();
    }, 1500);
  }

  handleToggleAnalyzer(): void {
    this.showAnalyzer.update((v) => !v);
  }

  handleSaveAssessment(): void {
    if (this.isSavingAssessment()) return;

    this.isSavingAssessment.set(true);

    // Show the processing overlay
    this.showModal('save-processing-overlay');

    const statusEl = document.getElementById('analysis-status');
    const progressBar = document.getElementById('analysis-progress-bar');

    // Analysis steps with messages and progress
    const steps = [
      { message: 'Validating OASIS data fields • Checking required items', progress: 25, delay: 0 },
      { message: 'Running PDGM calculations • Computing payment grouping', progress: 50, delay: 800 },
      { message: 'Analyzing diagnosis codes • Checking comorbidity tiers', progress: 75, delay: 1600 },
      { message: 'Generating compliance alerts • Finalizing assessment', progress: 100, delay: 2400 },
    ];

    // Animate through each step
    steps.forEach((step) => {
      setTimeout(() => {
        if (statusEl) {
          statusEl.textContent = step.message;
        }
        if (progressBar) {
          progressBar.style.width = `${step.progress}%`;
        }
      }, step.delay);
    });

    // Hide overlay and complete
    setTimeout(() => {
      this.hideModal('save-processing-overlay');
      this.isSavingAssessment.set(false);

      // Mark as saved to enable alerts
      this.hasBeenSaved.set(true);
      this.computeAnalyzerAlerts();

      // Automatically show analyzer if there are alerts
      if (this.analyzerAlerts().length > 0) {
        this.showAnalyzer.set(true);

        // Scroll to top to show the analyzer alerts
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Reset progress bar for next time
      if (progressBar) {
        progressBar.style.width = '0%';
      }
    }, 3200);
  }

  handleReset(): void {
    console.log('🔄 Resetting form to initial pre-filled state...');

    // Clear all dynamically filled form fields
    this.clearDynamicFormFields();

    // Reset OasisStateService form state
    this.oasisStateService.resetForm();

    // Reset available documents to only referral-doc (initial state)
    this.oasisStateService.resetDocuments();
    this.documentStateService.resetDocuments();

    // Reset active document tab to referral/orders
    this.activeDocId.set('referral-doc');

    // Reset payment and alerts
    this.currentPayment.set(2875.5);
    this.paymentStateService.resetPayment();
    this.analyzerAlerts.set([]);
    this.oasisStateService.resetAlerts();

    // Update payment display in DOM (since it's directly manipulated)
    const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
    const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;
    if (pdgmValueEl) {
      pdgmValueEl.innerText = '$2,875.50';
    }
    if (paymentEstimateEl) {
      paymentEstimateEl.innerText = '$2,875.50';
    }

    // Reset all recommendations to pending
    this.aiRecommendations.update((recs) =>
      recs.map((rec) => ({ ...rec, status: 'pending' as AiRecommendationStatus }))
    );

    // Clear recommendation states from persistent storage
    this.aiRecommendations().forEach((rec) => {
      this.recommendationStateService.updateRecommendationStatus(rec.id, 'pending');
    });

    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((card) => card.classList.remove('accepted', 'rejected', 'selected'));

    // Refilter recommendations and alerts based on now-reset documents (only referral-doc)
    this.filterRecommendationsAndAlerts();

    // Restore items count to initial pre-filled value
    this.oasisStateService.updateItemsAccepted(this.initialPrefilledCount);
    const percentage = Math.round((this.initialPrefilledCount / this.totalItems()) * 100);
    console.log(`🔄 Form reset complete. Restored to initial pre-filled state: ${this.initialPrefilledCount} items (${percentage}%)`);
    console.log('📄 Available documents reset to: referral-doc only');

    // State changes automatically save to localStorage via OasisStateService
  }

  /**
   * Clear all dynamically filled form fields, keeping only the initial pre-filled values
   */
  private clearDynamicFormFields(): void {
    console.log('🧹 Clearing dynamic form fields...');

    // Reset all selects to their default state
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(select => {
      const selectEl = select as HTMLSelectElement;

      // Find the option with the 'selected' attribute in HTML
      let defaultOptionIndex = -1;
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].defaultSelected) {
          defaultOptionIndex = i;
          break;
        }
      }

      // Reset to default option or first option (usually empty)
      if (defaultOptionIndex >= 0) {
        selectEl.selectedIndex = defaultOptionIndex;
      } else {
        selectEl.selectedIndex = 0; // Reset to first option (usually empty)
      }
    });

    // Clear form fields that were populated by AI recommendations
    const formFields = document.querySelectorAll('.form-field-value, .border-emerald-400');
    formFields.forEach(field => {
      const fieldEl = field as HTMLElement;
      // Restore to placeholder state
      if (fieldEl.classList.contains('form-field-value')) {
        fieldEl.innerHTML = 'Click here to select';
        fieldEl.classList.remove(
          'form-field-value',
          'border-emerald-400',
          'bg-emerald-50',
          'border-solid'
        );
        fieldEl.classList.add(
          'form-field-placeholder',
          'border-dashed',
          'border-yellow-400',
          'bg-yellow-50',
          'text-slate-600',
          'justify-center'
        );
      }
    });

    // Clear dynamically added diagnosis entries (from Other Diagnoses container)
    const otherDiagnosesContainer = document.getElementById('form-I8000-other-diagnoses-container');
    if (otherDiagnosesContainer) {
      // Remove all dynamically added diagnosis entries
      const diagnosisEntries = otherDiagnosesContainer.querySelectorAll('.border-emerald-400');
      diagnosisEntries.forEach(entry => entry.remove());

      // Restore the placeholder if it was removed
      if (otherDiagnosesContainer.children.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'p-2 border-2 border-dashed border-slate-300 rounded min-h-[40px] flex items-center justify-center text-xs text-slate-500';
        placeholder.textContent = 'Additional diagnoses will appear here';
        otherDiagnosesContainer.appendChild(placeholder);
      }
    }

    // Reset all checkboxes to their default state
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      const checkboxEl = checkbox as HTMLInputElement;
      checkboxEl.checked = checkboxEl.defaultChecked;
    });

    // Reset text inputs to their default values (keep pre-filled ones)
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.readOnly) {
        inputEl.value = inputEl.defaultValue;
      }
    });

    // Reset date inputs to their default values
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      inputEl.value = inputEl.defaultValue;
    });

    // Reset number inputs to their default values
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.readOnly) {
        inputEl.value = inputEl.defaultValue;
      }
    });

    console.log('🧹 Dynamic form fields cleared');
  }

  handleExport(): void {
    // Validate form completeness before allowing export
    const validation = this.validateFormCompleteness();

    if (!validation.isComplete) {
      this.showValidationError(validation);
      return;
    }

    // If validation passes, show export modal
    this.showModal('export-modal');
  }

  private validateFormCompleteness(): { isComplete: boolean; missingFields: string[]; emptyCount: number } {
    const missingFields: string[] = [];

    // Check all select elements
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(select => {
      const selectEl = select as HTMLSelectElement;
      if (!selectEl.value || selectEl.value === '') {
        const label = selectEl.previousElementSibling?.textContent ||
                     selectEl.closest('div')?.querySelector('label')?.textContent ||
                     'Unnamed field';
        missingFields.push(label.trim());
      }
    });

    // Check required text inputs (exclude optional fields like SSN)
    const requiredTextInputs = document.querySelectorAll('input[type="text"]:not([placeholder*="###"])');
    requiredTextInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.readOnly && (!inputEl.value || inputEl.value === '')) {
        const label = inputEl.previousElementSibling?.textContent ||
                     inputEl.closest('div')?.querySelector('label')?.textContent ||
                     'Unnamed field';
        missingFields.push(label.trim());
      }
    });

    // Check date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.value || inputEl.value === '') {
        const label = inputEl.previousElementSibling?.textContent ||
                     inputEl.closest('div')?.querySelector('label')?.textContent ||
                     'Unnamed date field';
        missingFields.push(label.trim());
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields: missingFields.slice(0, 10), // Limit to first 10 for display
      emptyCount: missingFields.length
    };
  }

  private showValidationError(validation: { missingFields: string[]; emptyCount: number }): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-red-100 rounded-full p-3">
            <ion-icon name="alert-circle" class="text-red-600 text-3xl"></ion-icon>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-900 mb-2">Incomplete Assessment</h2>
            <p class="text-sm text-slate-600">
              ${validation.emptyCount} item${validation.emptyCount > 1 ? 's' : ''} must be completed before exporting.
            </p>
          </div>
        </div>

        <div class="bg-red-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          <p class="text-xs font-semibold text-red-900 mb-2 uppercase">Missing Items:</p>
          <ul class="text-sm text-red-800 space-y-1">
            ${validation.missingFields.map(field => `<li class="flex items-start gap-2">
              <ion-icon name="chevron-forward" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
              <span>${field}</span>
            </li>`).join('')}
            ${validation.emptyCount > 10 ? `<li class="text-xs text-red-600 italic">...and ${validation.emptyCount - 10} more</li>` : ''}
          </ul>
        </div>

        <div class="flex gap-3">
          <button
            onclick="this.closest('.fixed').remove()"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Complete Assessment
          </button>
          <button
            onclick="this.closest('.fixed').remove()"
            class="px-6 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(modal)) {
        modal.remove();
      }
    }, 30000);
  }

  handleRecommendationSelect(data: { recommendation: AiRecommendation; event: Event }): void {
    const { recommendation } = data;
    console.log('🔵 Recommendation selected:', recommendation.title);
    console.log('🔵 Switching to document:', recommendation.evidenceDocId);

    // Determine evidence category
    let category: 'diagnosis' | 'gg-self-care' | 'gg-mobility' | 'default' = 'default';

    if (recommendation.selectionOasisKey.startsWith('I8000')) {
      category = 'diagnosis';
    } else if (recommendation.selectionOasisKey.startsWith('GG0130')) {
      category = 'gg-self-care';
    } else if (recommendation.selectionOasisKey.startsWith('GG0170')) {
      category = 'gg-mobility';
    }

    // Update signals to trigger changes in child components
    this.activeDocId.set(recommendation.evidenceDocId);
    console.log('🔵 activeDocId signal set to:', this.activeDocId());

    // DIRECT APPROACH: Call switchTab directly on the child component
    if (this.documentViewerComponent) {
      console.log('🔵 Calling documentViewerComponent.switchTab directly');
      this.documentViewerComponent.switchTab(recommendation.evidenceDocId);
    }

    this.highlightEvidence.set({
      oasisId: recommendation.selectionOasisKey,
      category,
    });
  }

  handleRecommendationAccept(data: { recommendation: AiRecommendation; event: Event }): void {
    data.event.stopPropagation();
    const { recommendation } = data;

    // Determine which section contains this field and expand it
    const sectionId = this.getSectionIdForField(recommendation.formFieldId);
    if (sectionId) {
      this.expandSection(sectionId);
    }

    // Small delay to ensure section expansion animation completes before populating
    setTimeout(() => {
      // Populate form field
      const isOtherDiagnosis = recommendation.formFieldId === 'form-I8000-other-diagnoses-container';

      this.oasisFormComponent.populateField(
        recommendation.formFieldId,
        recommendation.acceptValue || recommendation.ggValue || '',
        isOtherDiagnosis
      );

      // Update progress
      this.oasisStateService.updateItemsAccepted(this.itemsAccepted() + 1);

      // Update PDGM if applicable
      if (recommendation.triggersPdgmUpdate) {
        this.updatePaymentDisplay(recommendation);
      }

      // Mark recommendation as accepted
      this.aiRecommendations.update((recs) =>
        recs.map((rec) =>
          rec.id === recommendation.id
            ? { ...rec, status: 'accepted' as AiRecommendationStatus }
            : rec
        )
      );

      // Save to persistent state
      this.recommendationStateService.updateRecommendationStatus(recommendation.id, 'accepted');

      // Recompute analyzer alerts to hide any linked to this accepted recommendation
      this.computeAnalyzerAlerts();

      // Update Summary Card comorbidity tier if needed
      if (recommendation.oasisTargetId === 'I8000-comorbidity') {
        const summaryComorbidityEl = document.getElementById('summary-comorbidity-tier');
        if (summaryComorbidityEl) {
          summaryComorbidityEl.innerText = 'High';
          summaryComorbidityEl.classList.add('form-field-highlight');
          setTimeout(() => summaryComorbidityEl.classList.remove('form-field-highlight'), 1500);
        }
      }
    }, 200);
  }

  /**
   * Determine which section contains a given form field
   */
  private getSectionIdForField(formFieldId: string): string | null {
    // Map form field IDs to their section IDs
    if (formFieldId.includes('I8000')) {
      return 'diagnoses';
    }
    if (formFieldId.includes('GG0170')) {
      return 'gg-mobility';
    }
    if (formFieldId.includes('GG0130')) {
      return 'gg-selfcare';
    }
    if (formFieldId.includes('GG0100')) {
      return 'gg-prior';
    }
    if (formFieldId.includes('GG0110')) {
      return 'gg-prior-device';
    }
    if (formFieldId.includes('M0') || formFieldId.includes('admin')) {
      return 'admin';
    }
    if (formFieldId.includes('A') || formFieldId.includes('demo')) {
      return 'demographics';
    }
    if (formFieldId.includes('B')) {
      return 'sensory';
    }
    if (formFieldId.includes('C')) {
      return 'cognitive';
    }
    if (formFieldId.includes('D')) {
      return 'mood';
    }
    if (formFieldId.includes('J1') || formFieldId.includes('J0')) {
      return 'health-conditions';
    }
    if (formFieldId.includes('K')) {
      return 'nutritional';
    }
    if (formFieldId.includes('M13') || formFieldId.includes('integument')) {
      return 'integumentary';
    }
    if (formFieldId.includes('M14') || formFieldId.includes('respiratory')) {
      return 'respiratory';
    }
    if (formFieldId.includes('M16') || formFieldId.includes('elimination')) {
      return 'elimination';
    }
    if (formFieldId.includes('M20') || formFieldId.includes('medication')) {
      return 'medications';
    }
    if (formFieldId.includes('N04') || formFieldId.includes('high-risk')) {
      return 'high-risk-drugs';
    }
    if (formFieldId.includes('M21') || formFieldId.includes('M22') || formFieldId.includes('care-mgmt')) {
      return 'care-management';
    }
    if (formFieldId.includes('O0') || formFieldId.includes('special')) {
      return 'special-treatments';
    }

    return null;
  }

  /**
   * Expand a specific section
   */
  private expandSection(sectionId: string): void {
    this.collapsedSections.update(sections => {
      const newSections = new Set(sections);
      newSections.delete(sectionId);
      return newSections;
    });
    console.log(`📂 Expanded section: ${sectionId}`);
  }

  handleRecommendationReject(data: { recommendation: AiRecommendation; event: Event }): void {
    data.event.stopPropagation();
    const { recommendation } = data;

    // Store the recommendation and show modal
    this.pendingRejectRecommendation = recommendation;

    // Update modal content
    const titleEl = document.getElementById('reject-modal-title');
    if (titleEl) {
      titleEl.textContent = recommendation.title;
    }

    // Clear previous reason
    const reasonEl = document.getElementById('reject-reason') as HTMLTextAreaElement | null;
    if (reasonEl) {
      reasonEl.value = '';
    }

    // Show the modal
    this.showModal('reject-modal');
  }

  confirmRejectRecommendation(): void {
    if (!this.pendingRejectRecommendation) return;

    const reasonEl = document.getElementById('reject-reason') as HTMLTextAreaElement | null;
    const reason = reasonEl?.value || '';

    // Log reason if provided (you could save this to a service/backend)
    if (reason) {
      console.log(`Rejection reason for ${this.pendingRejectRecommendation.id}:`, reason);
    }

    // Mark as rejected
    this.aiRecommendations.update((recs) =>
      recs.map((rec) =>
        rec.id === this.pendingRejectRecommendation?.id
          ? { ...rec, status: 'rejected' as AiRecommendationStatus }
          : rec
      )
    );

    // Save to persistent state
    this.recommendationStateService.updateRecommendationStatus(
      this.pendingRejectRecommendation.id,
      'rejected',
      reason
    );

    // Recompute analyzer alerts to show any linked to this rejected recommendation
    this.computeAnalyzerAlerts();

    // Clear pending and hide modal
    this.pendingRejectRecommendation = null;
    this.hideModal('reject-modal');
  }

  handleRecommendationUndo(data: { recommendation: AiRecommendation; event: Event }): void {
    data.event.stopPropagation();
    const { recommendation } = data;

    console.log('↩️ Undoing recommendation:', recommendation.id, 'Previous status:', recommendation.status);

    // If recommendation was accepted, we need to revert changes
    if (recommendation.status === 'accepted') {
      // Revert form field - clear the field value
      const formField = document.getElementById(recommendation.formFieldId) as HTMLElement | null;
      if (formField) {
        const isMultiDiagnosisContainer = recommendation.formFieldId === 'form-I8000-other-diagnoses-container';

        if (isMultiDiagnosisContainer) {
          // For multi-diagnosis containers, restore placeholder
          formField.innerHTML = `
            <div class="p-2 border-2 border-dashed border-yellow-400 rounded min-h-[40px] flex items-center justify-center text-slate-600 text-xs">
              Click 'Accept' on a diagnosis recommendation to add here
            </div>
          `;
        } else {
          // For single-value fields, restore placeholder style and content
          const placeholderText = formField.dataset['placeholder'] || 'Click Accept to fill';
          formField.innerHTML = placeholderText;
          formField.classList.remove(
            'form-field-value',
            'border-emerald-400',
            'bg-emerald-50',
            'border-solid'
          );
          formField.classList.add(
            'form-field-placeholder',
            'border-dashed',
            'border-yellow-400',
            'bg-yellow-50',
            'text-slate-600',
            'justify-center'
          );
        }
      }

      // Remove form field from OasisStateService
      this.oasisStateService.updateFormField(recommendation.formFieldId, '');

      // Decrement items count
      this.oasisStateService.updateItemsAccepted(Math.max(0, this.itemsAccepted() - 1));

      // Revert payment if applicable
      if (recommendation.triggersPdgmUpdate) {
        this.currentPayment.update((v) => Math.max(2875.5, v - 287));
        this.paymentStateService.updatePayment(this.currentPayment(), 0);

        // Update DOM elements
        const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
        const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;
        if (pdgmValueEl) {
          pdgmValueEl.innerText = '$' + this.currentPayment().toFixed(2);
        }
        if (paymentEstimateEl) {
          paymentEstimateEl.innerText = '$' + this.currentPayment().toFixed(2);
        }

        console.log('💰 Payment reverted to:', this.currentPayment());
      }

      // If it was comorbidity recommendation, reset tier display
      if (recommendation.oasisTargetId === 'I8000-comorbidity') {
        const summaryComorbidityEl = document.getElementById('summary-comorbidity-tier');
        if (summaryComorbidityEl) {
          summaryComorbidityEl.innerText = 'None';
        }
      }
    }

    // Reset recommendation status to pending
    this.aiRecommendations.update((recs) =>
      recs.map((rec) =>
        rec.id === recommendation.id
          ? { ...rec, status: 'pending' as AiRecommendationStatus }
          : rec
      )
    );

    // Update persistent state
    this.recommendationStateService.updateRecommendationStatus(recommendation.id, 'pending');

    // Recompute analyzer alerts
    this.computeAnalyzerAlerts();

    console.log('✅ Recommendation undone and reset to pending');
  }

  handleAlertClick(data: { alert: AnalyzerAlert; event?: Event }): void {
    if (data.event) {
      data.event.stopPropagation();
    }
    this.selectedAlertId.set(data.alert.id);

    // Focus evidence in document viewer
    if (data.alert.evidenceDocId) {
      this.activeDocId.set(data.alert.evidenceDocId);

      // DIRECT APPROACH: Call switchTab directly on the child component
      if (this.documentViewerComponent) {
        this.documentViewerComponent.switchTab(data.alert.evidenceDocId);
      }
    }

    if (data.alert.evidenceAnchorId) {
      // Wait for tab switch to complete before scrolling
      setTimeout(() => {
        const viewer = document.getElementById('document-viewer');
        if (!viewer) return;

        const el = viewer.querySelector(
          `[data-evidence-for="${data.alert.evidenceAnchorId}"]`
        ) as HTMLElement | null;

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('form-field-highlight');
          setTimeout(() => el.classList.remove('form-field-highlight'), 1500);
        }
      }, 100); // Small delay to allow tab switch animation to complete
    }
  }

  handleAlertStatusChange(data: { alert: AnalyzerAlert; status: AnalyzerAlertStatus }): void {
    this.analyzerAlerts.update((alerts) =>
      alerts.map((a) => (a.id === data.alert.id ? { ...a, status: data.status } : a))
    );
  }

  // ======= Helper Methods =======

  private updatePaymentDisplay(recommendation: AiRecommendation): void {
    const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
    const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;

    if (!pdgmValueEl || !pdgmValueEl.parentElement) return;

    // Create increase indicator
    const increaseEl = document.createElement('div');
    increaseEl.className =
      'absolute -top-10 right-0 text-emerald-600 font-black text-2xl animate-bounce z-50';
    increaseEl.innerHTML = '+$287';

    pdgmValueEl.parentElement.style.position = 'relative';
    pdgmValueEl.parentElement.appendChild(increaseEl);

    // Scale up dramatically
    pdgmValueEl.style.transform = 'scale(1.8)';
    pdgmValueEl.style.color = '#10b981';
    pdgmValueEl.style.fontWeight = '900';
    pdgmValueEl.style.transition = 'all 0.4s ease-in-out';

    setTimeout(() => {
      // Update payment - always ADD $287 to current value
      this.currentPayment.update((v) => v + 287);

      // Determine comorbidity adjustment based on which recommendation
      const comorbidityAdjustment = recommendation.oasisTargetId === 'I8000-comorbidity' ? 287.0 : 0;

      // Update shared payment state for patient-summary
      this.paymentStateService.updatePayment(this.currentPayment(), comorbidityAdjustment);

      pdgmValueEl.innerText = '$' + this.currentPayment().toFixed(2);
      if (paymentEstimateEl) {
        paymentEstimateEl.innerText = '$' + this.currentPayment().toFixed(2);
      }

      // Reset styling
      setTimeout(() => {
        pdgmValueEl.style.transform = 'scale(1)';
        pdgmValueEl.style.color = '';
        pdgmValueEl.style.fontWeight = '';
        increaseEl.remove();
      }, 2000);
    }, 400);
  }

  private computeAnalyzerAlerts(): void {
    // Only show alerts after assessment has been saved
    if (!this.hasBeenSaved()) {
      this.analyzerAlerts.set([]);
      return;
    }

    const available = this.availableDocs();

    this.analyzerAlerts.set(
      this.allAnalyzerAlerts().filter((alert) => {
        // Filter 1: Only show alerts for available documents
        if (!available.has(alert.evidenceDocId)) {
          return false;
        }

        // Filter 2: If alert has a linked recommendation, only show if that recommendation was rejected or is still pending
        if (alert.linkedRecommendationId) {
          const rec = this.aiRecommendations().find((r) => r.id === alert.linkedRecommendationId);
          // Show alert if recommendation is rejected OR still pending (user hasn't addressed it yet)
          return rec?.status === 'rejected' || rec?.status === 'pending';
        }

        // If no linked recommendation, always show the alert
        return true;
      })
    );
  }

  // ======= Modal Management =======

  showPage(pageId: string): void {
    const pages = ['copilot-page'];
    pages.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === pageId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }

  showModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('flex');
    modal.classList.remove('hidden');
  }

  hideModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  checkEligibility(): void {
    alert(
      '✓ Eligibility verified!\n\n' +
        'Patient: John Smith\n' +
        'Status: Active - Medicare Part A & B\n' +
        'Effective: 01/01/2024 - 12/31/2024\n' +
        'Home Health Benefit: Available'
    );
    this.hideModal('eligibility-modal');
  }

  recheckEligibility(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const recheckBtn = target.closest('button') as HTMLButtonElement | null;
    if (!recheckBtn) return;

    const originalHTML = recheckBtn.innerHTML;

    recheckBtn.innerHTML =
      '<ion-icon name="hourglass-outline" class="animate-spin"></ion-icon><span>Checking...</span>';
    recheckBtn.disabled = true;

    setTimeout(() => {
      recheckBtn.innerHTML = originalHTML;
      recheckBtn.disabled = false;
      this.updateEligibilityTimestamp();

      const timestamp = document.querySelector(
        '#eligibility-modal .text-xs.text-slate-500.text-center'
      ) as HTMLElement | null;

      if (timestamp) {
        timestamp.classList.add('text-emerald-600', 'font-semibold');
        setTimeout(() => {
          timestamp.classList.remove('text-emerald-600', 'font-semibold');
        }, 1500);
      }
    }, 1500);
  }

  updateEligibilityTimestamp(): void {
    const timestamp = document.querySelector(
      '#eligibility-modal .text-xs.text-slate-500.text-center p'
    ) as HTMLElement | null;

    if (timestamp) {
      timestamp.innerHTML = 'Last verified: Just now • Source: CMS Medicare Portal';
    }
  }

  exportToXML(): void {
    this.hideModal('export-modal');

    try {
      // Generate the XML content
      const xmlContent = this.generateOasisXML();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const patientName = 'john_smith'; // Default patient name
      const filename = `${patientName}_oasis_e1_soc_${timestamp}.xml`;

      // Create a Blob and trigger download
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success notification
      this.showExportNotification(filename);

      console.log('✅ OASIS XML exported successfully:', filename);
    } catch (error) {
      console.error('❌ Error exporting XML:', error);
      this.showExportErrorNotification();
    }
  }

  /**
   * Generate OASIS-E1 XML content from form data
   */
  private generateOasisXML(): string {
    const formData = this.collectFormData();
    const timestamp = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<OASISAssessment xmlns="http://www.cms.gov/oasis" version="E1">\n';
    xml += '  <Metadata>\n';
    xml += `    <ExportDate>${timestamp}</ExportDate>\n`;
    xml += `    <AssessmentType>Start of Care</AssessmentType>\n`;
    xml += `    <CompletionStatus>${this.itemsAccepted()}/${this.totalItems()}</CompletionStatus>\n`;
    xml += '  </Metadata>\n\n';

    // Administrative Section
    xml += '  <Administrative>\n';
    xml += `    <M0010>${this.escapeXML(formData['M0010'] || '')}</M0010>\n`;
    xml += `    <M0014>${this.escapeXML(formData['M0014'] || '')}</M0014>\n`;
    xml += `    <M0016>${this.escapeXML(formData['M0016'] || '')}</M0016>\n`;
    xml += `    <M0018>${this.escapeXML(formData['M0018'] || '')}</M0018>\n`;
    xml += `    <M0020>${this.escapeXML(formData['M0020'] || '')}</M0020>\n`;
    xml += `    <M0030>${this.escapeXML(formData['M0030'] || '')}</M0030>\n`;
    xml += `    <M0064>${this.escapeXML(formData['M0064'] || '')}</M0064>\n`;
    xml += `    <M0066>${this.escapeXML(formData['M0066'] || '')}</M0066>\n`;
    xml += `    <M0069>${this.escapeXML(formData['M0069'] || '')}</M0069>\n`;
    xml += `    <M0080>${this.escapeXML(formData['M0080'] || '')}</M0080>\n`;
    xml += `    <M0090>${this.escapeXML(formData['M0090'] || '')}</M0090>\n`;
    xml += `    <M0100>${this.escapeXML(formData['M0100'] || '')}</M0100>\n`;
    xml += `    <M0102>${this.escapeXML(formData['M0102'] || '')}</M0102>\n`;
    xml += `    <M0104>${this.escapeXML(formData['M0104'] || '')}</M0104>\n`;
    xml += `    <M0150>${this.escapeXML(formData['M0150'] || '')}</M0150>\n`;
    xml += '  </Administrative>\n\n';

    // Diagnoses Section
    xml += '  <Diagnoses>\n';
    xml += `    <I8000_Primary>${this.escapeXML(formData['I8000_primary'] || '')}</I8000_Primary>\n`;
    xml += `    <I8000_Comorbidity>${this.escapeXML(formData['I8000_comorbidity'] || '')}</I8000_Comorbidity>\n`;
    xml += `    <I8000_Other>${this.escapeXML(formData['I8000_other'] || '')}</I8000_Other>\n`;
    xml += '  </Diagnoses>\n\n';

    // Functional Status - GG Items
    xml += '  <FunctionalStatus>\n';
    xml += '    <PriorFunctioning>\n';
    Object.keys(formData).filter(k => k.startsWith('GG0100')).forEach(key => {
      xml += `      <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '    </PriorFunctioning>\n';
    xml += '    <SelfCare>\n';
    Object.keys(formData).filter(k => k.startsWith('GG0130')).forEach(key => {
      xml += `      <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '    </SelfCare>\n';
    xml += '    <Mobility>\n';
    Object.keys(formData).filter(k => k.startsWith('GG0170')).forEach(key => {
      xml += `      <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '    </Mobility>\n';
    xml += '  </FunctionalStatus>\n\n';

    // Clinical Status
    xml += '  <ClinicalStatus>\n';
    Object.keys(formData).filter(k => k.startsWith('B') || k.startsWith('C') || k.startsWith('D') || k.startsWith('J')).forEach(key => {
      xml += `    <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '  </ClinicalStatus>\n\n';

    // Medications
    xml += '  <Medications>\n';
    Object.keys(formData).filter(k => k.startsWith('M20') || k.startsWith('N04')).forEach(key => {
      xml += `    <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '  </Medications>\n\n';

    // Other M Items
    xml += '  <OtherClinical>\n';
    Object.keys(formData).filter(k => k.startsWith('M') && !k.startsWith('M0') && !k.startsWith('M20')).forEach(key => {
      xml += `    <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '  </OtherClinical>\n\n';

    // Care Management
    xml += '  <CareManagement>\n';
    Object.keys(formData).filter(k => k.startsWith('O')).forEach(key => {
      xml += `    <${key}>${this.escapeXML(formData[key] || '')}</${key}>\n`;
    });
    xml += '  </CareManagement>\n';

    xml += '</OASISAssessment>';

    return xml;
  }

  /**
   * Collect all form data from the DOM
   */
  private collectFormData(): Record<string, string> {
    const data: Record<string, string> = {};

    // Collect all select values
    document.querySelectorAll('select').forEach(select => {
      const id = (select as HTMLSelectElement).id;
      const value = (select as HTMLSelectElement).value;
      if (id && value) {
        data[id] = value;
      }
    });

    // Collect all text inputs
    document.querySelectorAll('input[type="text"]').forEach(input => {
      const id = (input as HTMLInputElement).id;
      const value = (input as HTMLInputElement).value;
      if (id && value) {
        data[id] = value;
      }
    });

    // Collect all date inputs
    document.querySelectorAll('input[type="date"]').forEach(input => {
      const id = (input as HTMLInputElement).id;
      const value = (input as HTMLInputElement).value;
      if (id && value) {
        data[id] = value;
      }
    });

    // Collect all number inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
      const id = (input as HTMLInputElement).id;
      const value = (input as HTMLInputElement).value;
      if (id && value) {
        data[id] = value;
      }
    });

    // Collect checked checkboxes
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
      const id = (checkbox as HTMLInputElement).id;
      if (id) {
        const currentValue = data[id] || '';
        data[id] = currentValue ? `${currentValue},checked` : 'checked';
      }
    });

    return data;
  }

  /**
   * Escape special XML characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Show success notification after export
   */
  private showExportNotification(filename: string): void {
    const notification = document.createElement('div');
    notification.className =
      'fixed top-24 right-8 bg-white border border-emerald-200 rounded-xl shadow-lg p-4 z-50';

    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="bg-emerald-500 rounded-full p-2">
          <ion-icon name="checkmark" class="text-white text-xl"></ion-icon>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">
            OASIS XML Downloaded
          </p>
          <p class="text-xs text-slate-500">
            ${filename}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  /**
   * Show error notification if export fails
   */
  private showExportErrorNotification(): void {
    const notification = document.createElement('div');
    notification.className =
      'fixed top-24 right-8 bg-white border border-red-200 rounded-xl shadow-lg p-4 z-50';

    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="bg-red-500 rounded-full p-2">
          <ion-icon name="alert-circle" class="text-white text-xl"></ion-icon>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">
            Export Failed
          </p>
          <p class="text-xs text-slate-500">
            Unable to generate XML file
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Toggle section collapse/expand
  toggleSection(sectionId: string): void {
    this.collapsedSections.update((sections) => {
      const newSections = new Set(sections);
      if (newSections.has(sectionId)) {
        newSections.delete(sectionId);
      } else {
        newSections.add(sectionId);
      }
      return newSections;
    });
  }

  // Check if section is collapsed
  isSectionCollapsed(sectionId: string): boolean {
    return this.collapsedSections().has(sectionId);
  }

  // Collapse all sections
  collapseAllSections(): void {
    const allSectionIds = [
      'admin',
      'demographics',
      'sensory',
      'cognitive',
      'mood',
      'diagnoses',
      'health-conditions',
      'gg-prior',
      'gg-prior-device',
      'gg-selfcare',
      'gg-mobility',
      'nutritional',
      'integumentary',
      'respiratory',
      'elimination',
      'medications',
      'high-risk-drugs',
      'care-management',
      'special-treatments',
    ];
    this.collapsedSections.set(new Set(allSectionIds));
  }

  // Expand all sections
  expandAllSections(): void {
    this.collapsedSections.set(new Set());
  }

  // Autofill form with demo data - ALL 89 items
  autofillDemoData(): void {
    // Expand all sections first for better UX
    this.expandAllSections();

    // Use setTimeout to ensure sections are expanded before filling
    setTimeout(() => {
      let filledCount = 0;

      // Helper to select option by value or text
      const selectOption = (selectElement: HTMLSelectElement, valueOrText: string) => {
        const options = Array.from(selectElement.options);
        const option = options.find(opt =>
          opt.value === valueOrText ||
          opt.text.includes(valueOrText) ||
          opt.value.includes(valueOrText)
        );
        if (option) {
          selectElement.value = option.value;
          filledCount++;
          return true;
        }
        return false;
      };

      // 1. ADMINISTRATIVE - Already filled by default (14 items counted)
      filledCount += 14;

      // 2. DEMOGRAPHICS (6 items) - Most already set
      filledCount += 6;

      // 3. SENSORY STATUS (2 items)
      const allSelects = document.querySelectorAll('select');
      allSelects.forEach(select => {
        const label = select.previousElementSibling?.textContent || '';
        if (label.includes('B1000') || label.includes('Vision')) {
          selectOption(select, '0'); // Sees adequately
        }
        if (label.includes('B1200') || label.includes('Hearing')) {
          selectOption(select, '0'); // No difficulty
        }
      });

      // 4. COGNITIVE PATTERNS (8 items) - BIMS Assessment
      // C0100
      document.querySelectorAll('select').forEach(select => {
        if (select.previousElementSibling?.textContent?.includes('C0100')) {
          selectOption(select, '1'); // Yes, conduct BIMS
        }
      });

      // C0200-C0500 - Number inputs for BIMS scores (already have demo values)
      filledCount += 8;

      // 5. MOOD (2 items) - PHQ scores already set with values
      filledCount += 2;

      // 6. DIAGNOSES (3 items) - Already handled by AI
      filledCount += 3;

      // 7. HEALTH CONDITIONS - J Items (4 items)
      allSelects.forEach(select => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('J0510')) {
          selectOption(select, '1'); // Pain affects sleep
        }
        if (prevText.includes('J1800')) {
          selectOption(select, '0'); // No falls
        }
        if (prevText.includes('J2030')) {
          selectOption(select, '1'); // Mild dyspnea
        }
      });

      // 8. GG0100 PRIOR FUNCTIONING (3 items)
      document.querySelectorAll('select').forEach(select => {
        const id = select.id || '';
        if (id.includes('GG0100A')) selectOption(select, '0'); // Independent
        if (id.includes('GG0100B')) selectOption(select, '0'); // Independent
        if (id.includes('GG0100C')) selectOption(select, '0'); // Independent
      });

      // 9. GG0110 PRIOR DEVICE USE (1 item with checkboxes)
      const deviceCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      deviceCheckboxes.forEach(checkbox => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('walker')) {
          (checkbox as HTMLInputElement).checked = true;
          filledCount++;
        }
      });

      // 10. GG0130 SELF-CARE (7 items)
      const selfCareValues = ['06', '05', '04', '03', '02', '03', '03'];
      const selfCareSelects = document.querySelectorAll('select[id^="GG0130"]');
      selfCareSelects.forEach((select, index) => {
        const val = selfCareValues[index] || '04';
        selectOption(select as HTMLSelectElement, val);
      });

      // 11. GG0170 MOBILITY (17 items - includes all mobility sub-items)
      const mobilityValues = ['06', '05', '04', '03', '02', '03', '03', '04', '02', '03', '04', '03', '02', '03', '04', '02', '03'];
      const mobilitySelects = document.querySelectorAll('select[id^="GG0170"]');
      mobilitySelects.forEach((select, index) => {
        const val = mobilityValues[index] || '03';
        selectOption(select as HTMLSelectElement, val);
      });

      // 12. NUTRITIONAL - K0520 (1 item with checkboxes)
      const nutritionCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      nutritionCheckboxes.forEach(checkbox => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('therapeutic diet')) {
          (checkbox as HTMLInputElement).checked = true;
          filledCount++;
        }
      });

      // 13. INTEGUMENTARY - M Items (7 items)
      allSelects.forEach(select => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('M1306')) selectOption(select, '0'); // No pressure ulcers
        if (prevText.includes('M1330')) selectOption(select, '0'); // No stasis ulcers
        if (prevText.includes('M1340')) selectOption(select, '0'); // No surgical wounds
        if (prevText.includes('M1350')) selectOption(select, '0'); // No lesions
      });

      // 14. RESPIRATORY - M1400 (1 item)
      allSelects.forEach(select => {
        if (select.previousElementSibling?.textContent?.includes('M1400')) {
          selectOption(select, '1'); // Mild dyspnea
        }
      });

      // 15. ELIMINATION - M Items (4 items)
      allSelects.forEach(select => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('M1600')) selectOption(select, '0'); // No UTI
        if (prevText.includes('M1610')) selectOption(select, '0'); // No incontinence
        if (prevText.includes('M1620')) selectOption(select, '0'); // No bowel incontinence
        if (prevText.includes('M1630')) selectOption(select, 'NA'); // No ostomy
      });

      // 16. MEDICATIONS - M Items (6 items)
      allSelects.forEach(select => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('M2001')) selectOption(select, '0'); // Drug review completed
        if (prevText.includes('M2003')) selectOption(select, 'NA'); // No follow-up needed
        if (prevText.includes('M2005')) selectOption(select, 'NA'); // No intervention
        if (prevText.includes('M2010')) selectOption(select, '0'); // Education provided
        if (prevText.includes('M2020')) selectOption(select, '0'); // Independent with oral meds
        if (prevText.includes('M2030')) selectOption(select, 'NA'); // No injectable meds
      });

      // 17. HIGH-RISK DRUGS - N0415 (6 checkboxes = 1 item)
      const drugCheckboxes = document.querySelectorAll('input[id^="N0415"]');
      if (drugCheckboxes.length >= 2) {
        (drugCheckboxes[0] as HTMLInputElement).checked = true; // Anticoagulant
        (drugCheckboxes[1] as HTMLInputElement).checked = true; // Antiplatelet
        filledCount++;
      }

      // 18. CARE MANAGEMENT - M Items (4 items)
      // M2102, M2250 are checkbox groups
      const careCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      careCheckboxes.forEach(checkbox => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('adl')) {
          (checkbox as HTMLInputElement).checked = true;
        }
        if (label.toLowerCase().includes('medication')) {
          (checkbox as HTMLInputElement).checked = true;
        }
      });
      filledCount += 2;

      // 19. SPECIAL TREATMENTS - O Items (2 items)
      allSelects.forEach(select => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('O0350')) {
          selectOption(select, '1'); // COVID vaccination up to date
        }
      });
      const treatmentCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      treatmentCheckboxes.forEach(checkbox => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('physical therapy')) {
          (checkbox as HTMLInputElement).checked = true;
          filledCount++;
        }
      });

      // FINAL PASS: Fill any remaining empty selects with smart defaults
      setTimeout(() => {
        const allSelectsForFinalPass = document.querySelectorAll('select');
        allSelectsForFinalPass.forEach(select => {
          const selectEl = select as HTMLSelectElement;

          // Skip if already has a value selected
          if (selectEl.value && selectEl.value !== '') {
            return;
          }

          // Get context from label
          const label = selectEl.previousElementSibling?.textContent || '';
          const parentText = selectEl.parentElement?.textContent || '';
          const contextText = (label + ' ' + parentText).toLowerCase();

          // Smart defaults based on context
          if (contextText.includes('na') || contextText.includes('not applicable')) {
            // If NA is an option, select it
            const naOption = Array.from(selectEl.options).find(opt =>
              opt.value === 'NA' || opt.text.includes('NA') || opt.text.includes('Not applicable')
            );
            if (naOption) {
              selectEl.value = naOption.value;
              return;
            }
          }

          // For yes/no questions, default to "No" (0) unless it's negative
          if (contextText.includes('yes') || contextText.includes('no')) {
            const noOption = Array.from(selectEl.options).find(opt =>
              opt.value === '0' || opt.text.toLowerCase().includes('no')
            );
            if (noOption) {
              selectEl.value = noOption.value;
              return;
            }
          }

          // For medication/intervention questions, default to appropriate value
          if (contextText.includes('medication') || contextText.includes('intervention')) {
            const firstReasonableOption = Array.from(selectEl.options).find(opt =>
              opt.value === '0' || opt.value === 'NA' || opt.text.includes('No')
            );
            if (firstReasonableOption) {
              selectEl.value = firstReasonableOption.value;
              return;
            }
          }

          // Default: Select first non-empty option if nothing else worked
          if (selectEl.options.length > 0) {
            for (let i = 0; i < selectEl.options.length; i++) {
              if (selectEl.options[i].value !== '') {
                selectEl.value = selectEl.options[i].value;
                break;
              }
            }
          }
        });

        // Fill any empty number inputs with reasonable defaults
        document.querySelectorAll('input[type="number"]').forEach(input => {
          const inputEl = input as HTMLInputElement;
          if (!inputEl.value || inputEl.value === '') {
            const min = parseInt(inputEl.min) || 0;
            const max = parseInt(inputEl.max) || 10;
            // Set to middle value or min if readonly
            inputEl.value = inputEl.readOnly ? '0' : Math.floor((min + max) / 2).toString();
          }
        });

        // Set realistic completion count (all 89 items)
        this.oasisStateService.updateItemsAccepted(89);

        // Accept all AI recommendations since all items are now filled
        this.acceptAllRecommendations();

        this.showAutofillNotification();
      }, 100);
    }, 300);
  }

  /**
   * Accept all AI recommendations - used during demo autofill
   */
  private acceptAllRecommendations(): void {
    // Update all recommendations to 'accepted' status
    this.aiRecommendations.update((recs) =>
      recs.map((rec) => ({
        ...rec,
        status: 'accepted' as AiRecommendationStatus,
      }))
    );

    // Save all recommendation states to persistent storage
    this.aiRecommendations().forEach((rec) => {
      this.recommendationStateService.updateRecommendationStatus(rec.id, 'accepted');
    });

    // Recompute analyzer alerts to hide any linked to accepted recommendations
    this.computeAnalyzerAlerts();

    console.log('✅ All AI recommendations accepted during demo autofill');
  }

  private showAutofillNotification(): void {
    const notification = document.createElement('div');
    notification.className =
      'fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-l-4 border-indigo-500 z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="bg-indigo-500 rounded-full p-2">
          <ion-icon name="checkmark-done" class="text-white text-xl"></ion-icon>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">
            Demo Data Loaded
          </p>
          <p class="text-xs text-slate-500">
            Form populated with sample assessment data
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}
