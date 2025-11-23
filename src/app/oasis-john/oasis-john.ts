import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
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

  // Document mapping: patient-summary doc IDs -> oasis-john doc IDs
  private readonly DOC_MAPPING = {
    doc1: 'discharge-doc' as const,
    doc2: 'referral-doc' as const,
    doc5: 'visit-doc' as const,
  };

  @ViewChild(OasisFormComponent) oasisFormComponent!: OasisFormComponent;
  @ViewChild(OasisDocumentViewerComponent) documentViewerComponent!: OasisDocumentViewerComponent;

  // Signals for shared state
  itemsAccepted = signal(0);
  totalItems = signal(89);
  currentPayment = signal(2875.5);
  showAnalyzer = signal(false);
  isSavingAssessment = signal(false);
  hasBeenSaved = signal(false); // Track if assessment has been saved
  selectedAlertId = signal<string | null>(null);
  activeDocId = signal<'discharge-doc' | 'referral-doc' | 'visit-doc'>('referral-doc'); // Default to referral since it's the only one uploaded initially
  highlightEvidence = signal<EvidenceHighlight | null>(null);

  // Track which documents are available (uploaded)
  availableDocs = signal<Set<'discharge-doc' | 'referral-doc' | 'visit-doc'>>(new Set());

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

  ngOnInit(): void {
    this.initializeAvailableDocuments();
    this.filterRecommendationsAndAlerts();
    this.restoreSavedRecommendationStates();
    this.handleNavigationState();
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

    this.availableDocs.set(available);
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

    if (savedStates.size === 0) {
      return;
    }

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
        this.itemsAccepted.update((v) => v + 1);

        // Update payment if applicable
        if (rec.triggersPdgmUpdate) {
          this.updatePaymentDisplay(rec);
        }
      }
    });
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
    this.itemsAccepted.set(0);
    this.currentPayment.set(2875.5);
    this.analyzerAlerts.set([]);

    // Reset all recommendations
    this.aiRecommendations.update((recs) =>
      recs.map((rec) => ({ ...rec, status: 'pending' as AiRecommendationStatus }))
    );

    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((card) => card.classList.remove('accepted', 'rejected', 'selected'));
  }

  handleExport(): void {
    this.showModal('export-modal');
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

    // Populate form field
    const isOtherDiagnosis = recommendation.formFieldId === 'form-I8000-other-diagnoses-container';

    this.oasisFormComponent.populateField(
      recommendation.formFieldId,
      recommendation.acceptValue || recommendation.ggValue || '',
      isOtherDiagnosis
    );

    // Update progress
    this.itemsAccepted.update((v) => v + 1);

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
      // Update payment
      if (recommendation.oasisTargetId === 'I8000-comorbidity') {
        this.currentPayment.set(3162.5);
        // Update shared payment state for patient-summary
        this.paymentStateService.updatePayment(3162.5, 287.0);
      } else {
        this.currentPayment.update((v) => v + 287);
        // Update shared payment state for patient-summary
        this.paymentStateService.updatePayment(this.currentPayment(), 0);
      }

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

        // Filter 2: Only show alerts when linked recommendation is rejected
        if (!alert.linkedRecommendationId) {
          return false; // No linked recommendation, hide alert
        }

        const rec = this.allAiRecommendations().find((r) => r.id === alert.linkedRecommendationId);
        return rec?.status === 'rejected'; // Show only if recommendation exists and is rejected
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
            OASIS XML Generated
          </p>
          <p class="text-xs text-slate-500">
            john_smith_soc_20250118.xml (demo)
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}
