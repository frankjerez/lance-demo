import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, input, output, ViewChild, effect } from '@angular/core';

export interface DocumentTab {
  id: 'discharge-doc' | 'referral-doc' | 'visit-doc';
  label: string;
  active: boolean;
}

export interface EvidenceHighlight {
  oasisId: string;
  category: 'diagnosis' | 'gg-self-care' | 'gg-mobility' | 'default';
}

@Component({
  selector: 'app-oasis-document-viewer',
  templateUrl: './oasis-document-viewer.html',
  styleUrls: ['./oasis-document-viewer.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class OasisDocumentViewerComponent {
  @ViewChild('documentViewer', { static: false }) documentViewerRef!: ElementRef;

  // Inputs from parent
  activeDocId = input<'discharge-doc' | 'referral-doc' | 'visit-doc'>('discharge-doc');
  highlightEvidence = input<EvidenceHighlight | null>(null);

  // Outputs to parent
  onTabChange = output<'discharge-doc' | 'referral-doc' | 'visit-doc'>();

  tabs: DocumentTab[] = [
    { id: 'discharge-doc', label: 'Discharge Summary', active: true },
    { id: 'referral-doc', label: 'Referral/Orders', active: false },
    { id: 'visit-doc', label: 'Visit Note', active: false },
  ];

  activeTabId: 'discharge-doc' | 'referral-doc' | 'visit-doc' = 'discharge-doc';

  constructor() {
    // React to activeDocId changes from parent
    effect(() => {
      const docId = this.activeDocId();
      if (docId) {
        this.switchTab(docId);
      }
    });

    // React to highlight evidence changes from parent
    effect(() => {
      const highlight = this.highlightEvidence();
      if (highlight) {
        this.applyEvidenceHighlight(highlight);
      }
    });
  }

  switchTab(tabId: 'discharge-doc' | 'referral-doc' | 'visit-doc'): void {
    this.activeTabId = tabId;
    this.tabs.forEach((tab) => (tab.active = tab.id === tabId));
    this.onTabChange.emit(tabId);
  }

  handleTabClick(tabId: 'discharge-doc' | 'referral-doc' | 'visit-doc'): void {
    this.switchTab(tabId);
  }

  private applyEvidenceHighlight(highlight: EvidenceHighlight): void {
    if (!this.documentViewerRef) return;

    const viewer = this.documentViewerRef.nativeElement as HTMLElement;

    // Clear previous highlights
    const highlighted = viewer.querySelectorAll('.evidence-highlight') as NodeListOf<HTMLElement>;
    highlighted.forEach((el) => {
      el.outerHTML = el.innerHTML;
    });

    // Apply new highlights
    const evidenceElements = viewer.querySelectorAll(
      `[data-evidence-for="${highlight.oasisId}"]`
    ) as NodeListOf<HTMLElement>;

    evidenceElements.forEach((evidenceEl) => {
      evidenceEl.innerHTML = `
        <mark class="evidence-highlight" data-category="${highlight.category}">
          ${evidenceEl.innerHTML}
        </mark>
      `;
    });

    // Scroll to first evidence
    if (evidenceElements.length > 0) {
      evidenceElements[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  clearHighlights(): void {
    if (!this.documentViewerRef) return;

    const viewer = this.documentViewerRef.nativeElement as HTMLElement;
    const highlighted = viewer.querySelectorAll('.evidence-highlight') as NodeListOf<HTMLElement>;

    highlighted.forEach((el) => {
      el.outerHTML = el.innerHTML;
    });
  }
}
