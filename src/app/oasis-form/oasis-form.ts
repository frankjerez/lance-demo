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

        // Scroll to container within the form (not the entire page)
        this.scrollToFieldWithinForm(container);
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

        // Scroll form to this field within the form container
        this.scrollToFieldWithinForm(formField);
      }
    }
  }

  highlightField(fieldId: string): void {
    const formField = document.getElementById(fieldId) as HTMLElement | null;
    if (formField) {
      formField.classList.add('form-field-highlight');
      setTimeout(() => formField.classList.remove('form-field-highlight'), 1500);
      this.scrollToFieldWithinForm(formField);
    }
  }

  /**
   * Scroll to a field within the form content area without scrolling the entire page
   */
  private scrollToFieldWithinForm(element: HTMLElement): void {
    // Find the scrollable form container
    const formContainer = element.closest('.overflow-y-auto') as HTMLElement | null;

    if (formContainer) {
      // Calculate position relative to the scrollable container
      const elementRect = element.getBoundingClientRect();
      const containerRect = formContainer.getBoundingClientRect();

      // Calculate the scroll position to center the element in the container
      const elementTop = element.offsetTop;
      const containerHeight = formContainer.clientHeight;
      const elementHeight = element.offsetHeight;
      const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);

      // Smooth scroll within the container
      formContainer.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    } else {
      // Fallback: use nearest block to minimize page scrolling
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
