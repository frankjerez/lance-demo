import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, computed, signal } from '@angular/core';

import { Router } from '@angular/router';
import { PatientListItem, myPatients } from './data/patient-list-data';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.html',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./patient-list.css'],
})
export class PatientListComponent implements OnInit {
  public router = inject(Router);

  // All patients
  allPatients = signal<PatientListItem[]>(myPatients);

  // Selected status filter
  selectedStatus = signal<string>('All Status');

  // Filtered patients based on selected status
  patients = computed(() => {
    const status = this.selectedStatus();
    const all = this.allPatients();

    if (status === 'All Status') {
      return all;
    }

    return all.filter(patient => patient.status.label === status);
  });

  // Computed counts for status cards
  assessmentReadyCount = computed(() =>
    this.allPatients().filter(p => p.status.label === 'Assessment Ready').length
  );

  inReviewCount = computed(() =>
    this.allPatients().filter(p => p.status.label === 'In Review').length
  );

  completedCount = computed(() =>
    this.allPatients().filter(p => p.status.label === 'Completed').length
  );

  // Eligibility check date tracking
  lastEligibilityCheck = signal<Date>(new Date());

  // mirrors your original JS vars
  itemsAccepted = 0;
  totalItems = 89;
  currentPayment = 2875.5;

  ngOnInit(): void {
    // default page is login
    this.showPage('dashboard-page');
  }

