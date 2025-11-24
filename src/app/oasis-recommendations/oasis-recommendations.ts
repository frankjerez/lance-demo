import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

export type AnalyzerAlertType = 'coding_opportunity' | 'inconsistency';
export type AnalyzerAlertSeverity = 'low' | 'medium' | 'high';
export type AnalyzerAlertStatus = 'new' | 'reviewed' | 'dismissed';

export interface AnalyzerAlert {
  id: string;
  type: AnalyzerAlertType;
  severity: AnalyzerAlertSeverity;
  status: AnalyzerAlertStatus;
  title: string;
  description: string;
  evidenceDocId: 'discharge-doc' | 'referral-doc' | 'visit-doc';
  evidenceAnchorId?: string;
  relatedOasisItem?: string;
  hippsImpact?: {
    delta: number;
    description: string;
  };
  linkedRecommendationId?: string;
}

export type AiRecommendationStatus = 'pending' | 'accepted' | 'rejected';
export type AiRecommendationKind = 'icd' | 'gg';

export interface AiRecommendation {
  id: string;
  kind: AiRecommendationKind;
  headerLabel: string;
  title: string;
  rationaleHtml: string;
  contextLabel: string;
  evidenceDocLabel: string;
  badgeLabel?: string;
  badgeClass?: string;
  selectionOasisKey: string;
  evidenceDocId: 'discharge-doc' | 'referral-doc' | 'visit-doc';
  formFieldId: string;
  oasisTargetId: string;
  acceptValue?: string;
  ggValue?: string;
  triggersPdgmUpdate: boolean;
  progressIncrement: number;
  status: AiRecommendationStatus;
}

@Component({
  selector: 'app-oasis-recommendations',
  templateUrl: './oasis-recommendations.html',
  styleUrls: ['./oasis-recommendations.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class OasisRecommendationsComponent {
  // Inputs from parent
  recommendations = input<AiRecommendation[]>([]);
  analyzerAlerts = input<AnalyzerAlert[]>([]);
  showAnalyzer = input<boolean>(false);
  selectedAlertId = input<string | null>(null);

  // Outputs to parent
  onRecommendationSelect = output<{
    recommendation: AiRecommendation;
    event: Event;
  }>();
  onRecommendationAccept = output<{
    recommendation: AiRecommendation;
    event: Event;
  }>();
  onRecommendationReject = output<{
    recommendation: AiRecommendation;
    event: Event;
  }>();
  onRecommendationUndo = output<{
    recommendation: AiRecommendation;
    event: Event;
  }>();
  onAlertClick = output<{ alert: AnalyzerAlert; event?: Event }>();
  onAlertStatusChange = output<{
    alert: AnalyzerAlert;
    status: AnalyzerAlertStatus;
  }>();

  get newAnalyzerAlertCount(): number {
    return this.analyzerAlerts().filter((a) => a.status === 'new').length;
  }

  handleRecommendationSelect(recommendation: AiRecommendation, event: Event): void {
    this.onRecommendationSelect.emit({ recommendation, event });
  }

  handleRecommendationAccept(recommendation: AiRecommendation, event: Event): void {
    this.onRecommendationAccept.emit({ recommendation, event });
  }

  handleRecommendationReject(recommendation: AiRecommendation, event: Event): void {
    this.onRecommendationReject.emit({ recommendation, event });
  }

  handleRecommendationUndo(recommendation: AiRecommendation, event: Event): void {
    this.onRecommendationUndo.emit({ recommendation, event });
  }

  handleAlertClick(alert: AnalyzerAlert, event?: Event): void {
    this.onAlertClick.emit({ alert, event });
  }

  handleAlertStatusChange(alert: AnalyzerAlert, status: AnalyzerAlertStatus, event: Event): void {
    event.stopPropagation();
    this.onAlertStatusChange.emit({ alert, status });
  }
}
