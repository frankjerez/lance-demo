import { Injectable, signal, effect } from '@angular/core';

export interface OasisFormState {
  patientId: string;
  formFieldValues: Record<string, string>;
  itemsAccepted: number;
  totalItems: number;
  lastUpdated: string;
}

export interface AnalyzerAlertState {
  alertId: string;
  status: 'new' | 'reviewed' | 'dismissed';
  timestamp: string;
}

export interface AvailableDocuments {
  documents: string[]; // ['discharge-doc', 'referral-doc', 'visit-doc']
  lastUpdated: string;
}

const FORM_STATE_KEY = 'lance-oasis-form-state-p1';
const ALERT_STATE_KEY = 'lance-analyzer-alert-states';
const AVAILABLE_DOCS_KEY = 'lance-available-documents';

/**
 * Central coordinator for OASIS assessment state
 * Manages form data, progress, and coordinates with other state services
 */
@Injectable({
  providedIn: 'root',
})
export class OasisStateService {
  // Form state
  private formState = signal<OasisFormState>({
    patientId: 'p1',
    formFieldValues: {},
    itemsAccepted: 0,
    totalItems: 89,
    lastUpdated: new Date().toISOString(),
  });

  // Available documents
  private availableDocs = signal<string[]>(['referral-doc']);

  // Analyzer alert states
  private alertStates = signal<Map<string, AnalyzerAlertState>>(new Map());

  // Expose as readonly
  readonly form = this.formState.asReadonly();
  readonly documents = this.availableDocs.asReadonly();
  readonly alerts = this.alertStates.asReadonly();

  constructor() {
    this.loadFromStorage();

    // Auto-save on changes
    effect(() => {
      this.formState();
      this.saveFormState();
    });

    effect(() => {
      this.availableDocs();
      this.saveAvailableDocs();
    });

    effect(() => {
      this.alertStates();
      this.saveAlertStates();
    });
  }

  // ========== Form State Methods ==========

  updateFormField(fieldId: string, value: string): void {
    this.formState.update(state => ({
      ...state,
      formFieldValues: {
        ...state.formFieldValues,
        [fieldId]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }

  updateItemsAccepted(count: number): void {
    this.formState.update(state => ({
      ...state,
      itemsAccepted: count,
      lastUpdated: new Date().toISOString(),
    }));
  }

  getFormFieldValue(fieldId: string): string | undefined {
    return this.formState().formFieldValues[fieldId];
  }

  getAllFormFields(): Record<string, string> {
    return this.formState().formFieldValues;
  }

  get progressPercentage(): number {
    const state = this.formState();
    return state.totalItems ? Math.min(Math.round((state.itemsAccepted / state.totalItems) * 100), 100) : 0;
  }

  // ========== Available Documents Methods ==========

  addAvailableDocument(docId: string): void {
    this.availableDocs.update(docs => {
      if (!docs.includes(docId)) {
        return [...docs, docId];
      }
      return docs;
    });
  }

  removeAvailableDocument(docId: string): void {
    this.availableDocs.update(docs => docs.filter(d => d !== docId));
  }

  isDocumentAvailable(docId: string): boolean {
    return this.availableDocs().includes(docId);
  }

  getAvailableDocuments(): string[] {
    return this.availableDocs();
  }

  // ========== Analyzer Alert Methods ==========

  updateAlertStatus(alertId: string, status: 'new' | 'reviewed' | 'dismissed'): void {
    this.alertStates.update(states => {
      const newStates = new Map(states);
      newStates.set(alertId, {
        alertId,
        status,
        timestamp: new Date().toISOString(),
      });
      return newStates;
    });
  }

  getAlertStatus(alertId: string): AnalyzerAlertState | undefined {
    return this.alertStates().get(alertId);
  }

  // ========== Reset Methods ==========

  resetForm(): void {
    this.formState.set({
      patientId: 'p1',
      formFieldValues: {},
      itemsAccepted: 0,
      totalItems: 89,
      lastUpdated: new Date().toISOString(),
    });
  }

  resetDocuments(): void {
    this.availableDocs.set(['referral-doc']);
  }

  resetAlerts(): void {
    this.alertStates.set(new Map());
  }

  resetAll(): void {
    this.resetForm();
    this.resetDocuments();
    this.resetAlerts();
  }

  // ========== Storage Methods ==========

  private saveFormState(): void {
    try {
      localStorage.setItem(FORM_STATE_KEY, JSON.stringify(this.formState()));
    } catch (error) {
      console.error('Failed to save form state:', error);
    }
  }

  private saveAvailableDocs(): void {
    try {
      const state: AvailableDocuments = {
        documents: this.availableDocs(),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(AVAILABLE_DOCS_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save available documents:', error);
    }
  }

  private saveAlertStates(): void {
    try {
      const statesArray = Array.from(this.alertStates().entries());
      localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(statesArray));
    } catch (error) {
      console.error('Failed to save alert states:', error);
    }
  }

  private loadFromStorage(): void {
    // Load form state
    try {
      const stored = localStorage.getItem(FORM_STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as OasisFormState;
        this.formState.set(state);
        console.log('📦 Loaded form state:', state.itemsAccepted, 'items accepted');
      }
    } catch (error) {
      console.error('Failed to load form state:', error);
    }

    // Load available documents
    try {
      const stored = localStorage.getItem(AVAILABLE_DOCS_KEY);
      if (stored) {
        const state = JSON.parse(stored) as AvailableDocuments;
        this.availableDocs.set(state.documents);
        console.log('📦 Loaded available documents:', state.documents);
      }
    } catch (error) {
      console.error('Failed to load available documents:', error);
    }

    // Load alert states
    try {
      const stored = localStorage.getItem(ALERT_STATE_KEY);
      if (stored) {
        const statesArray = JSON.parse(stored) as [string, AnalyzerAlertState][];
        const statesMap = new Map(statesArray);
        this.alertStates.set(statesMap);
        console.log('📦 Loaded alert states:', statesMap.size, 'alerts');
      }
    } catch (error) {
      console.error('Failed to load alert states:', error);
    }
  }
}
