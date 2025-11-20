// src/app/patient-summary/patient-summary.component.ts

import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientSummary, MedicalDocument } from './data/patient-summary-data';
import { CommonModule } from '@angular/common';

type SummaryTab = 'demographics' | 'history' | 'docs' | 'payment';

@Component({
  selector: 'app-patient-summary',
  templateUrl: './patient-summary.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class PatientSummaryComponent implements OnInit {
  patientId!: string;
  activeTab: SummaryTab = 'demographics';

  patientSummary!: PatientSummary;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || 'p1';

    // For now, just mock data; later you can load by this.patientId
    this.patientSummary = this.buildMockSummary(this.patientId);
  }

  setTab(tab: SummaryTab): void {
    this.activeTab = tab;
  }

  closePanel(): void {
    // Go back to patient list; adjust route as needed
    this.router.navigate(['/patients']);
  }

  startAIProcessing() {
    this.hideModal('upload-modal');

    const processingOverlay = document.getElementById('processing-overlay');
    if (!processingOverlay) return;

    processingOverlay.classList.remove('hidden');
    processingOverlay.classList.add('flex');

    setTimeout(() => {
      processingOverlay.classList.add('hidden');
      processingOverlay.classList.remove('flex');
      this.router.navigate(['/oasisnew']);
    }, 3500);
  }

  onOpenDoc(doc: MedicalDocument): void {
    if (!doc.uploaded) return;
    // Later: navigate to a doc viewer or open modal
    console.log('Open document', doc);
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  triggerFileUpload(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
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

  updateEligibilityTimestamp(): void {
    const timestamp = document.querySelector(
      '#eligibility-modal .text-xs.text-slate-500.text-center p'
    ) as HTMLElement | null;

    if (timestamp) {
      timestamp.innerHTML = 'Last verified: Just now • Source: CMS Medicare Portal';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // For now we just mock adding it to docs; later you call your API here
    const now = new Date();
    const uploadedAt = now.toLocaleString(); // or your own formatter

    const newDoc: MedicalDocument = {
      id: `doc-${Date.now()}`,
      type: 'Other', // or infer from file.type / ask user
      displayLabel: 'Uploaded Medical Record',
      uploaded: true,
      uploadedAt,
      fileName: file.name,
    };

    // Only for this patient (John Smith in your case)
    this.patientSummary.docs = [...this.patientSummary.docs, newDoc];

    // Reset input so selecting same file again still triggers change
    input.value = '';

    this.startAIProcessing();
  }

  private buildMockSummary(id: string): PatientSummary {
    // You can switch over id later if you want per-patient mock data
    return {
      id,
      mrn: 'MRN-87654',
      demographics: {
        name: 'John Smith',
        dob: '1958-09-03',
        sex: 'M',
        age: 66,
        phone: '(786) 555-1142',
        address: '7421 NW 12th St, Miami, FL 33126',
        insurance: 'Medicare Advantage',
        memberId: 'MCR-876543210',
        pcp: 'Dr. Michael Thompson, DO',
        agencyName: 'Sunrise Home Health Agency',
      },
      history: [
        {
          episodeId: 'EP-20231101',
          type: 'Start of Care (SOC)',
          startDate: '2023-11-01',
          endDate: '2023-12-15',
          status: 'Completed',
          clinician: 'Dr. Anna Thompson',
        },
        {
          episodeId: 'EP-20240215',
          type: 'Recertification (ROC)',
          startDate: '2024-02-15',
          endDate: '2024-03-30',
          status: 'Completed',
          clinician: 'RN Sarah Martinez',
        },
        {
          episodeId: 'EP-20241002',
          type: 'Start of Care (SOC)',
          startDate: '2024-10-02',
          status: 'In Review',
          clinician: 'RN John Alvarez',
        },
      ],
      docs: [
        {
          id: 'doc1',
          type: 'DS',
          displayLabel: 'Discharge Summary',
          uploaded: false,
          missingReason: 'Pending upload from clinician',
          fileName: 'discharge_summary.pdf',
        },
        {
          id: 'doc2',
          type: 'RO',
          displayLabel: 'Referral / Orders',
          uploaded: true,
          uploadedAt: '2024-10-02 10:20 AM',
          fileName: 'referral.pdf',
        },
        // {
        //   id: 'doc3',
        //   type: 'VN',
        //   displayLabel: 'Visit Note',
        //   uploaded: true,
        //   uploadedAt: '2024-10-02 1:40 PM',
        //   fileName: 'visit_note_1.pdf',
        // },
        // {
        //   id: 'doc4',
        //   type: 'VN',
        //   displayLabel: 'Visit Note',
        //   uploaded: true,
        //   uploadedAt: '2024-10-05 2:10 PM',
        //   fileName: 'visit_note_2.pdf',
        // },
        {
          id: 'doc5',
          type: 'VN',
          displayLabel: 'Visit Note',
          uploaded: false,
          missingReason: 'Clinician did not complete documentation',
        },
        {
          id: 'doc6',
          type: 'H&P',
          displayLabel: 'History & Physical',
          uploaded: true,
          uploadedAt: '2024-10-02 9:50 AM',
          fileName: 'hp.pdf',
        },
        {
          id: 'doc7',
          type: 'Labs',
          displayLabel: 'Lab Reports',
          uploaded: false,
          missingReason: 'External provider delays',
        },
      ],
      payment: {
        hippsCode: '2CB21',
        baseRate: 2753.5,
        comorbidityAdjustment: 287.0,
        functionalLevelAdjustment: 125.0,
        lutsAdjustment: 89.25,
        totalPayment: 2753.5 + 287.0 + 125.0 + 89.25,
      },
    };
  }
}
