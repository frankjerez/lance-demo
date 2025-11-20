import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';

export interface PatientInfo {
  name: string;
  mrn: string;
  dob: string; // you can change to Date if you prefer
  age: string; // or number
}

export interface MedicareStatus {
  partAActive: boolean;
  partBActive: boolean;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface HomeHealthBenefit {
  available: boolean;
  noAuthRequired: boolean;
  remainingDays: number | null;
}

@Component({
  selector: 'app-eligibility-modal',
  templateUrl: './eligibility-modal.component.html',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EligibilityModalComponent {
  @Input() isOpen = false;

  @Input() patient!: PatientInfo;
  @Input() primaryPayer = 'Medicare';

  @Input() medicareStatus!: MedicareStatus;
  @Input() homeHealthBenefit!: HomeHealthBenefit;

  @Input() lastVerifiedLabel = 'Just now ✓';

  @Output() closed = new EventEmitter<void>();
  @Output() recheck = new EventEmitter<void>();
  @Output() continueAssessment = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  onRecheck(): void {
    this.recheck.emit();
  }

  onContinue(): void {
    this.continueAssessment.emit();
  }
}
