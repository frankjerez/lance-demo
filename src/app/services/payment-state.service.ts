import { Injectable, signal } from '@angular/core';

export interface PaymentState {
  totalPayment: number;
  comorbidityAdjustment: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentStateService {
  // Initial payment state matching the baseline
  private paymentState = signal<PaymentState>({
    totalPayment: 2875.5,
    comorbidityAdjustment: 0,
    lastUpdated: new Date(),
  });

  // Expose as readonly signal
  readonly payment = this.paymentState.asReadonly();

  updatePayment(totalPayment: number, comorbidityAdjustment: number): void {
    this.paymentState.set({
      totalPayment,
      comorbidityAdjustment,
      lastUpdated: new Date(),
    });
  }

  resetPayment(): void {
    this.paymentState.set({
      totalPayment: 2875.5,
      comorbidityAdjustment: 0,
      lastUpdated: new Date(),
    });
  }
}
