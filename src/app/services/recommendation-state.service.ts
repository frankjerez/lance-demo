import { Injectable, signal } from '@angular/core';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected';

export interface RecommendationState {
  recommendationId: string;
  status: RecommendationStatus;
  timestamp: string;
  rejectionReason?: string;
}

const STORAGE_KEY = 'lance-recommendation-states';

@Injectable({
  providedIn: 'root',
})
export class RecommendationStateService {
  // Track recommendation statuses
  private recommendationStates = signal<Map<string, RecommendationState>>(new Map());

  constructor() {
    this.loadFromStorage();
  }

  updateRecommendationStatus(
    recommendationId: string,
    status: RecommendationStatus,
    rejectionReason?: string
  ): void {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const currentStates = new Map(this.recommendationStates());
    currentStates.set(recommendationId, {
      recommendationId,
      status,
      timestamp,
      rejectionReason,
    });

    this.recommendationStates.set(currentStates);
    this.saveToStorage();
  }

  getRecommendationStatus(recommendationId: string): RecommendationState | undefined {
    return this.recommendationStates().get(recommendationId);
  }

  getAllRecommendationStates(): Map<string, RecommendationState> {
    return this.recommendationStates();
  }

  resetRecommendations(): void {
    this.recommendationStates.set(new Map());
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const statesArray = Array.from(this.recommendationStates().entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statesArray));
    } catch (error) {
      console.error('Failed to save recommendation states to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const statesArray = JSON.parse(stored) as [string, RecommendationState][];
        const statesMap = new Map(statesArray);
        this.recommendationStates.set(statesMap);
        console.log('📦 Loaded recommendation states from localStorage:', statesMap.size, 'items');
      }
    } catch (error) {
      console.error('Failed to load recommendation states from localStorage:', error);
    }
  }
}
