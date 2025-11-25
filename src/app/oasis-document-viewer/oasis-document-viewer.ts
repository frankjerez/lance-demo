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
  signal,
} from '@angular/core';

export type DocumentTabId = 'discharge-doc' | 'referral-doc' | 'visit-doc' | 'audio-doc';

export interface DocumentTab {
  id: DocumentTabId;
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
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  // Audio player state
  isAudioPlaying = signal(false);
  audioCurrentTime = signal(0);
  audioDuration = signal(0);

  // Inputs from parent
  activeDocId = input<DocumentTabId>('discharge-doc');
  audioUrl = input<string | null>(null);
  highlightEvidence = input<EvidenceHighlight | null>(null);
  availableDocs = input<Set<DocumentTabId>>(
    new Set(['discharge-doc', 'referral-doc', 'visit-doc', 'audio-doc'])
  );
  isVisitNoteAvailable = input<boolean>(false);

  // Visit Note generation state
  isGeneratingVisitNote = signal(false);
  generationProgress = signal(0);
  generationStatus = signal('');

  // Outputs to parent
  onTabChange = output<DocumentTabId>();
  onVisitNoteGenerated = output<void>();

  private allTabs: DocumentTab[] = [
    { id: 'discharge-doc', label: 'Discharge Summary', active: true },
    { id: 'referral-doc', label: 'Referral/Orders', active: false },
    { id: 'visit-doc', label: 'Visit Note', active: false },
    { id: 'audio-doc', label: 'Visit Recording', active: false },
  ];

  tabs: DocumentTab[] = [];

  activeTabId: DocumentTabId = 'discharge-doc';
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

  switchTab(tabId: DocumentTabId): void {
    this.activeTabId = tabId;
    this.tabs.forEach((tab) => (tab.active = tab.id === tabId));

    // Show/hide document sections
    const allDocs: DocumentTabId[] = ['discharge-doc', 'referral-doc', 'visit-doc', 'audio-doc'];
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

  handleTabClick(tabId: DocumentTabId): void {
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

  // Audio player methods
  toggleAudioPlayback(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      this.isAudioPlaying.set(true);
    } else {
      audio.pause();
      this.isAudioPlaying.set(false);
    }
  }

  skipAudio(seconds: number): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  }

  onAudioEnded(): void {
    this.isAudioPlaying.set(false);
  }

  onAudioTimeUpdate(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    this.audioCurrentTime.set(audio.currentTime);
  }

  onAudioLoadedMetadata(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    this.audioDuration.set(audio.duration);
  }

  seekAudio(event: MouseEvent): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio || !audio.duration) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgressPercent(): number {
    const duration = this.audioDuration();
    if (!duration) return 0;
    return (this.audioCurrentTime() / duration) * 100;
  }

  // Visit Note generation methods
  startVisitNoteGeneration(): void {
    this.isGeneratingVisitNote.set(true);
    this.generationProgress.set(0);
    this.generationStatus.set('Analyzing transcript...');

    // Simulate the generation process
    const steps = [
      { progress: 15, status: 'Extracting patient information...' },
      { progress: 30, status: 'Identifying clinical findings...' },
      { progress: 45, status: 'Processing vital signs...' },
      { progress: 60, status: 'Documenting assessment details...' },
      { progress: 75, status: 'Generating care plan...' },
      { progress: 90, status: 'Formatting visit note...' },
      { progress: 100, status: 'Complete!' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        this.generationProgress.set(steps[stepIndex].progress);
        this.generationStatus.set(steps[stepIndex].status);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          this.isGeneratingVisitNote.set(false);
          this.onVisitNoteGenerated.emit();
        }, 500);
      }
    }, 600);
  }

  cancelVisitNoteGeneration(): void {
    this.isGeneratingVisitNote.set(false);
    this.generationProgress.set(0);
    this.generationStatus.set('');
  }
}
