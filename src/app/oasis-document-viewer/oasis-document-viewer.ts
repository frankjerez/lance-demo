import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  input,
  output,
  ViewChild,
  effect,
  AfterContentInit,
} from '@angular/core';

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
  availableDocs = input<Set<'discharge-doc' | 'referral-doc' | 'visit-doc'>>(
    new Set(['discharge-doc', 'referral-doc', 'visit-doc'])
  );

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
    // Filter tabs based on available documents
    effect(() => {
      const available = this.availableDocs();
      this.tabs = this.allTabs.filter((tab) => available.has(tab.id));
    });

    // React to activeDocId changes from parent (after content is initialized)
    effect(() => {
      const docId = this.activeDocId();
      if (docId && this.contentInitialized) {
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

  ngAfterContentInit(): void {
    // Wait for ng-content to be projected into the DOM
    this.contentInitialized = true;
    // Initialize with the default active document
    setTimeout(() => {
      this.switchTab(this.activeDocId());
    }, 0);
  }

  switchTab(tabId: 'discharge-doc' | 'referral-doc' | 'visit-doc'): void {
    this.activeTabId = tabId;
    this.tabs.forEach((tab) => (tab.active = tab.id === tabId));

    // Show/hide document sections
    const allDocs = ['discharge-doc', 'referral-doc', 'visit-doc'];
    allDocs.forEach((docId) => {
      const docElement = document.getElementById(docId);
      if (docElement) {
        if (docId === tabId) {
          docElement.classList.remove('hidden');
        } else {
          docElement.classList.add('hidden');
        }
      }
    });

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

    // Small delay to ensure tab switch completes and DOM is ready
    setTimeout(() => {
      // Apply new highlights
      const evidenceElements = viewer.querySelectorAll(
        `[data-evidence-for="${highlight.oasisId}"]`
      ) as NodeListOf<HTMLElement>;

      evidenceElements.forEach((evidenceEl) => {
        // Force re-render by removing and re-adding class for animation restart
        evidenceEl.innerHTML = `
          <mark class="evidence-highlight" data-category="${highlight.category}">
            ${evidenceEl.innerHTML}
          </mark>
        `;
      });

      // Scroll to first evidence with enhanced behavior
      if (evidenceElements.length > 0) {
        const firstEvidence = evidenceElements[0];
        const markElement = firstEvidence.querySelector('.evidence-highlight') as HTMLElement;
        const targetElement = markElement || firstEvidence;

        // Use scrollIntoView for reliable centering regardless of container height
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });

        // Show indicator after scroll completes
        setTimeout(() => {
          this.showScrollIndicator(targetElement);
        }, 500);
      }
    }, 100);
  }

  private showScrollIndicator(element: HTMLElement): void {
    // Get fresh position after scroll
    const rect = element.getBoundingClientRect();

    // Create a temporary pointing indicator
    const indicator = document.createElement('div');
    indicator.className = 'evidence-scroll-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        left: ${rect.left - 50}px;
        top: ${rect.top + rect.height / 2 - 12}px;
        z-index: 9999;
        animation: scroll-indicator 1.5s ease-in-out forwards;
        pointer-events: none;
      ">
        <span style="
          display: inline-flex;
          align-items: center;
          background: #dc2626;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        ">
          → Evidence
        </span>
      </div>
    `;
    document.body.appendChild(indicator);

    // Remove indicator after animation
    setTimeout(() => {
      indicator.remove();
    }, 1500);
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
