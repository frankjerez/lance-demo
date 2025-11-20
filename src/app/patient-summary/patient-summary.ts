// src/app/patient-summary/patient-summary.component.ts

import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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

  onOpenDoc(doc: MedicalDocument): void {
    if (!doc.uploaded) return;
    // Later: navigate to a doc viewer or open modal
    console.log('Open document', doc);
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
          uploaded: true,
          uploadedAt: '2024-10-02 10:15 AM',
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
        {
          id: 'doc3',
          type: 'VN',
          displayLabel: 'Visit Note',
          uploaded: true,
          uploadedAt: '2024-10-02 1:40 PM',
          fileName: 'visit_note_1.pdf',
        },
        {
          id: 'doc4',
          type: 'VN',
          displayLabel: 'Visit Note',
          uploaded: true,
          uploadedAt: '2024-10-05 2:10 PM',
          fileName: 'visit_note_2.pdf',
        },
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
