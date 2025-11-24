import { Injectable, signal } from '@angular/core';

export interface PaymentState {
  totalPayment: number;
  comorbidityAdjustment: number;
  lastUpdated: Date;
}

const STORAGE_KEY = 'lance-payment-state';

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

  constructor() {
    this.loadFromStorage();
  }

  updatePayment(totalPayment: number, comorbidityAdjustment: number): void {
    this.paymentState.set({
      totalPayment,
      comorbidityAdjustment,
      lastUpdated: new Date(),
    });
    this.saveToStorage();
  }

  resetPayment(): void {
    this.paymentState.set({
      totalPayment: 2875.5,
      comorbidityAdjustment: 0,
      lastUpdated: new Date(),
    });
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const state = this.paymentState();
      // Convert Date to string for storage
      const storableState = {
        ...state,
        lastUpdated: state.lastUpdated.toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storableState));
    } catch (error) {
      console.error('Failed to save payment state to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert ISO string back to Date
        const state: PaymentState = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
        this.paymentState.set(state);
        console.log('📦 Loaded payment state from localStorage:', state.totalPayment);
      }
    } catch (error) {
      console.error('Failed to load payment state from localStorage:', error);
    }
  }
}
