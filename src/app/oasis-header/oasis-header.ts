import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-oasis-header',
  templateUrl: './oasis-header.html',
  styleUrls: ['./oasis-header.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class OasisHeaderComponent {
  // Inputs from parent
  patientName = input<string>('');
  patientMrn = input<string>('');
  assessmentType = input<string>('Start of Care');
  currentPayment = input<number>(0);
  itemsAccepted = input<number>(0);
  totalItems = input<number>(89);
  hasAnalyzerAlerts = input<boolean>(false);
  newAnalyzerAlertCount = input<number>(0);
  showAnalyzer = input<boolean>(false);
  isSavingAssessment = input<boolean>(false);

  // Payment breakdown inputs
  baseRate = input<number>(2875.5);
  comorbidityAdjustment = input<number>(0);
  functionalAdjustment = input<number>(0);
  comorbidityTier = input<string>('None');
  functionalLevel = input<string>('Low');
  clinicalGroup = input<string>('MS-Rehab');

  // Payment popup state
  showPaymentPopup = signal(false);

  // Outputs to parent
  onBackToDashboard = output<void>();
  onPatientClick = output<void>();
  onLogoClick = output<void>();
  onQuickEligibilityCheck = output<Event>();
  onToggleAnalyzer = output<void>();
  onOpenAnalyzer = output<void>();
  onSaveAssessment = output<void>();
  onReset = output<void>();
  onExport = output<void>();
  onValidate = output<void>();

  handleBackClick(): void {
    this.onBackToDashboard.emit();
  }

  handlePatientClick(): void {
    this.onPatientClick.emit();
  }

  handleLogoClick(): void {
    this.onLogoClick.emit();
  }

  handleEligibilityClick(event: Event): void {
    this.onQuickEligibilityCheck.emit(event);
  }

  handleToggleAnalyzer(): void {
    this.onToggleAnalyzer.emit();
  }

  handleOpenAnalyzer(): void {
    this.onOpenAnalyzer.emit();
  }

  handleSaveClick(): void {
    this.onSaveAssessment.emit();
  }

  handleResetClick(): void {
    this.onReset.emit();
  }

  handleExportClick(): void {
    this.onExport.emit();
  }

  handleValidateClick(): void {
    this.onValidate.emit();
  }

  togglePaymentPopup(event: Event): void {
    event.stopPropagation();
    this.showPaymentPopup.update((v) => !v);
  }

  closePaymentPopup(): void {
    this.showPaymentPopup.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close popup when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.payment-popup-container')) {
      this.showPaymentPopup.set(false);
    }
  }
}