  // ======= filtering =======

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value);
  }

  selectStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  // ======= page switching =======

  showPage(pageId: string): void {
    const pages = ['dashboard-page'];
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

  openUpload(patient: PatientListItem): void {
    this.showModal('upload-modal');
  }

  openEligibility(patient: PatientListItem): void {
    this.showModal('eligibility-modal');
  }

  // ======= modals =======

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

  goToAssessment(patient: PatientListItem): void {
    // Only patient p2 (John Smith) goes to OASIS assessment
    if (patient.id === 'p2') {
      this.router.navigate(['/oasis']);
    } else {
      // For demo: other patients don't navigate anywhere yet
      return;
    }
  }

  gotoPatientDetails(_t36: PatientListItem) {
    if (_t36.id === 'p2') {
      this.router.navigate(['/patients', _t36.id, 'summary']);
    } else {
      return; //alert('Routing to Patient Summary for ' + patient.name + ' (demo only)');
    }
  }

  // goToPatientSummary(patient: PatientListItem): void {

  // }

  // ======= eligibility =======

  checkEligibility(): void {
    alert(
      '✓ Eligibility verified!\n\n' +
        'Patient: Maria Garcia\n' +
        'Status: Active - Medicare Part A & B\n' +
        'Effective: 01/01/2024 - 12/31/2024\n' +
        'Home Health Benefit: Available'
    );
    this.hideModal('eligibility-modal');
  }

  quickEligibilityCheck(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.checkEligibility();
  }

  // ======= upload / processing overlay =======

  startAIProcessing(): void {
    this.hideModal('upload-modal');

    const processingOverlay = document.getElementById('processing-overlay');
    if (!processingOverlay) return;

    processingOverlay.classList.remove('hidden');
    processingOverlay.classList.add('flex');

    setTimeout(() => {
      processingOverlay.classList.add('hidden');
      processingOverlay.classList.remove('flex');
      this.router.navigate(['/oasis']);
    }, 3500);
  }

  gotoOasis() {
    const processingOverlay = document.getElementById('loadind-analysis-overlay');
    if (!processingOverlay) return;

    processingOverlay.classList.remove('hidden');
    processingOverlay.classList.add('flex');

    setTimeout(() => {
      processingOverlay.classList.add('hidden');
      processingOverlay.classList.remove('flex');
      this.router.navigate(['/oasis']);
    }, 1500);
  }

  // ======= document tabs =======

  switchDocumentTab(button: HTMLElement, docId: string): void {
    // toggle active classes on tabs
    const allTabs = document.querySelectorAll('.doc-tab');
    allTabs.forEach((tab) => tab.classList.remove('active'));

    button.classList.add('active'); // This line is why it expects HTMLElement

    // show/hide doc sections
    const docs = document.querySelectorAll('.document-content');
    docs.forEach((doc) => {
      (doc as HTMLElement).classList.add('hidden');
    });

    const activeDoc = document.getElementById(docId);
    if (activeDoc) {
      activeDoc.classList.remove('hidden');
    }
  }

  // ======= recommendations =======

  selectRecommendation(cardEl: HTMLElement, oasisId: string, docId: string): void {
    // highlight selected card
    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((c) => c.classList.remove('selected'));
    cardEl.classList.add('selected');

    // ensure correct document tab is visible
    const docTab = document.querySelector(`.doc-tab[data-doc-id="${docId}"]`) as HTMLElement | null;
    if (docTab) {
      this.switchDocumentTab(docTab, docId);
    }

    // scroll to evidence in document, if present
    const targetEvidence = document.querySelector(
      `[data-evidence-for="${oasisId}"]`
    ) as HTMLElement | null;
    if (targetEvidence) {
      targetEvidence.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEvidence.classList.add('form-field-highlight');
      setTimeout(() => targetEvidence.classList.remove('form-field-highlight'), 1500);
    }
  }

  acceptRecommendation(
    event: Event,
    oasisId: string,
    value: string,
    affectsPayment: boolean,
    paymentDelta: number
  ): void {
    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;
    const card = button.closest('.recommendation-card') as HTMLElement | null;
    if (card) {
      card.classList.add('accepted');
    }

    this.itemsAccepted++;
    this.updateProgress();

    if (affectsPayment) {
      this.currentPayment += paymentDelta;
      this.updatePaymentDisplay();
    }

    // TODO: update the corresponding OASIS form field in DOM based on oasisId/value
    console.log('Accepted', { oasisId, value, affectsPayment, paymentDelta });
  }

  rejectRecommendation(event: Event): void {
    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;
    const card = button.closest('.recommendation-card') as HTMLElement | null;
    if (card) {
      card.classList.add('rejected');
    }

    this.updateProgress();
  }

  recheckEligibility(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Find the button that triggered the action
    const recheckBtn = target.closest('button') as HTMLButtonElement | null;
    if (!recheckBtn) return;

    const originalHTML = recheckBtn.innerHTML;

    // Set loading state
    recheckBtn.innerHTML =
      '<ion-icon name="hourglass-outline" class="animate-spin"></ion-icon><span>Checking...</span>';
    recheckBtn.disabled = true;

    // Simulated API call
    setTimeout(() => {
      // Restore button
      recheckBtn.innerHTML = originalHTML;
      recheckBtn.disabled = false;

      // Update timestamp
      this.updateEligibilityTimestamp();

      // Highlight feedback
      const timestamp = document.getElementById('eligibility-timestamp') as HTMLElement | null;

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

  acceptGGRecommendation(event: Event, ggId: string, code: string): void {
    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;
    const card = button.closest('.recommendation-card') as HTMLElement | null;
    if (card) {
      card.classList.add('accepted');
    }

    this.itemsAccepted++;
    this.updateProgress();

    // TODO: update GG select / input in the OASIS form based on ggId/code
    console.log('Accepted GG', { ggId, code });
  }

  // ======= progress / payment UI =======

  updateProgress(): void {
    const pct = Math.min(100, Math.round((this.itemsAccepted / this.totalItems) * 100));

    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar') as HTMLElement | null;

    if (progressText) {
      progressText.textContent = `${pct}%`;
    }

    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }
  }

  updatePaymentDisplay(): void {
    const el = document.getElementById('pdgm-value');
    if (!el) return;
    el.textContent = `$${this.currentPayment.toFixed(2)}`;
  }

  // ======= scroll to recommendation by OASIS id =======

  scrollToRecommendation(oasisId: string): void {
    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((card) => {
      const onclick = (card as HTMLElement).getAttribute('onclick');
      // NOTE: this relies on old inline onclick text; once fully Angular-ized,
      // you can replace this with data-* attributes or ts data.
      if (onclick && onclick.includes(`'${oasisId}'`)) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('border-emerald-500', 'bg-emerald-50', 'shadow-lg');
        setTimeout(() => {
          card.classList.remove('border-emerald-500', 'bg-emerald-50', 'shadow-lg');
        }, 2000);
      }
    });
  }

  // ======= form validation & reset =======

  validateForm(): void {
    // placeholder for your validation logic
    alert('Running OASIS validation (demo only).');
  }

  resetDemo(): void {
    this.itemsAccepted = 0;
    this.currentPayment = 2875.5;
    this.updateProgress();
    this.updatePaymentDisplay();

    const cards = document.querySelectorAll('.recommendation-card');
    cards.forEach((card) => card.classList.remove('accepted', 'rejected', 'selected'));
  }

  // ======= export =======

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
            garcia_maria_soc_20250118.xml (demo)
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
