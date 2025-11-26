import { Injectable, signal, effect } from '@angular/core';

export interface CompletedEpisodeSummary {
  episodeId: string;
  patientId: string;
  completedAt: string;
  exportedFileName: string;

  // Assessment summary
  assessmentType: string;
  clinician: string;

  // Payment data at time of export
  totalPayment: number;
  baseRate: number;
  comorbidityAdjustment: number;
  functionalAdjustment: number;
  comorbidityTier: string;
  functionalLevel: string;

  // Diagnoses captured
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];

  // Progress metrics
  itemsAccepted: number;
  totalItems: number;
  completionPercentage: number;

  // AI recommendations accepted
  recommendationsAccepted: number;
}

const EPISODE_STATE_KEY = 'lance-episode-state';

@Injectable({
  providedIn: 'root',
})
export class EpisodeStateService {
  // Track completed episodes by episode ID
  private completedEpisodes = signal<Map<string, CompletedEpisodeSummary>>(new Map());

  // Expose as readonly
  readonly episodes = this.completedEpisodes.asReadonly();

  constructor() {
    this.loadFromStorage();

    // Auto-save on changes
    effect(() => {
      this.completedEpisodes();
      this.saveToStorage();
    });
  }

  /**
   * Mark an episode as completed with summary data
   */
  completeEpisode(summary: CompletedEpisodeSummary): void {
    this.completedEpisodes.update(episodes => {
      const newEpisodes = new Map(episodes);
      newEpisodes.set(summary.episodeId, summary);
      return newEpisodes;
    });
    console.log('Episode completed:', summary.episodeId, summary);
  }

  /**
   * Get completed episode summary by ID
   */
  getCompletedEpisode(episodeId: string): CompletedEpisodeSummary | undefined {
    return this.completedEpisodes().get(episodeId);
  }

  /**
   * Check if an episode is completed
   */
  isEpisodeCompleted(episodeId: string): boolean {
    return this.completedEpisodes().has(episodeId);
  }

  /**
   * Get all completed episodes for a patient
   */
  getCompletedEpisodesForPatient(patientId: string): CompletedEpisodeSummary[] {
    const episodes = Array.from(this.completedEpisodes().values());
    return episodes.filter(ep => ep.patientId === patientId);
  }

  /**
   * Get the most recent completed episode
   */
  getMostRecentCompletedEpisode(patientId: string): CompletedEpisodeSummary | undefined {
    const episodes = this.getCompletedEpisodesForPatient(patientId);
    if (episodes.length === 0) return undefined;

    return episodes.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
  }

  /**
   * Reset all episode data
   */
  resetAll(): void {
    this.completedEpisodes.set(new Map());
    localStorage.removeItem(EPISODE_STATE_KEY);
    console.log('Episode state reset');
  }

  private saveToStorage(): void {
    try {
      const episodesArray = Array.from(this.completedEpisodes().entries());
      localStorage.setItem(EPISODE_STATE_KEY, JSON.stringify(episodesArray));
    } catch (error) {
      console.error('Failed to save episode state:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(EPISODE_STATE_KEY);
      if (stored) {
        const episodesArray = JSON.parse(stored) as [string, CompletedEpisodeSummary][];
        const episodesMap = new Map(episodesArray);
        this.completedEpisodes.set(episodesMap);
        console.log('Loaded episode state:', episodesMap.size, 'completed episodes');
      }
    } catch (error) {
      console.error('Failed to load episode state:', error);
    }
  }
}
