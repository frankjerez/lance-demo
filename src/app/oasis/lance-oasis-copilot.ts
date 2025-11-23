import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lance-oasis-copilot',
  templateUrl: './lance-oasis-copilot.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./lance-oasis-copilot.css'],
})
export class LanceOasisCopilotComponent implements OnInit {
  public router = inject(Router);

  // mirrors your original JS vars
  itemsAccepted = 0;
  totalItems = 89;
  currentPayment = 2875.5;

  ngOnInit(): void {
    // default page is login
    this.showPage('copilot-page');
  }

  // ======= page switching =======

  showPage(pageId: 'copilot-page'): void {
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

  showDashboard(): void {
    this.router.navigate(['/patients']);
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

  quickEligibilityCheck(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Find the button
    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button) return;

    const originalHTML = button.innerHTML;

    // Set loading state
    button.innerHTML =
      '<ion-icon name="hourglass-outline" class="text-sm animate-spin"></ion-icon><span>Checking...</span>';
    button.disabled = true;

    // Simulate API call
    setTimeout(() => {
      // Restore button
      button.innerHTML = originalHTML;
      button.disabled = false;

      // Show the modal
      this.showModal('eligibility-modal');

      // Update timestamp
      this.updateEligibilityTimestamp();
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
      this.showPage('copilot-page');
    }, 3500);
  }

  // ======= document tabs =======

  switchDocumentTab(event: Event, docId: string): void {
    const button = (event.target as HTMLElement)?.closest('.doc-tab') as HTMLElement | null;
    if (!button) return;

    // toggle active classes on tabs
    const allTabs = document.querySelectorAll('.doc-tab');
    allTabs.forEach((tab) => tab.classList.remove('active'));

    button.classList.add('active');

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

  selectRecommendation(event: Event, oasisId: string, targetDocId?: string): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // The clicked recommendation card (supports clicking child elements)
    const cardElement = target.closest('.recommendation-card') as HTMLElement | null;
    if (!cardElement) return;

    // -----------------------------
    // Highlight selected card
    // -----------------------------
    const allCards = document.querySelectorAll('.recommendation-card') as NodeListOf<HTMLElement>;
    allCards.forEach((card) => card.classList.remove('selected'));

    cardElement.classList.add('selected');

    // -----------------------------
    // Switch document tab
    // -----------------------------
    if (targetDocId) {
      const targetTab = document.querySelector(
        `.doc-tab[data-doc-id="${targetDocId}"]`
      ) as HTMLElement | null;

      if (targetTab) {
        // Create a fake event for switchDocumentTab
        const fakeEvent = { target: targetTab } as unknown as Event;
        this.switchDocumentTab(fakeEvent, targetDocId);
      }
    }

    // -----------------------------
    // Clear previous highlights
    // -----------------------------
    const viewer = document.getElementById('document-viewer') as HTMLElement | null;
    if (!viewer) return;

    const highlighted = viewer.querySelectorAll('.evidence-highlight') as NodeListOf<HTMLElement>;
    highlighted.forEach((el) => {
      // Remove highlight wrapper but preserve original content
      el.outerHTML = el.innerHTML;
    });

    // -----------------------------
    // Determine evidence category
    // -----------------------------
    let category = 'default';

    if (oasisId.startsWith('I8000')) {
      category = 'diagnosis';
    } else if (oasisId.startsWith('GG0130')) {
      category = 'gg-self-care';
    } else if (oasisId.startsWith('GG0170')) {
      category = 'gg-mobility';
    }

    // -----------------------------
    // Highlight evidence in document
    // -----------------------------
    const evidenceElements = viewer.querySelectorAll(
      `[data-evidence-for="${oasisId}"]`
    ) as NodeListOf<HTMLElement>;

    evidenceElements.forEach((evidenceEl) => {
      evidenceEl.innerHTML = `
      <mark class="evidence-highlight" data-category="${category}">
        ${evidenceEl.innerHTML}
      </mark>
    `;
    });

    // -----------------------------
    // Scroll to first evidence
    // -----------------------------
    if (evidenceElements.length > 0) {
      evidenceElements[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  acceptRecommendation(
    event: Event,
    oasisId: string,
    value: string,
    triggersPdgmUpdate = false,
    progressIncrement = 0 // currently unused, but kept for compatibility
  ): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const card = target.closest('.recommendation-card') as HTMLElement | null;
    if (!card) return;

    const formId = card.getAttribute('data-form-id');
    if (!formId) return;

    // Special handling for "Other Diagnoses" - add to list instead of overwriting
    if (formId === 'form-I8000-other-diagnoses-container') {
      const container = document.getElementById(formId) as HTMLElement | null;
      if (container) {
        // Remove placeholder if it exists
        const placeholder = container.querySelector('.border-dashed') as HTMLElement | null;
        if (placeholder) {
          placeholder.remove();
        }

        // Create new diagnosis entry
        const diagnosisDiv = document.createElement('div');
        diagnosisDiv.className =
          'p-2 bg-emerald-50 border-2 border-solid border-emerald-400 rounded min-h-[40px] flex items-center justify-between text-xs form-field-highlight';
        diagnosisDiv.innerHTML = `
        <span class="font-semibold text-slate-800">${value}</span>
        <ion-icon name="checkmark-circle" class="text-emerald-600 text-lg"></ion-icon>
      `;
        container.appendChild(diagnosisDiv);

        // Highlight animation
        setTimeout(() => diagnosisDiv.classList.remove('form-field-highlight'), 1500);

        // Scroll to container
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Normal handling for single-value fields
      const formField = document.getElementById(formId) as HTMLElement | null;
      if (formField) {
        formField.innerHTML = value;
        formField.classList.remove(
          'form-field-placeholder',
          'border-dashed',
          'border-yellow-400',
          'bg-yellow-50',
          'text-slate-600',
          'justify-center'
        );
        formField.classList.add(
          'form-field-value',
          'border-emerald-400',
          'bg-emerald-50',
          'border-solid'
        );

        // Add highlight animation
        formField.classList.add('form-field-highlight');
        setTimeout(() => formField.classList.remove('form-field-highlight'), 1500);

        // Scroll form to this field
        formField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Update progress
    this.itemsAccepted += 1;
    const progress = this.totalItems
      ? Math.min(Math.round((this.itemsAccepted / this.totalItems) * 100), 100)
      : 0;

    const progressBar = document.getElementById('progress-bar') as HTMLElement | null;
    const progressText = document.getElementById('progress-text') as HTMLElement | null;

    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
    if (progressText) {
      progressText.innerText = progress + '%';
    }

    // Update PDGM if applicable
    if (triggersPdgmUpdate) {
      const pdgmValueEl = document.getElementById('pdgm-value') as HTMLElement | null;
      const paymentEstimateEl = document.getElementById('payment-estimate') as HTMLElement | null;

      console.log('Payment update triggered for:', oasisId);
      console.log('Found pdgm-value element:', pdgmValueEl);
      console.log('Found payment-estimate element:', paymentEstimateEl);

      if (!pdgmValueEl || !pdgmValueEl.parentElement) {
        console.error('ERROR: pdgm-value element or parent not found!');
      } else {
        // Create LARGE increase indicator
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
          if (oasisId === 'I8000-comorbidity') {
            this.currentPayment = 3162.5; // Base + $287 comorbidity adjustment
          } else {
            this.currentPayment += 287;
          }

          console.log('New payment amount:', this.currentPayment);

          pdgmValueEl.innerText = '$' + this.currentPayment.toFixed(2);
          if (paymentEstimateEl) {
            paymentEstimateEl.innerText = '$' + this.currentPayment.toFixed(2);
          }

          // Reset styling after animation completes
          setTimeout(() => {
            pdgmValueEl.style.transform = 'scale(1)';
            pdgmValueEl.style.color = '';
            pdgmValueEl.style.fontWeight = '';
            increaseEl.remove();
          }, 2000);
        }, 400);

        // Update Summary Card comorbidity tier
        const summaryComorbidityEl = document.getElementById(
          'summary-comorbidity-tier'
        ) as HTMLElement | null;

        if (summaryComorbidityEl && oasisId === 'I8000-comorbidity') {
          summaryComorbidityEl.innerText = 'High';
          summaryComorbidityEl.classList.add('form-field-highlight');
          setTimeout(() => summaryComorbidityEl.classList.remove('form-field-highlight'), 1500);
        }
      }
    }

    // Update Summary Card items completed
    const summaryItemsEl = document.getElementById('summary-items-completed') as HTMLElement | null;
    if (summaryItemsEl) {
      summaryItemsEl.innerText = `${this.itemsAccepted} / ${this.totalItems}`;
    }

    // Mark card as accepted
    card.classList.add('accepted');
    const buttons = card.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent && btn.textContent.includes('Accept')) {
        btn.innerHTML = '✓ Accepted';
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-slate-400', 'cursor-not-allowed');
      }
    });

    // Auto-advance to next recommendation after a brief delay
    setTimeout(() => {
      this.moveToNextRecommendation(card);
    }, 800);
  }

  moveToNextRecommendation(currentCard: HTMLElement): void {
    // Get all recommendation cards
    const allCards = Array.from(document.querySelectorAll('.recommendation-card')) as HTMLElement[];

    const currentIndex = allCards.indexOf(currentCard);
    if (currentIndex === -1) {
      return;
    }

    // Find the next card that hasn't been accepted or rejected
    let nextCard: HTMLElement | null = null;
    for (let i = currentIndex + 1; i < allCards.length; i++) {
      const card = allCards[i];
      if (!card.classList.contains('accepted') && !card.classList.contains('rejected')) {
        nextCard = card;
        break;
      }
    }

    // If found, scroll to it and trigger its click
    if (nextCard) {
      // Scroll the card into view in the recommendations panel
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Trigger the card's onclick to show evidence in document
      nextCard.click();

      // Add subtle pulse effect
      nextCard.classList.add('ring-2', 'ring-indigo-400', 'ring-opacity-50');
      setTimeout(() => {
        nextCard?.classList.remove('ring-2', 'ring-indigo-400', 'ring-opacity-50');
      }, 2000);
    }
  }

  pendingRejectCard: HTMLElement | null = null;

  rejectRecommendation(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Find the recommendation card
    this.pendingRejectCard = target.closest('.recommendation-card') as HTMLElement | null;

    // Show the modal
    this.showModal('reject-modal');

    // Clear previous radio selection
    const reasonInputs = document.querySelectorAll(
      'input[name="reject-reason"]'
    ) as NodeListOf<HTMLInputElement>;

    reasonInputs.forEach((input) => (input.checked = false));
  }

  acceptGGRecommendation(event: Event, ggId: string, code: string): void {
    event.stopPropagation();

    const target = event.target as HTMLElement | null;
    if (!target) return;

    const card = target.closest('.recommendation-card') as HTMLElement | null;
    if (!card) return;

    const formId = card.getAttribute('data-form-id');
    if (!formId) return;

    // Find the form element (could be a select or a div)
    const formElement = document.getElementById(formId) as HTMLElement | null;
    if (!formElement) return;

    // Handle select elements
    if (formElement.tagName === 'SELECT') {
      const selectElement = formElement as HTMLSelectElement;

      // Find the option that starts with the code
      const options = Array.from(selectElement.options);
      const matchingOption = options.find(opt => opt.value.startsWith(code) || opt.text.startsWith(code));

      if (matchingOption) {
        selectElement.value = matchingOption.value;

        // Add visual feedback
        selectElement.classList.remove('bg-slate-50', 'border-slate-300');
        selectElement.classList.add('bg-emerald-50', 'border-emerald-400', 'border-2', 'form-field-highlight');

        setTimeout(() => selectElement.classList.remove('form-field-highlight'), 1500);

        // Scroll to the field
        selectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Handle div/span elements (auto-populated fields)
      const codeDescriptions: { [key: string]: string } = {
        '06': '06 - Independent',
        '05': '05 - Setup or clean-up assistance',
        '04': '04 - Supervision or touching assistance',
        '03': '03 - Partial/moderate assistance',
        '02': '02 - Substantial/maximal assistance',
        '01': '01 - Dependent',
        '07': '07 - Patient refused',
        '09': '09 - Not applicable'
      };

      const displayValue = codeDescriptions[code] || code;

      formElement.innerHTML = displayValue;
      formElement.classList.remove(
        'form-field-placeholder',
        'border-dashed',
        'border-yellow-400',
        'bg-yellow-50',
        'text-slate-600',
        'justify-center'
      );
      formElement.classList.add(
        'form-field-value',
        'border-emerald-400',
        'bg-emerald-50',
        'border-solid',
        'form-field-highlight'
      );

      setTimeout(() => formElement.classList.remove('form-field-highlight'), 1500);

      // Scroll to the field
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update progress
    this.itemsAccepted++;
    this.updateProgress();

    // Update Summary Card items completed
    const summaryItemsEl = document.getElementById('summary-items-completed') as HTMLElement | null;
    if (summaryItemsEl) {
      summaryItemsEl.innerText = `${this.itemsAccepted} / ${this.totalItems}`;
    }

    // Mark card as accepted
    card.classList.add('accepted');
    const buttons = card.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent && btn.textContent.includes('Accept')) {
        btn.innerHTML = '✓ Accepted';
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-slate-400', 'cursor-not-allowed');
      }
    });

    // Auto-advance to next recommendation
    setTimeout(() => {
      this.moveToNextRecommendation(card);
    }, 800);

    console.log('Accepted GG', { ggId, code, formId });
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
