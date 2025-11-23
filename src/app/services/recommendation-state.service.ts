import { Injectable, signal } from '@angular/core';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected';

export interface RecommendationState {
  recommendationId: string;
  status: RecommendationStatus;
  timestamp: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecommendationStateService {
  // Track recommendation statuses
  private recommendationStates = signal<Map<string, RecommendationState>>(new Map());

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
  }

  getRecommendationStatus(recommendationId: string): RecommendationState | undefined {
    return this.recommendationStates().get(recommendationId);
  }

  getAllRecommendationStates(): Map<string, RecommendationState> {
    return this.recommendationStates();
  }

  resetRecommendations(): void {
    this.recommendationStates.set(new Map());
  }
}
