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
    doc8: 'audio-doc' as const,
  };

  @ViewChild(OasisFormComponent) oasisFormComponent!: OasisFormComponent;
  @ViewChild(OasisDocumentViewerComponent) documentViewerComponent!: OasisDocumentViewerComponent;

  // Signals for shared state
  totalItems = signal(89);
  baseRate = signal(2875.5);
  functionalAdjustment = signal(0);
  comorbidityAdjustment = signal(0);
  currentPayment = computed(() => this.baseRate() + this.functionalAdjustment() + this.comorbidityAdjustment());
  comorbidityTier = signal('None');
  functionalLevel = signal('Low');
  showAnalyzer = signal(false);
  isSavingAssessment = signal(false);
  hasBeenSaved = signal(false); // Track if assessment has been saved
  selectedAlertId = signal<string | null>(null);
  activeDocId = signal<'discharge-doc' | 'referral-doc' | 'visit-doc' | 'audio-doc'>(
    'referral-doc'
  ); // Default to referral since it's the only one uploaded initially
  highlightEvidence = signal<EvidenceHighlight | null>(null);

  // Computed from OasisStateService
  itemsAccepted = computed(() => this.oasisStateService.form().itemsAccepted);
  availableDocs = computed(() => {
    const docs = this.oasisStateService.documents() as (
      | 'discharge-doc'
      | 'referral-doc'
      | 'visit-doc'
      | 'audio-doc'
    )[];
    // Only include audio-doc if the visit recording has been uploaded
    const audioUploaded = this.documentStateService.getDocumentStatus('doc8');
    if (audioUploaded) {
      return new Set([...docs, 'audio-doc'] as const);
    }
    return new Set(docs);
  });

  // Audio URL - only available if visit recording was uploaded
  audioUrl = computed(() => {
    const audioUploaded = this.documentStateService.getDocumentStatus('doc8');
    return audioUploaded ? '/johnSmith_Nurse_Visit.mp3' : null;
  });

  // Visit Note availability - check if doc5 (visit note) is uploaded
  isVisitNoteAvailable = computed(() => {
    return !!this.documentStateService.getDocumentStatus('doc5');
  });

  // Track collapsed form sections
  collapsedSections = signal<Set<string>>(new Set());

  // Eligibility check date tracking
  lastEligibilityCheck = signal<Date>(new Date());

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
      triggersPdgmUpdate: false,
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
      contextLabel: 'Functional adjustment',
      evidenceDocLabel: 'Referral / Therapy notes',
      badgeLabel: 'High impact',
      badgeClass: 'bg-purple-50 text-purple-700',
      selectionOasisKey: 'GG0170-mobility',
      evidenceDocId: 'referral-doc',
      formFieldId: 'form-GG0170C-answer',
      oasisTargetId: 'GG0170C',
      ggValue: '03',
      triggersPdgmUpdate: true,
      progressIncrement: 0,
      status: 'pending',
    },
    // ===== VISIT NOTE RECOMMENDATIONS =====
    {
      id: 'rec-pad',
      kind: 'icd',
      headerLabel: 'Additional Comorbidity • I8000',
      title: 'I73.9 – Peripheral arterial disease, unspecified',
      rationaleHtml:
        'Visit note documents <span class="font-semibold">peripheral arterial disease</span> with claudication pattern (pain relieved by rest), diminished pedal pulses, cool extremities bilaterally, and concerning right great toe discoloration suggestive of ischemia. This supports adding I73.9 as a comorbidity.',
      contextLabel: 'Comorbidity adjustment',
      evidenceDocLabel: 'Visit Note',
      badgeLabel: 'High impact',
      badgeClass: 'bg-blue-50 text-blue-700',
      selectionOasisKey: 'I8000-pad',
      evidenceDocId: 'visit-doc',
      formFieldId: 'form-I8000-other-diagnoses-container',
      oasisTargetId: 'I8000-pad',
      acceptValue: 'I73.9 - Peripheral arterial disease, unspecified',
      triggersPdgmUpdate: true,
      progressIncrement: 5,
      status: 'pending',
    },
    {
      id: 'rec-falls',
      kind: 'gg',
      headerLabel: 'Fall Risk • J1800',
      title: '1 – Yes, patient has had falls since SOC/ROC',
      rationaleHtml:
        'Visit note documents <span class="font-semibold">near-fall in bathroom</span> last week where patient grabbed towel bar. Nurse assessment notes high fall risk with unsteady gait and inconsistent walker use. This supports coding J1800 as "Yes" for falls.',
      contextLabel: 'Patient Safety',
      evidenceDocLabel: 'Visit Note',
      badgeLabel: 'Safety alert',
      badgeClass: 'bg-red-50 text-red-700',
      selectionOasisKey: 'J1800-falls',
      evidenceDocId: 'visit-doc',
      formFieldId: 'J1800-select',
      oasisTargetId: 'J1800',
      ggValue: '1',
      triggersPdgmUpdate: false,
      progressIncrement: 0,
      status: 'pending',
    },
    {
      id: 'rec-dyspnea',
      kind: 'gg',
      headerLabel: 'Respiratory Status • J2030',
      title: '1 – Shortness of breath when walking more than 20 feet, climbing stairs',
      rationaleHtml:
        'Visit note documents <span class="font-semibold">shortness of breath with stairs</span> requiring patient to stop halfway. Also notes orthopnea requiring 3 pillows (increased from 1) and possible volume overload. This supports coding J2030 at level 1.',
      contextLabel: 'Functional limitation',
      evidenceDocLabel: 'Visit Note',
      selectionOasisKey: 'M1400-dyspnea',
      evidenceDocId: 'visit-doc',
      formFieldId: 'J2030-select',
      oasisTargetId: 'J2030',
      ggValue: '1',
      triggersPdgmUpdate: false,
      progressIncrement: 0,
      status: 'pending',
    },
    {
      id: 'rec-bathing',
      kind: 'gg',
      headerLabel: 'Self-Care • GG0130E',
      title: '02 – Substantial/maximal assistance for showering/bathing',
      rationaleHtml:
        'Visit note documents patient <span class="font-semibold">uses shower chair and requires assistance from daughter for safety</span> during bathing. This supports coding GG0130E at substantial/maximal assistance level (02).',
      contextLabel: 'Functional Status',
      evidenceDocLabel: 'Visit Note',
      selectionOasisKey: 'GG0130-bathing',
      evidenceDocId: 'visit-doc',
      formFieldId: 'form-GG0130E-answer',
      oasisTargetId: 'GG0130E',
      ggValue: '02',
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
      id: 'alert-hearing-inconsistent',
      type: 'inconsistency',
      severity: 'medium',
      status: 'new',
      title: 'Hearing impairment documented in visit but not captured in OASIS',
      description:
        'Visit recording indicates patient has difficulty hearing, requiring nurse to speak louder and repeat questions multiple times. Patient states hearing has "gotten worse" and mentions not wearing hearing aids. This functional limitation is not currently documented in the OASIS assessment.',
      evidenceDocId: 'audio-doc',
      evidenceAnchorId: 'transcript-hearing',
      relatedOasisItem: 'Sensory Status / B1000',
      oasisFormFieldId: 'form-B1000-Vision-container',
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
    this.restorePaymentState(); // Restore payment from localStorage
    this.handleNavigationState();
    // Items accepted count restored automatically by OasisStateService
    this.collapseAllSections(); // Start with all sections collapsed
    this.showPage('copilot-page');
  }

  /**
   * Restore payment state from localStorage via payment state service
   */
  private restorePaymentState(): void {
    const savedPayment = this.paymentStateService.payment();
    if (savedPayment.comorbidityAdjustment > 0) {
      this.comorbidityAdjustment.set(savedPayment.comorbidityAdjustment);
      // Update tier based on restored adjustment
      if (savedPayment.comorbidityAdjustment >= 574) {
        this.comorbidityTier.set('High');
      } else {
        this.comorbidityTier.set('Low');
      }
      console.log('💰 Restored comorbidity adjustment:', savedPayment.comorbidityAdjustment);
    }
    if (savedPayment.functionalAdjustment > 0) {
      this.functionalAdjustment.set(savedPayment.functionalAdjustment);
      this.functionalLevel.set('Medium');
      console.log('💰 Restored functional adjustment:', savedPayment.functionalAdjustment);
    }
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
    const available = new Set<'discharge-doc' | 'referral-doc' | 'visit-doc' | 'audio-doc'>();

    // Check each document using the DocumentStateService
    Object.entries(this.DOC_MAPPING).forEach(([patientSummaryDocId, oasisDocId]) => {
      if (this.documentStateService.isDocumentUploaded(patientSummaryDocId)) {
        available.add(oasisDocId);
      }
    });

    // Referral doc (doc2) is always available by default (hardcoded in patient-summary)
    available.add('referral-doc');

    // Update OasisStateService with available documents
    available.forEach((docId) => this.oasisStateService.addAvailableDocument(docId));
    console.log('📄 Available documents:', Array.from(available));
  }

  /**
   * Keep pending recommendations at the top for clearer triage.
   */
  private sortRecommendationsByStatus(recs: AiRecommendation[]): AiRecommendation[] {
    const order: Record<AiRecommendationStatus, number> = {
      pending: 0,
      accepted: 1,
      rejected: 2,
    };
    return [...recs].sort((a, b) => order[a.status] - order[b.status]);
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
    this.aiRecommendations.set(this.sortRecommendationsByStatus(filteredRecs));
    console.log(
      '📋 Filtered recommendations:',
      filteredRecs.length,
      'of',
      this.allAiRecommendations().length
    );

    // Filter analyzer alerts to only show those with available evidence documents
    const filteredAlerts = this.allAnalyzerAlerts().filter((alert) =>
      available.has(alert.evidenceDocId)
    );
    this.analyzerAlerts.set(filteredAlerts);
    console.log(
      '⚠️ Filtered analyzer alerts:',
      filteredAlerts.length,
      'of',
      this.allAnalyzerAlerts().length
    );
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
      this.sortRecommendationsByStatus(
        recs.map((rec) => {
          const savedState = savedStates.get(rec.id);
          if (savedState) {
            console.log(`💾 Restoring ${rec.id} status: ${savedState.status}`);
            return { ...rec, status: savedState.status };
          }
          return rec;
        })
      )
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
      sectionsToExpand.forEach((sectionId) => this.expandSection(sectionId));

      // Populate fields after a brief delay to allow sections to expand
      // Note: We do NOT increment itemsAccepted here because the count is already
      // persisted in localStorage and restored. Only increment when newly accepting.
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

            // NOTE: Do NOT call updatePaymentDisplay here!
            // Payment state is already restored from localStorage in restorePaymentState()
            // Calling it here would add $287 again on every page load
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
        console.log(
          `💾 Set initial pre-filled count: ${this.initialPrefilledCount} items (${Math.round(
            (this.initialPrefilledCount / this.totalItems()) * 100
          )}%)`
        );
      } else {
        console.log(
          `💾 Restored from saved state: ${currentCount} items (${Math.round(
            (currentCount / this.totalItems()) * 100
          )}%)`
        );
      }
    }, 500);
  }

  // ======= Event Handlers from Child Components =======

  handleBackToDashboard(): void {
    this.router.navigate(['/patients', 'p1', 'summary']);
  }

  navigateToPatientSummary(): void {
    this.router.navigate(['/patients', 'p1', 'summary']);
  }

  navigateToPatientList(): void {
    this.router.navigate(['/patients']);
  }

  handleVisitNoteGenerated(): void {
    // Mark the visit note as uploaded in the document state service
    this.documentStateService.markDocumentAsUploaded('doc5', 'AI_Generated_Visit_Note.pdf');

    // Update available docs to include visit-doc
    this.oasisStateService.addAvailableDocument('visit-doc');

    // Show a success notification
    this.showNotification('Visit Note generated successfully!', 'success');

    // Optionally switch to the visit note tab
    setTimeout(() => {
      this.activeDocId.set('visit-doc');
    }, 500);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all transform ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <ion-icon name="${
          type === 'success' ? 'checkmark-circle' : 'alert-circle'
        }" class="text-xl"></ion-icon>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
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
      {
        message: 'Running PDGM calculations • Computing payment grouping',
        progress: 50,
        delay: 800,
      },
      {
        message: 'Analyzing diagnosis codes • Checking comorbidity tiers',
        progress: 75,
        delay: 1600,
      },
      {
        message: 'Generating compliance alerts • Finalizing assessment',
        progress: 100,
        delay: 2400,
      },
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
    this.baseRate.set(2875.5);
    this.functionalAdjustment.set(0);
    this.functionalLevel.set('Low');
    this.comorbidityAdjustment.set(0);
    this.comorbidityTier.set('None');
    this.paymentStateService.resetPayment();
    this.analyzerAlerts.set([]);
    this.oasisStateService.resetAlerts();

    // Update payment display in DOM (since it's directly manipulated during animations)
    const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
    const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;
    const resetPaymentValue = '$' + this.currentPayment().toFixed(2);
    if (pdgmValueEl) {
      pdgmValueEl.innerText = resetPaymentValue;
    }
    if (paymentEstimateEl) {
      paymentEstimateEl.innerText = resetPaymentValue;
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
    console.log(
      `🔄 Form reset complete. Restored to initial pre-filled state: ${this.initialPrefilledCount} items (${percentage}%)`
    );
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
    allSelects.forEach((select) => {
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
    formFields.forEach((field) => {
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
      diagnosisEntries.forEach((entry) => entry.remove());

      // Restore the placeholder if it was removed
      if (otherDiagnosesContainer.children.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className =
          'p-2 border-2 border-dashed border-slate-300 rounded min-h-[40px] flex items-center justify-center text-xs text-slate-500';
        placeholder.textContent = 'Additional diagnoses will appear here';
        otherDiagnosesContainer.appendChild(placeholder);
      }
    }

    // Reset all checkboxes to their default state
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach((checkbox) => {
      const checkboxEl = checkbox as HTMLInputElement;
      checkboxEl.checked = checkboxEl.defaultChecked;
    });

    // Reset text inputs to their default values (keep pre-filled ones)
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.readOnly) {
        inputEl.value = inputEl.defaultValue;
      }
    });

    // Reset date inputs to their default values
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;
      inputEl.value = inputEl.defaultValue;
    });

    // Reset number inputs to their default values
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;
      if (!inputEl.readOnly) {
        inputEl.value = inputEl.defaultValue;
      }
    });

    console.log('🧹 Dynamic form fields cleared');
  }

  handleExport(): void {
    // First, check the actual OASIS completion percentage
    const completionPercentage = this.oasisStateService.progressPercentage;
    const requiredPercentage = 80; // Require at least 80% completion
    const currentItems = this.itemsAccepted();
    const totalItems = this.totalItems();

    if (completionPercentage < requiredPercentage) {
      this.showCompletionPercentageError(
        completionPercentage,
        requiredPercentage,
        currentItems,
        totalItems
      );
      return;
    }

    // Secondary check: validate visible fields are filled
    const validation = this.validateFormCompleteness();

    if (!validation.isComplete) {
      this.showValidationError(validation);
      return;
    }

    // If all validations pass, show export modal
    this.showModal('export-modal');
  }

  private validateFormCompleteness(): {
    isComplete: boolean;
    missingFields: string[];
    emptyCount: number;
  } {
    const missingFields: string[] = [];

    // Helper function to check if an element is visible
    const isElementVisible = (el: HTMLElement): boolean => {
      if (!el) return false;

      // Check if element or any parent is hidden
      let current: HTMLElement | null = el;
      while (current) {
        const style = window.getComputedStyle(current);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          current.classList.contains('hidden')
        ) {
          return false;
        }

        // Check if in collapsed accordion section (max-height: 0)
        if (
          current.classList.contains('max-h-0') ||
          (style.maxHeight === '0px' && style.overflow === 'hidden')
        ) {
          return false;
        }

        current = current.parentElement;
      }
      return true;
    };

    // Check all select elements (only visible ones)
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach((select) => {
      const selectEl = select as HTMLSelectElement;

      // Skip if element is not visible, disabled, or in a collapsed section
      if (!isElementVisible(selectEl) || selectEl.disabled) {
        return;
      }

      if (!selectEl.value || selectEl.value === '') {
        const label =
          selectEl.previousElementSibling?.textContent ||
          selectEl.closest('div')?.querySelector('label')?.textContent ||
          'Unnamed field';
        missingFields.push(label.trim());
      }
    });

    // Check required text inputs (exclude optional fields like SSN)
    const requiredTextInputs = document.querySelectorAll(
      'input[type="text"]:not([placeholder*="###"])'
    );
    requiredTextInputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;

      // Skip if element is not visible, disabled, or readonly
      if (!isElementVisible(inputEl) || inputEl.disabled || inputEl.readOnly) {
        return;
      }

      if (!inputEl.value || inputEl.value === '') {
        const label =
          inputEl.previousElementSibling?.textContent ||
          inputEl.closest('div')?.querySelector('label')?.textContent ||
          'Unnamed field';
        missingFields.push(label.trim());
      }
    });

    // Check date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;

      // Skip if element is not visible or disabled
      if (!isElementVisible(inputEl) || inputEl.disabled) {
        return;
      }

      if (!inputEl.value || inputEl.value === '') {
        const label =
          inputEl.previousElementSibling?.textContent ||
          inputEl.closest('div')?.querySelector('label')?.textContent ||
          'Unnamed date field';
        missingFields.push(label.trim());
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields: missingFields.slice(0, 10), // Limit to first 10 for display
      emptyCount: missingFields.length,
    };
  }

  private showValidationError(validation: { missingFields: string[]; emptyCount: number }): void {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-red-100 rounded-full p-3">
            <ion-icon name="alert-circle" class="text-red-600 text-3xl"></ion-icon>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-900 mb-2">Incomplete Assessment</h2>
            <p class="text-sm text-slate-600">
              ${validation.emptyCount} item${
      validation.emptyCount > 1 ? 's' : ''
    } must be completed before exporting.
            </p>
          </div>
        </div>

        <div class="bg-red-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          <p class="text-xs font-semibold text-red-900 mb-2 uppercase">Missing Items:</p>
          <ul class="text-sm text-red-800 space-y-1">
            ${validation.missingFields
              .map(
                (field) => `<li class="flex items-start gap-2">
              <ion-icon name="chevron-forward" class="text-red-600 flex-shrink-0 mt-0.5"></ion-icon>
              <span>${field}</span>
            </li>`
              )
              .join('')}
            ${
              validation.emptyCount > 10
                ? `<li class="text-xs text-red-600 italic">...and ${
                    validation.emptyCount - 10
                  } more</li>`
                : ''
            }
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

  private showCompletionPercentageError(
    currentPercentage: number,
    requiredPercentage: number,
    currentItems: number,
    totalItems: number
  ): void {
    const remainingItems = totalItems - currentItems;
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-amber-100 rounded-full p-3">
            <ion-icon name="warning" class="text-amber-600 text-3xl"></ion-icon>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-slate-900 mb-2">Assessment Incomplete</h2>
            <p class="text-sm text-slate-600">
              The OASIS assessment must be at least ${requiredPercentage}% complete before you can finalize and export.
            </p>
          </div>
        </div>

        <div class="bg-amber-50 rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-center flex-1">
              <div class="text-3xl font-bold text-amber-600">${currentPercentage}%</div>
              <div class="text-xs text-slate-600 mt-1">Current Progress</div>
            </div>
            <div class="text-slate-400 text-2xl">→</div>
            <div class="text-center flex-1">
              <div class="text-3xl font-bold text-emerald-600">${requiredPercentage}%</div>
              <div class="text-xs text-slate-600 mt-1">Required</div>
            </div>
          </div>

          <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div class="bg-amber-500 h-full transition-all duration-300" style="width: ${currentPercentage}%"></div>
          </div>

          <div class="mt-4 pt-4 border-t border-amber-200">
            <div class="flex justify-between text-sm">
              <span class="text-slate-700">
                <span class="font-semibold text-amber-700">${currentItems}</span> of <span class="font-semibold">${totalItems}</span> items completed
              </span>
              <span class="font-semibold text-red-700">
                ${remainingItems} remaining
              </span>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p class="text-sm text-blue-900">
            <span class="font-semibold">💡 Tip:</span> Complete at least ${
              Math.ceil((requiredPercentage / 100) * totalItems) - currentItems
            } more OASIS item${
      Math.ceil((requiredPercentage / 100) * totalItems) - currentItems !== 1 ? 's' : ''
    } to reach ${requiredPercentage}% and enable export.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            onclick="this.closest('.fixed').remove()"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Continue Assessment
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
      const value = recommendation.acceptValue || recommendation.ggValue || '';
      const isOtherDiagnosis =
        recommendation.formFieldId === 'form-I8000-other-diagnoses-container';
      const isSelectField = recommendation.formFieldId.endsWith('-select');

      if (isSelectField) {
        // Handle select elements directly
        const selectEl = document.getElementById(
          recommendation.formFieldId
        ) as HTMLSelectElement | null;
        if (selectEl) {
          selectEl.value = value;
          // Add highlight animation
          selectEl.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2');
          setTimeout(() => {
            selectEl.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2');
          }, 1500);
          // Scroll to field
          selectEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Persist to state service
          this.oasisStateService.updateFormField(recommendation.formFieldId, value);
        }
      } else {
        // Populate form field via component (for div-based fields)
        this.oasisFormComponent.populateField(recommendation.formFieldId, value, isOtherDiagnosis);
      }

      // Update progress
      this.oasisStateService.updateItemsAccepted(this.itemsAccepted() + 1);

      // Update PDGM if applicable
      if (recommendation.triggersPdgmUpdate) {
        this.updatePaymentDisplay(recommendation);
      }

      // Mark recommendation as accepted
      this.aiRecommendations.update((recs) =>
        this.sortRecommendationsByStatus(
          recs.map((rec) =>
            rec.id === recommendation.id
              ? { ...rec, status: 'accepted' as AiRecommendationStatus }
              : rec
          )
        )
      );

      // Save to persistent state
      this.recommendationStateService.updateRecommendationStatus(recommendation.id, 'accepted');

      // Recompute analyzer alerts to hide any linked to this accepted recommendation
      this.computeAnalyzerAlerts();

      // Update Summary Card comorbidity tier if needed
      if (recommendation.oasisTargetId === 'I8000-comorbidity') {
        this.comorbidityTier.set('High');
        const summaryComorbidityEl = document.getElementById('summary-comorbidity-tier');
        if (summaryComorbidityEl) {
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
    if (formFieldId.includes('J1') || formFieldId.includes('J0') || formFieldId.includes('J2')) {
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
    if (
      formFieldId.includes('M21') ||
      formFieldId.includes('M22') ||
      formFieldId.includes('care-mgmt')
    ) {
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
    this.collapsedSections.update((sections) => {
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
      this.sortRecommendationsByStatus(
        recs.map((rec) =>
          rec.id === this.pendingRejectRecommendation?.id
            ? { ...rec, status: 'rejected' as AiRecommendationStatus }
            : rec
        )
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

    console.log(
      '↩️ Undoing recommendation:',
      recommendation.id,
      'Previous status:',
      recommendation.status
    );

    // If recommendation was accepted, we need to revert changes
    if (recommendation.status === 'accepted') {
      const isSelectField = recommendation.formFieldId.endsWith('-select');
      const isMultiDiagnosisContainer =
        recommendation.formFieldId === 'form-I8000-other-diagnoses-container';

      if (isSelectField) {
        // Revert select field to empty/default value
        const selectEl = document.getElementById(
          recommendation.formFieldId
        ) as HTMLSelectElement | null;
        if (selectEl) {
          selectEl.value = '';
        }
      } else {
        // Revert div-based form field
        const formField = document.getElementById(recommendation.formFieldId) as HTMLElement | null;
        if (formField) {
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
      }

      // Remove form field from OasisStateService
      this.oasisStateService.updateFormField(recommendation.formFieldId, '');

      // Decrement items count
      this.oasisStateService.updateItemsAccepted(Math.max(0, this.itemsAccepted() - 1));

      // Revert functional adjustment for GG0170C
      if (recommendation.oasisTargetId === 'GG0170C') {
        this.functionalAdjustment.set(0);
        this.functionalLevel.set('Low');
        this.paymentStateService.updatePayment(this.currentPayment(), this.comorbidityAdjustment(), this.functionalAdjustment());

        // Update DOM elements
        const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
        const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;
        if (pdgmValueEl) {
          pdgmValueEl.innerText = '$' + this.currentPayment().toFixed(2);
        }
        if (paymentEstimateEl) {
          paymentEstimateEl.innerText = '$' + this.currentPayment().toFixed(2);
        }

        console.log('💰 Functional adjustment reverted, payment:', this.currentPayment());
      }

      // Revert payment if applicable (for comorbidity-impacting recommendations)
      if (
        recommendation.oasisTargetId === 'I8000-comorbidity' ||
        recommendation.oasisTargetId === 'I8000-pad'
      ) {
        // Subtract $287 from comorbidity adjustment
        this.comorbidityAdjustment.update((current) => Math.max(0, current - 287));
        // Update tier based on new total
        if (this.comorbidityAdjustment() === 0) {
          this.comorbidityTier.set('None');
        } else if (this.comorbidityAdjustment() >= 574) {
          this.comorbidityTier.set('High');
        } else {
          this.comorbidityTier.set('Low');
        }
        this.paymentStateService.updatePayment(this.currentPayment(), this.comorbidityAdjustment(), this.functionalAdjustment());

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
    }

    // Reset recommendation status to pending
    this.aiRecommendations.update((recs) =>
      this.sortRecommendationsByStatus(
        recs.map((rec) =>
          rec.id === recommendation.id
            ? { ...rec, status: 'pending' as AiRecommendationStatus }
            : rec
        )
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
      console.log('🎯 Looking for evidence with anchor ID:', data.alert.evidenceAnchorId);

      // Wait for tab switch to complete before scrolling
      setTimeout(() => {
        const viewer = document.getElementById('document-viewer');
        if (!viewer) {
          console.warn('⚠️ Document viewer not found');
          return;
        }

        const el = viewer.querySelector(
          `[data-evidence-for="${data.alert.evidenceAnchorId}"]`
        ) as HTMLElement | null;

        if (el) {
          console.log('✅ Found evidence element, applying animation');

          // Scroll to evidence with smooth animation
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add enhanced evidence highlight animation
          el.classList.add('evidence-alert-highlight');

          // Remove the class after animation completes
          setTimeout(() => {
            el.classList.remove('evidence-alert-highlight');
            console.log('✨ Animation complete');

            // After showing evidence, highlight the OASIS form field
            if (data.alert.oasisFormFieldId) {
              this.highlightOasisFormField(data.alert.oasisFormFieldId);
            }
          }, 2000);
        } else {
          console.warn('⚠️ Evidence element not found for anchor:', data.alert.evidenceAnchorId);
          // Still try to highlight the form field even if evidence not found
          if (data.alert.oasisFormFieldId) {
            this.highlightOasisFormField(data.alert.oasisFormFieldId);
          }
        }
      }, 100); // Small delay to allow tab switch animation to complete
    } else {
      console.log('ℹ️ Alert has no evidenceAnchorId');
      // If no evidence anchor, directly highlight the form field
      if (data.alert.oasisFormFieldId) {
        setTimeout(() => {
          this.highlightOasisFormField(data.alert.oasisFormFieldId!);
        }, 500);
      }
    }
  }

  /**
   * Highlight and scroll to an OASIS form field
   */
  private highlightOasisFormField(formFieldId: string): void {
    console.log('dY"? Highlighting OASIS form field:', formFieldId);

    // Expand the section so the target field is rendered
    const sectionId = this.getSectionIdForField(formFieldId);
    if (sectionId) {
      this.expandSection(sectionId);
    }

    // Wait briefly for the DOM to render the field after expanding
    setTimeout(() => {
      const formField = document.getElementById(formFieldId);
      if (formField) {
        formField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formField.classList.add('form-field-alert-highlight');

        setTimeout(() => {
          formField.classList.remove('form-field-alert-highlight');
          console.log('\uFFFDo" Form field highlight complete');
        }, 3000);
      } else {
        console.warn('\uFFFDs\uFFFD\uFFFD,? OASIS form field not found:', formFieldId);
      }
    }, 150);
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

    // Determine amount based on recommendation type
    const isFunctional = recommendation.oasisTargetId === 'GG0170C';
    const amount = isFunctional ? 120 : 287;

    // Create increase indicator
    const increaseEl = document.createElement('div');
    increaseEl.className =
      'absolute -top-10 right-0 font-black text-2xl animate-bounce z-50';
    increaseEl.style.color = isFunctional ? '#9333ea' : '#10b981'; // Purple for functional, green for comorbidity
    increaseEl.innerHTML = `+$${amount}`;

    pdgmValueEl.parentElement.style.position = 'relative';
    pdgmValueEl.parentElement.appendChild(increaseEl);

    // Scale up dramatically
    pdgmValueEl.style.transform = 'scale(1.8)';
    pdgmValueEl.style.color = isFunctional ? '#9333ea' : '#10b981';
    pdgmValueEl.style.fontWeight = '900';
    pdgmValueEl.style.transition = 'all 0.4s ease-in-out';

    setTimeout(() => {
      // Update functional adjustment for GG0170C
      if (recommendation.oasisTargetId === 'GG0170C') {
        this.functionalAdjustment.set(120);
        this.functionalLevel.set('Medium');
      }

      // Update comorbidity adjustment for J69.0 (aspiration) and I73.9 (PAD)
      if (
        recommendation.oasisTargetId === 'I8000-comorbidity' ||
        recommendation.oasisTargetId === 'I8000-pad'
      ) {
        // Add $287 to current comorbidity adjustment (cumulative)
        this.comorbidityAdjustment.update((current) => current + 287);
        this.comorbidityTier.set(this.comorbidityAdjustment() >= 574 ? 'High' : 'Low');
      }

      // Update shared payment state for patient-summary
      this.paymentStateService.updatePayment(this.currentPayment(), this.comorbidityAdjustment(), this.functionalAdjustment());

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

  openAnalyzerOverlay(): void {
    // Mark as saved to enable analyzer alerts
    this.hasBeenSaved.set(true);

    // Show the analyzer processing overlay
    this.showModal('analyzer-processing-overlay');

    const statusEl = document.getElementById('analyzer-status');
    const progressBar = document.getElementById('analyzer-progress-bar');

    // Analysis steps with messages and progress
    const steps = [
      { message: 'Scanning form fields for completeness...', progress: 25, delay: 800 },
      { message: 'Cross-referencing documentation evidence...', progress: 50, delay: 800 },
      { message: 'Validating PDGM logic and clinical consistency...', progress: 75, delay: 800 },
      { message: 'Finalizing compliance review...', progress: 95, delay: 600 },
    ];

    let currentStep = 0;

    const runStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        if (statusEl) statusEl.textContent = step.message;
        if (progressBar) progressBar.style.width = `${step.progress}%`;
        currentStep++;
        setTimeout(runStep, step.delay);
      } else {
        // Complete the analysis
        if (progressBar) progressBar.style.width = '100%';
        setTimeout(() => {
          this.hideModal('analyzer-processing-overlay');

          // Compute and show analyzer alerts
          this.computeAnalyzerAlerts();

          // Show analyzer alerts in the sidebar if there are any
          if (this.analyzerAlerts().length > 0) {
            this.showAnalyzer.set(true);

            // Scroll to the analyzer section in the recommendations panel
            setTimeout(() => {
              const analyzerSection = document.querySelector('.analyzer-alerts-section');
              if (analyzerSection) {
                analyzerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }

          // Reset progress bar for next time
          if (progressBar) {
            progressBar.style.width = '0%';
          }
        }, 500);
      }
    };

    // Start the animation
    setTimeout(runStep, 300);
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

      const timestamp = document.getElementById(
        'eligibility-timestamp-oasis'
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
    // Update the signal with current date
    this.lastEligibilityCheck.set(new Date());
  }

  getFormattedEligibilityDate(): string {
    const date = this.lastEligibilityCheck();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if it's today
    if (checkDate.getTime() === today.getTime()) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `Today at ${displayHours}:${minutes} ${ampm}`;
    }

    // Otherwise show the full date
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${month}/${day}/${year} at ${displayHours}:${minutes} ${ampm}`;
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
   * Generate OASIS XML content in CMS format
   */
  private generateOasisXML(): string {
    const oasisItems = this.collectOasisItems();
    const timestamp = new Date().toISOString();
    const assessmentDate = new Date().toISOString().split('T')[0];
    const codingResultId = this.generateUUID();

    let xml = '<?xml version="1.0" ?>\n';
    xml += '<OASIS xmlns="http://www.cms.gov/oasis">\n';

    // Submission section
    xml += '  <Submission>\n';
    xml += `    <SubmissionDateTime>${timestamp}</SubmissionDateTime>\n`;
    xml += '    <SubmissionType>Assessment</SubmissionType>\n';
    xml += '  </Submission>\n';

    // Patient section
    xml += '  <Patient>\n';
    xml += `    <PatientID>pid_LANCE_${Date.now()}</PatientID>\n`;
    xml += '  </Patient>\n';

    // Assessment section
    xml += '  <Assessment>\n';
    xml += `    <AssessmentDate>${assessmentDate}</AssessmentDate>\n`;
    xml += '    <AssessmentType>Start of Care</AssessmentType>\n';
    xml += '  </Assessment>\n';

    // OASISItems section
    xml += '  <OASISItems>\n';

    oasisItems.forEach((item) => {
      xml += '    <Item>\n';
      xml += `      <ItemCode>${this.escapeXML(item.code)}</ItemCode>\n`;
      xml += `      <ItemDescription>${this.escapeXML(item.description)}</ItemDescription>\n`;
      xml += `      <ItemValue>${this.escapeXML(item.value)}</ItemValue>\n`;
      xml += `      <CodingResultID>${codingResultId}</CodingResultID>\n`;
      xml += `      <LastUpdated>${timestamp}Z</LastUpdated>\n`;
      xml += '    </Item>\n';
    });

    xml += '  </OASISItems>\n';
    xml += '</OASIS>';

    return xml;
  }

  /**
   * Generate a UUID for CodingResultID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * OASIS item definitions with codes and descriptions
   */
  private readonly OASIS_ITEM_DEFINITIONS: Record<string, string> = {
    // Section A - Administrative
    A1005: 'A1005. Ethnicity',
    A1010: 'A1010. Race',
    A1110: 'A1110. Language',
    A1250: 'A1250. Transportation (NACHC©)',
    A2120:
      'A2120. Provision of Current Reconciled Medication List to Subsequent Provider at Transfer',
    A2121:
      'A2121. Provision of Current Reconciled Medication List to Subsequent Provider at Discharge',
    A2123: 'A2123. Provision of Current Reconciled Medication List to Patient at Discharge',
    A2124: 'A2124. Route of Current Reconciled Medication List Transmission to Patient',

    // Section B - Hearing, Speech, Vision
    B0200: 'B0200. Hearing',
    B1000: 'B1000. Vision',
    B1300: 'B1300. Health Literacy',

    // Section C - Cognitive Patterns
    C0100: 'C0100. Should Brief Interview for Mental Status (C0200-C0500) be Conducted?',
    C0200: 'C0200. Repetition of Three Words',
    C0300: 'C0300. Temporal Orientation',
    C0400: 'C0400. Recall',
    C0500: 'C0500. BIMS Summary Score',
    C0600: 'C0600. Should the Staff Assessment of Mental Status be Conducted?',
    C0700: 'C0700. Short-term Memory OK',
    C0800: 'C0800. Long-term Memory OK',
    C0900: 'C0900. Memory/Recall Ability',
    C1000: 'C1000. Cognitive Skills for Daily Decision Making',
    C1310: 'C1310. Signs and Symptoms of Delirium',

    // Section D - Mood
    D0150: 'D0150. Patient Mood Interview (PHQ-2)',
    D0160: 'D0160. Total Severity Score',

    // Section GG - Functional Abilities
    GG0100A: 'GG0100A. Prior Functioning - Self-Care',
    GG0100B: 'GG0100B. Prior Functioning - Indoor Mobility',
    GG0100C: 'GG0100C. Prior Functioning - Stairs',
    GG0100D: 'GG0100D. Prior Functioning - Functional Cognition',
    GG0130A1: 'GG0130A1. Self-Care - Eating (SOC/ROC Performance)',
    GG0130A2: 'GG0130A2. Self-Care - Eating (Discharge Goal)',
    GG0130B1: 'GG0130B1. Self-Care - Oral Hygiene (SOC/ROC Performance)',
    GG0130B2: 'GG0130B2. Self-Care - Oral Hygiene (Discharge Goal)',
    GG0130C1: 'GG0130C1. Self-Care - Toileting Hygiene (SOC/ROC Performance)',
    GG0130C2: 'GG0130C2. Self-Care - Toileting Hygiene (Discharge Goal)',
    GG0130E1: 'GG0130E1. Self-Care - Shower/Bathe Self (SOC/ROC Performance)',
    GG0130E2: 'GG0130E2. Self-Care - Shower/Bathe Self (Discharge Goal)',
    GG0130F1: 'GG0130F1. Self-Care - Upper Body Dressing (SOC/ROC Performance)',
    GG0130F2: 'GG0130F2. Self-Care - Upper Body Dressing (Discharge Goal)',
    GG0130G1: 'GG0130G1. Self-Care - Lower Body Dressing (SOC/ROC Performance)',
    GG0130G2: 'GG0130G2. Self-Care - Lower Body Dressing (Discharge Goal)',
    GG0130H1: 'GG0130H1. Self-Care - Putting On/Taking Off Footwear (SOC/ROC Performance)',
    GG0130H2: 'GG0130H2. Self-Care - Putting On/Taking Off Footwear (Discharge Goal)',
    GG0170A1: 'GG0170A1. Mobility - Roll Left and Right (SOC/ROC Performance)',
    GG0170A2: 'GG0170A2. Mobility - Roll Left and Right (Discharge Goal)',
    GG0170B1: 'GG0170B1. Mobility - Sit to Lying (SOC/ROC Performance)',
    GG0170B2: 'GG0170B2. Mobility - Sit to Lying (Discharge Goal)',
    GG0170C1: 'GG0170C1. Mobility - Lying to Sitting on Side of Bed (SOC/ROC Performance)',
    GG0170C2: 'GG0170C2. Mobility - Lying to Sitting on Side of Bed (Discharge Goal)',
    GG0170D1: 'GG0170D1. Mobility - Sit to Stand (SOC/ROC Performance)',
    GG0170D2: 'GG0170D2. Mobility - Sit to Stand (Discharge Goal)',
    GG0170E1: 'GG0170E1. Mobility - Chair/Bed-to-Chair Transfer (SOC/ROC Performance)',
    GG0170E2: 'GG0170E2. Mobility - Chair/Bed-to-Chair Transfer (Discharge Goal)',
    GG0170F1: 'GG0170F1. Mobility - Toilet Transfer (SOC/ROC Performance)',
    GG0170F2: 'GG0170F2. Mobility - Toilet Transfer (Discharge Goal)',
    GG0170G1: 'GG0170G1. Mobility - Car Transfer (SOC/ROC Performance)',
    GG0170G2: 'GG0170G2. Mobility - Car Transfer (Discharge Goal)',
    GG0170I1: 'GG0170I1. Mobility - Walk 10 Feet (SOC/ROC Performance)',
    GG0170I2: 'GG0170I2. Mobility - Walk 10 Feet (Discharge Goal)',
    GG0170J1: 'GG0170J1. Mobility - Walk 50 Feet with Two Turns (SOC/ROC Performance)',
    GG0170J2: 'GG0170J2. Mobility - Walk 50 Feet with Two Turns (Discharge Goal)',
    GG0170K1: 'GG0170K1. Mobility - Walk 150 Feet (SOC/ROC Performance)',
    GG0170K2: 'GG0170K2. Mobility - Walk 150 Feet (Discharge Goal)',
    GG0170L1: 'GG0170L1. Mobility - Walking 10 Feet on Uneven Surfaces (SOC/ROC Performance)',
    GG0170L2: 'GG0170L2. Mobility - Walking 10 Feet on Uneven Surfaces (Discharge Goal)',
    GG0170M1: 'GG0170M1. Mobility - 1 Step (Curb) (SOC/ROC Performance)',
    GG0170M2: 'GG0170M2. Mobility - 1 Step (Curb) (Discharge Goal)',
    GG0170N1: 'GG0170N1. Mobility - 4 Steps (SOC/ROC Performance)',
    GG0170N2: 'GG0170N2. Mobility - 4 Steps (Discharge Goal)',
    GG0170O1: 'GG0170O1. Mobility - 12 Steps (SOC/ROC Performance)',
    GG0170O2: 'GG0170O2. Mobility - 12 Steps (Discharge Goal)',
    GG0170P1: 'GG0170P1. Mobility - Picking Up Object (SOC/ROC Performance)',
    GG0170P2: 'GG0170P2. Mobility - Picking Up Object (Discharge Goal)',
    GG0170R1: 'GG0170R1. Mobility - Wheel 50 Feet with Two Turns (SOC/ROC Performance)',
    GG0170R2: 'GG0170R2. Mobility - Wheel 50 Feet with Two Turns (Discharge Goal)',
    GG0170S1: 'GG0170S1. Mobility - Wheel 150 Feet (SOC/ROC Performance)',
    GG0170S2: 'GG0170S2. Mobility - Wheel 150 Feet (Discharge Goal)',

    // Section J - Health Conditions
    J0510: 'J0510. Pain Effect on Sleep',
    J1800: 'J1800. Any Falls Since SOC/ROC',
    J1900A: 'J1900A. Number of Falls - No Injury',
    J1900B: 'J1900B. Number of Falls - Injury (except major)',
    J1900C: 'J1900C. Number of Falls - Major Injury',
    J2030: 'J2030. Shortness of Breath (Dyspnea)',

    // Section K - Swallowing/Nutritional Status
    K0520A: 'K0520A. Nutritional Approaches - Parenteral/IV Feeding',
    K0520B: 'K0520B. Nutritional Approaches - Feeding Tube',
    K0520C: 'K0520C. Nutritional Approaches - Mechanically Altered Diet',
    K0520D: 'K0520D. Nutritional Approaches - Therapeutic Diet',
    K0520Z: 'K0520Z. Nutritional Approaches - None of the Above',

    // Section M - Skin Conditions
    M1306: 'M1306. Unhealed Pressure Ulcer(s) Present',
    M1324: 'M1324. Stage of Most Problematic Unhealed Pressure Ulcer',
    M1330: 'M1330. Does this Patient have a Stasis Ulcer?',
    M1334: 'M1334. Status of Most Problematic Stasis Ulcer',
    M1340: 'M1340. Does this Patient have a Surgical Wound?',
    M1342: 'M1342. Status of Most Problematic Surgical Wound',
    M1350: 'M1350. Skin Lesion or Open Wound',
    M1400: 'M1400. When is the Patient Dyspneic?',
    M1600:
      'M1600. Has this patient been treated for a Urinary Tract Infection in the past 14 days?',
    M1610: 'M1610. Urinary Incontinence or Urinary Catheter Presence',
    M1620: 'M1620. Bowel Incontinence Frequency',
    M1630: 'M1630. Ostomy for Bowel Elimination',
    M2001: 'M2001. Drug Regimen Review',
    M2003: 'M2003. Medication Follow-up',
    M2005: 'M2005. Medication Intervention',
    M2010: 'M2010. Patient/Caregiver High Risk Drug Education',
    M2020: 'M2020. Management of Oral Medications',
    M2030: 'M2030. Management of Injectable Medications',
    M2102ADL: 'M2102. Types and Sources of Assistance - ADL',
    M2102IADL: 'M2102. Types and Sources of Assistance - IADL',
    M2102Med: 'M2102. Types and Sources of Assistance - Medication',
    M2102Proc: 'M2102. Types and Sources of Assistance - Procedures',
    M2102Equip: 'M2102. Types and Sources of Assistance - Equipment',
    M2102Advocacy: 'M2102. Types and Sources of Assistance - Advocacy',
    M2102Financial: 'M2102. Types and Sources of Assistance - Financial',
    M2102Emotional: 'M2102. Types and Sources of Assistance - Emotional',
    M2102None: 'M2102. Types and Sources of Assistance - None',
    M2250Med: 'M2250. Plan of Care Synopsis - Medication',
    M2250Nutrition: 'M2250. Plan of Care Synopsis - Nutrition',
    M2250Skin: 'M2250. Plan of Care Synopsis - Skin',
    M2250Pain: 'M2250. Plan of Care Synopsis - Pain',
    M2250Behavioral: 'M2250. Plan of Care Synopsis - Behavioral',

    // Section N - Medications
    N0415A: 'N0415A. High-Risk Drug Classes - Antipsychotic',
    N0415B: 'N0415B. High-Risk Drug Classes - Anticoagulant',
    N0415C: 'N0415C. High-Risk Drug Classes - Antibiotic',
    N0415D: 'N0415D. High-Risk Drug Classes - Opioid',
    N0415E: 'N0415E. High-Risk Drug Classes - Antiplatelet',
    N0415F: 'N0415F. High-Risk Drug Classes - Hypoglycemic',

    // Administrative M Items
    M0010: 'M0010. CMS Certification Number',
    M0014: 'M0014. Branch State',
    M0016: 'M0016. Branch ID Number',
    M0018: 'M0018. National Provider Identifier (NPI)',
    M0020: 'M0020. Patient ID Number',
    M0030: 'M0030. Start of Care Date',
    M0064: 'M0064. Social Security Number',
    M0066: 'M0066. Birth Date',
    M0069: 'M0069. Gender',
    M0080: 'M0080. Discipline of Person Completing Assessment',
    M0090: 'M0090. Date Assessment Completed',
    M0100: 'M0100. Reason for Assessment',
    M0102: 'M0102. Date of Physician-Ordered SOC',
    M0104: 'M0104. Date of Referral',
    M0150: 'M0150. Current Payment Sources for Home Care',

    // Diagnoses
    I8000_primary: 'I8000. Primary Diagnosis',
    I8000_comorbidity: 'I8000. Comorbidity Diagnosis',
    I8000_other: 'I8000. Other Diagnosis',
  };

  /**
   * Collect all OASIS items from the form with codes, descriptions, and values
   */
  private collectOasisItems(): Array<{ code: string; description: string; value: string }> {
    const items: Array<{ code: string; description: string; value: string }> = [];
    const processedCodes = new Set<string>();

    // Helper to extract item code from element ID
    const extractItemCode = (id: string): string => {
      // Remove suffixes like -select, -input, etc.
      return id.replace(/-(select|input|checkbox)$/i, '').replace(/-/g, '');
    };

    // Helper to get description for an item code
    const getDescription = (code: string): string => {
      return this.OASIS_ITEM_DEFINITIONS[code] || `${code}. Unknown Item`;
    };

    // Helper to add item if not already processed
    const addItem = (code: string, value: string) => {
      if (!processedCodes.has(code)) {
        processedCodes.add(code);
        items.push({
          code,
          description: getDescription(code),
          value: value || '',
        });
      }
    };

    // Collect all select values
    document.querySelectorAll('select').forEach((select) => {
      const selectEl = select as HTMLSelectElement;
      const id = selectEl.id;
      if (id) {
        const code = extractItemCode(id);
        const value = selectEl.value;
        // Get selected option text for more meaningful value
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        const displayValue = selectedOption && value ? selectedOption.text : '';
        addItem(code, displayValue);
      }
    });

    // Collect all text inputs
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      const inputEl = input as HTMLInputElement;
      const id = inputEl.id;
      if (id) {
        const code = extractItemCode(id);
        addItem(code, inputEl.value);
      }
    });

    // Collect all date inputs
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      const inputEl = input as HTMLInputElement;
      const id = inputEl.id;
      if (id) {
        const code = extractItemCode(id);
        addItem(code, inputEl.value);
      }
    });

    // Collect all number inputs
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      const inputEl = input as HTMLInputElement;
      const id = inputEl.id;
      if (id) {
        const code = extractItemCode(id);
        addItem(code, inputEl.value);
      }
    });

    // Collect checkbox states
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      const checkboxEl = checkbox as HTMLInputElement;
      const id = checkboxEl.id;
      if (id) {
        const code = extractItemCode(id);
        addItem(code, checkboxEl.checked ? 'Yes' : 'No');
      }
    });

    // Sort items by code for consistent output
    items.sort((a, b) => a.code.localeCompare(b.code));

    return items;
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
        const option = options.find(
          (opt) =>
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
      allSelects.forEach((select) => {
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
      document.querySelectorAll('select').forEach((select) => {
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
      allSelects.forEach((select) => {
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
      document.querySelectorAll('select').forEach((select) => {
        const id = select.id || '';
        if (id.includes('GG0100A')) selectOption(select, '0'); // Independent
        if (id.includes('GG0100B')) selectOption(select, '0'); // Independent
        if (id.includes('GG0100C')) selectOption(select, '0'); // Independent
      });

      // 9. GG0110 PRIOR DEVICE USE (1 item with checkboxes)
      const deviceCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      deviceCheckboxes.forEach((checkbox) => {
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
      const mobilityValues = [
        '06',
        '05',
        '04',
        '03',
        '02',
        '03',
        '03',
        '04',
        '02',
        '03',
        '04',
        '03',
        '02',
        '03',
        '04',
        '02',
        '03',
      ];
      const mobilitySelects = document.querySelectorAll('select[id^="GG0170"]');
      mobilitySelects.forEach((select, index) => {
        const val = mobilityValues[index] || '03';
        selectOption(select as HTMLSelectElement, val);
      });

      // 12. NUTRITIONAL - K0520 (1 item with checkboxes)
      const nutritionCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      nutritionCheckboxes.forEach((checkbox) => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('therapeutic diet')) {
          (checkbox as HTMLInputElement).checked = true;
          filledCount++;
        }
      });

      // 13. INTEGUMENTARY - M Items (7 items)
      allSelects.forEach((select) => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('M1306')) selectOption(select, '0'); // No pressure ulcers
        if (prevText.includes('M1330')) selectOption(select, '0'); // No stasis ulcers
        if (prevText.includes('M1340')) selectOption(select, '0'); // No surgical wounds
        if (prevText.includes('M1350')) selectOption(select, '0'); // No lesions
      });

      // 14. RESPIRATORY - M1400 (1 item)
      allSelects.forEach((select) => {
        if (select.previousElementSibling?.textContent?.includes('M1400')) {
          selectOption(select, '1'); // Mild dyspnea
        }
      });

      // 15. ELIMINATION - M Items (4 items)
      allSelects.forEach((select) => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('M1600')) selectOption(select, '0'); // No UTI
        if (prevText.includes('M1610')) selectOption(select, '0'); // No incontinence
        if (prevText.includes('M1620')) selectOption(select, '0'); // No bowel incontinence
        if (prevText.includes('M1630')) selectOption(select, 'NA'); // No ostomy
      });

      // 16. MEDICATIONS - M Items (6 items)
      allSelects.forEach((select) => {
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
      careCheckboxes.forEach((checkbox) => {
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
      allSelects.forEach((select) => {
        const prevText = select.previousElementSibling?.textContent || '';
        if (prevText.includes('O0350')) {
          selectOption(select, '1'); // COVID vaccination up to date
        }
      });
      const treatmentCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      treatmentCheckboxes.forEach((checkbox) => {
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('physical therapy')) {
          (checkbox as HTMLInputElement).checked = true;
          filledCount++;
        }
      });

      // FINAL PASS: Fill any remaining empty selects with smart defaults
      setTimeout(() => {
        const allSelectsForFinalPass = document.querySelectorAll('select');
        allSelectsForFinalPass.forEach((select) => {
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
            const naOption = Array.from(selectEl.options).find(
              (opt) =>
                opt.value === 'NA' || opt.text.includes('NA') || opt.text.includes('Not applicable')
            );
            if (naOption) {
              selectEl.value = naOption.value;
              return;
            }
          }

          // For yes/no questions, default to "No" (0) unless it's negative
          if (contextText.includes('yes') || contextText.includes('no')) {
            const noOption = Array.from(selectEl.options).find(
              (opt) => opt.value === '0' || opt.text.toLowerCase().includes('no')
            );
            if (noOption) {
              selectEl.value = noOption.value;
              return;
            }
          }

          // For medication/intervention questions, default to appropriate value
          if (contextText.includes('medication') || contextText.includes('intervention')) {
            const firstReasonableOption = Array.from(selectEl.options).find(
              (opt) => opt.value === '0' || opt.value === 'NA' || opt.text.includes('No')
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
        document.querySelectorAll('input[type="number"]').forEach((input) => {
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

    // Mark assessment as saved to enable analyzer alerts
    this.hasBeenSaved.set(true);

    // Show all analyzer alerts and mark them as reviewed (completed)
    const available = this.availableDocs();
    this.analyzerAlerts.set(
      this.allAnalyzerAlerts()
        .filter((alert) => available.has(alert.evidenceDocId))
        .map((alert) => ({
          ...alert,
          status: 'reviewed' as AnalyzerAlertStatus,
        }))
    );

    // Show the analyzer panel
    this.showAnalyzer.set(true);

    console.log('✅ All AI recommendations accepted during demo autofill');
    console.log('✅ All analyzer alerts marked as reviewed');
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
