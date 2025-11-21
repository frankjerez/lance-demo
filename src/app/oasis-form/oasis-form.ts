import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

export interface FormFieldUpdate {
  fieldId: string;
  value: string;
  isOtherDiagnosis?: boolean;
}

@Component({
  selector: 'app-oasis-form',
  templateUrl: './oasis-form.html',
  styleUrls: ['./oasis-form.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class OasisFormComponent {
  // Inputs from parent
  patientName = input<string>('');
  itemsAccepted = input<number>(0);
  totalItems = input<number>(89);
  currentPayment = input<number>(0);

  // Outputs to parent
  onValidateForm = output<void>();

  get progressPercentage(): number {
    const total = this.totalItems();
    return total ? Math.min(Math.round((this.itemsAccepted() / total) * 100), 100) : 0;
  }

  handleValidateClick(): void {
    this.onValidateForm.emit();
  }

  // Helper methods for form field manipulation (called from parent via ViewChild)
  populateField(fieldId: string, value: string, isOtherDiagnosis = false): void {
    if (isOtherDiagnosis) {
      const container = document.getElementById(fieldId) as HTMLElement | null;
      if (container) {
        // Remove placeholder if exists
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
      // Normal single-value field handling
      const formField = document.getElementById(fieldId) as HTMLElement | null;
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
  }

  highlightField(fieldId: string): void {
    const formField = document.getElementById(fieldId) as HTMLElement | null;
    if (formField) {
      formField.classList.add('form-field-highlight');
      setTimeout(() => formField.classList.remove('form-field-highlight'), 1500);
      formField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
