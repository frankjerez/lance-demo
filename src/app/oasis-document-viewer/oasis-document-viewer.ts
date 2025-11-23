import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, input, output, ViewChild, effect, AfterContentInit } from '@angular/core';

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
export class OasisDocumentViewerComponent implements AfterContentInit {
  @ViewChild('documentViewer', { static: false }) documentViewerRef!: ElementRef;

  // Inputs from parent
  activeDocId = input<'discharge-doc' | 'referral-doc' | 'visit-doc'>('discharge-doc');
  highlightEvidence = input<EvidenceHighlight | null>(null);
  availableDocs = input<Set<'discharge-doc' | 'referral-doc' | 'visit-doc'>>(new Set(['discharge-doc', 'referral-doc', 'visit-doc']));

  // Outputs to parent
  onTabChange = output<'discharge-doc' | 'referral-doc' | 'visit-doc'>();

  private allTabs: DocumentTab[] = [
    { id: 'discharge-doc', label: 'Discharge Summary', active: true },
    { id: 'referral-doc', label: 'Referral/Orders', active: false },
    { id: 'visit-doc', label: 'Visit Note', active: false },
  ];

  tabs: DocumentTab[] = [];

  activeTabId: 'discharge-doc' | 'referral-doc' | 'visit-doc' = 'discharge-doc';
  private contentInitialized = false;

  constructor() {
    console.log('🟣 Document viewer constructor called');
    console.log('🟣 Initial activeDocId value:', this.activeDocId());

    // Filter tabs based on available documents
    effect(() => {
      const available = this.availableDocs();
      console.log('🟣 Available docs changed:', Array.from(available));
      this.tabs = this.allTabs.filter((tab) => available.has(tab.id));
      console.log('🟣 Filtered tabs:', this.tabs.map(t => t.id));
    });

    // TEST: Simple effect that should always run
    try {
      effect(() => {
        console.log('🔴 TEST EFFECT IS RUNNING!');
      });
      console.log('🟣 Test effect created successfully');
    } catch (error) {
      console.error('🔴 Error creating test effect:', error);
    }

    // React to activeDocId changes from parent (after content is initialized)
    try {
      effect(() => {
        const docId = this.activeDocId();
        console.log('🟢 Document viewer effect triggered. activeDocId:', docId, 'contentInitialized:', this.contentInitialized);
        if (docId && this.contentInitialized) {
          console.log('🟢 Calling switchTab with:', docId);
          this.switchTab(docId);
        }
      });
      console.log('🟣 ActiveDocId effect created successfully');
    } catch (error) {
      console.error('🔴 Error creating activeDocId effect:', error);
    }

    // React to highlight evidence changes from parent
    try {
      effect(() => {
        const highlight = this.highlightEvidence();
        if (highlight) {
          this.applyEvidenceHighlight(highlight);
        }
      });
      console.log('🟣 Highlight effect created successfully');
    } catch (error) {
      console.error('🔴 Error creating highlight effect:', error);
    }

    console.log('🟣 Effects registered');
  }

  ngAfterContentInit(): void {
    console.log('🟣 ngAfterContentInit called');
    // Wait for ng-content to be projected into the DOM
    this.contentInitialized = true;
    console.log('🟣 contentInitialized set to true');
    // Initialize with the default active document
    setTimeout(() => {
      console.log('🟣 setTimeout executing, calling switchTab');
      this.switchTab(this.activeDocId());
    }, 0);
  }

  switchTab(tabId: 'discharge-doc' | 'referral-doc' | 'visit-doc'): void {
    console.log('🟡 switchTab called with:', tabId);
    this.activeTabId = tabId;
    this.tabs.forEach((tab) => (tab.active = tab.id === tabId));

    // Show/hide document sections
    const allDocs = ['discharge-doc', 'referral-doc', 'visit-doc'];
    allDocs.forEach((docId) => {
      const docElement = document.getElementById(docId);
      console.log('🟡 Looking for element:', docId, 'Found:', !!docElement);
      if (docElement) {
        if (docId === tabId) {
          console.log('🟡 Showing document:', docId);
          docElement.classList.remove('hidden');
        } else {
          console.log('🟡 Hiding document:', docId);
          docElement.classList.add('hidden');
        }
      }
    });

    console.log('🟡 Tab state after switch:', this.tabs.map(t => ({ id: t.id, active: t.active })));
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
