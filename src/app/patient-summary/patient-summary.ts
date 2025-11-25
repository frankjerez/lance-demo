// src/app/patient-summary/patient-summary.component.ts

import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientSummary, MedicalDocument, EpisodeHistory } from './data/patient-summary-data';
import { CommonModule } from '@angular/common';
import { PaymentStateService } from '../services/payment-state.service';
import { DocumentStateService } from '../services/document-state.service';

type SummaryTab = 'demographics' | 'history' | 'docs' | 'payment';

@Component({
  selector: 'app-patient-summary',
  templateUrl: './patient-summary.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class PatientSummaryComponent implements OnInit {
  private paymentStateService = inject(PaymentStateService);
  private documentStateService = inject(DocumentStateService);

  patientId!: string;
  activeTab: SummaryTab = 'demographics';

  selectedEpisode?: EpisodeHistory;

  patientSummary: PatientSummary = undefined as any;

  // Eligibility check date tracking
  lastEligibilityCheck = signal<Date>(new Date());

  selectEpisode(ep: EpisodeHistory) {
    // click again to collapse
    this.selectedEpisode = this.selectedEpisode === ep ? undefined : ep;
  }

  getUploadedDocsCount(): number {
    return this.patientSummary?.docs?.filter(doc => doc.uploaded).length || 0;
  }

  private buildJohnSmithHistory(): EpisodeHistory[] {
    return [
      {
        type: 'Episode 1 – Start of Care (SOC)',
        startDate: '2024-01-10',
        endDate: '2024-03-10',
        clinician: 'RN Maria Lopez',
        status: 'Completed',
        primaryReason:
          'Post-hospitalization home health SOC after CHF exacerbation with uncontrolled diabetes and shortness of breath.',
        diagnoses: [
          'CHF (congestive heart failure)',
          'Type 2 diabetes mellitus',
          'COPD',
          'Hypertension',
        ],
        planOfCare: [
          {
            title: 'CHF management',
            items: [
              'Daily weight monitoring and symptom review each visit.',
              'Low-sodium diet education and written materials.',
              'Assess lung sounds and lower extremity edema each visit.',
              'Reinforce adherence to prescribed diuretic (Lasix).',
            ],
          },
          {
            title: 'Diabetes management',
            items: [
              'Teach self-monitoring of blood glucose (SMBG) with log sheet.',
              'Provide dietary teaching focused on carb control.',
              'Perform foot exam each nursing visit.',
              'Educate on hypoglycemia recognition and treatment.',
            ],
          },
          {
            title: 'COPD & respiratory status',
            items: [
              'Review inhaler technique and schedule.',
              'Teach pursed-lip breathing and energy conservation.',
            ],
          },
          {
            title: 'Safety and fall prevention',
            items: [
              'Home safety assessment during initial visit.',
              'Reinforce consistent use of walker for ambulation.',
            ],
          },
        ],
        interventions: [
          'Completed 8 skilled nursing visits with ongoing assessment of CHF and diabetes control.',
          'Identified one episode of hypoglycemia (BG 58) during visit; treated with oral glucose and re-education.',
          'Corrected improper inhaler technique by visit 3.',
          'Documented elevated fall risk due to generalized weakness and deconditioning.',
        ],
        outcome:
          'Symptoms improved but patient continued to experience shortness of breath with exertion; recertified for continued skilled nursing.',
      },
      {
        type: 'Episode 2 – Recertification',
        startDate: '2024-03-11',
        endDate: '2024-05-09',
        clinician: 'RN Maria Lopez',
        status: 'Completed',
        primaryReason:
          'Ongoing CHF and diabetes instability with new concerns about forgetfulness affecting medication adherence.',
        diagnoses: [
          'CHF (congestive heart failure)',
          'Type 2 diabetes mellitus on basal insulin',
          'COPD',
          'Possible mild cognitive impairment',
        ],
        planOfCare: [
          {
            title: 'Medication management',
            items: [
              'Teach and implement use of weekly pillbox.',
              'Perform weekly medication reconciliation.',
              'Assess adherence in context of emerging memory issues.',
            ],
          },
          {
            title: 'CHF monitoring',
            items: [
              'Reinforce daily weights with threshold for calling provider (2–3 lb gain in 24 hrs).',
              'Review fluid restriction and sodium limits.',
            ],
          },
          {
            title: 'Diabetes and insulin',
            items: [
              'Teach basal insulin administration and site rotation.',
              'Review SMBG targets and logging.',
              'Assess for early neuropathy at each visit.',
            ],
          },
          {
            title: 'Cognitive and safety',
            items: [
              'Screen for cognitive changes via brief test (e.g., Mini-Cog).',
              'Involve family in medication supervision and safety planning.',
            ],
          },
        ],
        interventions: [
          'Identified 15-lb unintentional weight gain over ~6 weeks; MD notified, CHF regimen adjusted.',
          'Documented that ~35% of days lacked SMBG entries, suggesting inconsistent adherence.',
          'Noted new symptoms of neuropathy (burning, tingling in feet).',
          'Recorded multiple instances of missed evening medications due to forgetfulness; family instructed to assist with reminders and pillbox setup.',
        ],
        outcome:
          'CHF worsened, resulting in a brief 3-day hospitalization; patient returned home on an adjusted regimen and remained appropriate for continued home health.',
      },
      {
        type: 'Episode 3 – Post-Hospitalization',
        startDate: '2024-05-10',
        endDate: '2024-07-10',
        clinician: 'RN James Carter',
        status: 'Completed',
        primaryReason:
          'Post-hospital episode following CHF exacerbation, COPD flare, and early diabetic foot infection.',
        diagnoses: [
          'CHF (post-exacerbation)',
          'Type 2 diabetes with foot ulcer',
          'COPD (recent exacerbation)',
          'Hypertension',
        ],
        planOfCare: [
          {
            title: 'New wound care – left foot ulcer',
            items: [
              'Cleanse wound per protocol and apply hydrocolloid dressing.',
              'Perform daily (or each visit) wound assessment and measurements.',
              'Provide offloading education and ensure proper footwear.',
            ],
          },
          {
            title: 'CHF post-discharge pathway',
            items: [
              'Reinforce diuretic regimen and timing.',
              'Monitor for weight gain, dyspnea, and edema.',
            ],
          },
          {
            title: 'Diabetes & glycemic control',
            items: [
              'Tighten BG monitoring schedule and reinforce insulin sliding scale.',
              'Provide intensive teaching on foot care and infection prevention.',
            ],
          },
          {
            title: 'COPD management',
            items: [
              'Teach nebulizer use with return demonstration.',
              'Monitor oxygen saturation and respiratory status each visit.',
            ],
          },
        ],
        interventions: [
          'Wound assessments performed at each visit with documentation of gradual improvement in size and appearance.',
          'Reinforced no barefoot walking; noted occasional non-compliance during early visits.',
          'BG logs showed wide variability (e.g., 78–295 mg/dL); MD notified of labile control.',
          'Corrected nebulizer use errors; adherence improved by mid-episode.',
          'Documented family concerns about mild evening confusion and forgetfulness.',
        ],
        outcome:
          'Left foot ulcer nearly resolved; patient remained high risk due to CHF, COPD, and diabetes with cognitive concerns and was recertified for continued monitoring.',
      },
      {
        type: 'Episode 4 – High-Risk Recertification',
        startDate: '2024-07-11',
        endDate: '2024-09-08',
        clinician: 'RN James Carter',
        status: 'Completed',
        primaryReason:
          'Ongoing high risk related to CHF, COPD, neuropathy, and progressive balance issues.',
        diagnoses: [
          'CHF',
          'Type 2 diabetes with neuropathy',
          'COPD',
          'High fall risk',
          'Mild cognitive impairment (suspected)',
        ],
        planOfCare: [
          {
            title: 'Neuropathy and foot care',
            items: [
              'Reinforce closed-toe protective footwear at all times.',
              'Encourage daily foot inspection with patient or family.',
              'Perform monofilament testing and document loss of sensation.',
            ],
          },
          {
            title: 'CHF monitoring and telehealth readiness',
            items: [
              'Promote consistent daily BP and weight tracking.',
              'Educate on early symptom reporting (weight gain, orthopnea).',
            ],
          },
          {
            title: 'COPD & infection surveillance',
            items: [
              'Review signs of respiratory infection at each visit.',
              'Assess for potential need for long-term home O₂.',
            ],
          },
          {
            title: 'Cognitive & safety',
            items: [
              'Repeat brief cognitive screening when appropriate.',
              'Reinforce family role in medication prompting and supervision.',
            ],
          },
          {
            title: 'Fall prevention',
            items: [
              'Assess balance and gait; recommend PT referral.',
              'Review environmental hazards and remove throw rugs.',
            ],
          },
        ],
        interventions: [
          'Observed mild balance instability and intermittent dizziness; PT referral recommended to provider.',
          'Documented two episodes of dizziness after medication administration; provider notified.',
          'Confirmed loss of protective sensation in one toe during monofilament testing.',
          'Reinforced family supervision of insulin and pillbox fills due to ongoing forgetfulness.',
        ],
        outcome:
          'Patient remained clinically fragile but stable with close monitoring; recertified for ongoing skilled services.',
      },
      {
        type: 'Episode 5 – Current Episode (Active)',
        startDate: '2024-09-09',
        endDate: '2024-11-07',
        clinician: 'RN Sarah Nguyen',
        status: 'Active',
        primaryReason:
          'Continued high-risk home health needs: CHF, COPD, diabetes with neuropathy, and risk for recurrent foot ulcer.',
        diagnoses: [
          'CHF with ongoing symptoms',
          'Type 2 diabetes with neuropathy',
          'COPD',
          'History of diabetic foot ulcer',
          'Mild cognitive impairment (suspected)',
        ],
        planOfCare: [
          {
            title: 'Wound prevention and skin integrity',
            items: [
              'Monitor for recurrence of foot ulcers, especially toes and pressure areas.',
              'Educate on protective footwear and avoidance of barefoot walking.',
              'Teach daily moisturizing to prevent skin cracks.',
            ],
          },
          {
            title: 'CHF & COPD dual management',
            items: [
              'Assess lung sounds, edema, and weight trends at each visit.',
              'Reinforce breathing exercises and inhaler/nebulizer adherence.',
              'Provide dietary reinforcement regarding sodium restriction.',
            ],
          },
          {
            title: 'Diabetes control',
            items: [
              'Review insulin timing and doses at each visit.',
              'Evaluate for hypoglycemia and hyperglycemia episodes.',
              'Reinforce BG log completion.',
            ],
          },
          {
            title: 'Cognitive monitoring & caregiver support',
            items: [
              'Monitor for worsening memory or confusion.',
              'Encourage family involvement in med setup and appointment reminders.',
            ],
          },
          {
            title: 'Fall risk and environment',
            items: [
              'Reassess home for new hazards (e.g., new area rugs).',
              'Reinforce safe walker use and pacing strategies.',
            ],
          },
        ],
        interventions: [
          'Identified inconsistent insulin use and gaps in BG logging; flagged as high-priority adherence issue.',
          'Noted new redness on right great toe, concerning for early skin breakdown; MD and podiatry referral considered.',
          'Documented patient reporting intermittent night-time chest heaviness; provider notified for further evaluation.',
          'Reinforced breathing treatment schedule; patient still requires reminders.',
        ],
        outcome:
          'Episode in progress; multiple risk factors actively monitored. Several potential missed-opportunity scenarios appropriate for AI analyzer and coding support.',
      },
    ];
  }

  constructor(private route: ActivatedRoute, private router: Router) {
    //this.patientSummary.history = this.buildJohnSmithHistory();
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || 'p1';

    // For now, just mock data; later you can load by this.patientId
    this.patientSummary = this.buildMockSummary(this.patientId);
  }

  setTab(tab: SummaryTab): void {
    this.activeTab = tab;
  }

  closePanel(): void {
    // Go back to patient list; adjust route as needed
    this.router.navigate(['/patients']);
  }

  startAIProcessing() {
    this.hideModal('upload-modal');

    const processingOverlay = document.getElementById('processing-overlay');
    if (!processingOverlay) return;

    processingOverlay.classList.remove('hidden');
    processingOverlay.classList.add('flex');

    setTimeout(() => {
      processingOverlay.classList.add('hidden');
      processingOverlay.classList.remove('flex');
      this.router.navigate(['/oasis']);
    }, 3500);
  }

  onOpenDoc(doc: MedicalDocument): void {
    if (!doc.uploaded) return;
    // Navigate to oasis-john with the document ID in state
    this.router.navigate(['/oasis'], {
      state: { openDocumentId: doc.id }
    });
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('visitNoteFileInput') visitNoteFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  isAudioPlaying = signal(false);
  audioCurrentTime = signal(0);
  audioDuration = signal(0);

  toggleAudioPlayback(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      this.isAudioPlaying.set(true);
    } else {
      audio.pause();
      this.isAudioPlaying.set(false);
    }
  }

  skipAudio(seconds: number): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  }

  onAudioEnded(): void {
    this.isAudioPlaying.set(false);
  }

  onAudioTimeUpdate(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    this.audioCurrentTime.set(audio.currentTime);
  }

  onAudioLoadedMetadata(): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio) return;
    this.audioDuration.set(audio.duration);
  }

  seekAudio(event: MouseEvent): void {
    const audio = this.audioPlayer?.nativeElement;
    if (!audio || !audio.duration) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgressPercent(): number {
    const duration = this.audioDuration();
    if (!duration) return 0;
    return (this.audioCurrentTime() / duration) * 100;
  }

  triggerFileUpload(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  triggerVisitNoteUpload(): void {
    if (this.visitNoteFileInput) {
      this.visitNoteFileInput.nativeElement.click();
    }
  }

  quickEligibilityCheck(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Find the button
    const button = target.closest('button') as HTMLButtonElement | null;
    if (!button) return;

    const originalHTML = button.innerHTML;

    // Set loading state
    button.innerHTML =
      '<ion-icon name="hourglass-outline" class="text-sm animate-spin"></ion-icon><span>Checking...</span>';
    button.disabled = true;

    // Simulate API call
    setTimeout(() => {
      // Restore button
      button.innerHTML = originalHTML;
      button.disabled = false;

      // Show the modal
      this.showModal('eligibility-modal');

      // Update timestamp
      this.updateEligibilityTimestamp();
    }, 1500);
  }

  showModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('flex');
    modal.classList.remove('hidden');
  }

  hideModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  recheckEligibility(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Find the button that triggered the action
    const recheckBtn = target.closest('button') as HTMLButtonElement | null;
    if (!recheckBtn) return;

    const originalHTML = recheckBtn.innerHTML;

    // Set loading state
    recheckBtn.innerHTML =
      '<ion-icon name="hourglass-outline" class="animate-spin"></ion-icon><span>Checking...</span>';
    recheckBtn.disabled = true;

    // Simulated API call
    setTimeout(() => {
      // Restore button
      recheckBtn.innerHTML = originalHTML;
      recheckBtn.disabled = false;

      // Update timestamp
      this.updateEligibilityTimestamp();

      // Highlight feedback
      const timestamp = document.getElementById('eligibility-timestamp-summary') as HTMLElement | null;

      if (timestamp) {
        timestamp.classList.add('text-emerald-600', 'font-semibold');
        setTimeout(() => {
          timestamp.classList.remove('text-emerald-600', 'font-semibold');
        }, 1500);
      }
    }, 1500);
  }

  updateEligibilityTimestamp(): void {
    // Update the signal with current date
    this.lastEligibilityCheck.set(new Date());
  }

  getFormattedEligibilityDate(): string {
    const date = this.lastEligibilityCheck();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if it's today
    if (checkDate.getTime() === today.getTime()) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `Today at ${displayHours}:${minutes} ${ampm}`;
    }

    // Otherwise show the full date
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${month}/${day}/${year} at ${displayHours}:${minutes} ${ampm}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Mark the discharge summary as uploaded in the shared service
    this.documentStateService.markDocumentAsUploaded('doc1', file.name);

    // Reset input so selecting same file again still triggers change
    input.value = '';

    this.startAIProcessing();
  }

  onVisitNoteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Mark the visit note as uploaded in the shared service
    this.documentStateService.markDocumentAsUploaded('doc5', file.name);

    // Reset input so selecting same file again still triggers change
    input.value = '';

    this.startAIProcessing();
  }

  private buildMockSummary(id: string): PatientSummary {
    // You can switch over id later if you want per-patient mock data
    return {
      id,
      mrn: 'MRN-87654',
      demographics: {
        name: 'John Smith',
        dob: '1958-09-03',
        sex: 'M',
        age: 66,
        phone: '(786) 555-1142',
        address: '7421 NW 12th St, Miami, FL 33126',
        insurance: 'Medicare Advantage',
        memberId: 'MCR-876543210',
        pcp: 'Dr. Michael Thompson, DO',
        agencyName: 'Sunrise Home Health Agency',
      },
      history: this.buildJohnSmithHistory().sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ),
      docs: [
        // Check if discharge summary was uploaded
        (() => {
          const docStatus = this.documentStateService.getDocumentStatus('doc1');
          if (docStatus) {
            return {
              id: 'doc1',
              type: 'DS' as const,
              displayLabel: 'Discharge Summary',
              uploaded: true,
              uploadedAt: docStatus.uploadedAt,
              fileName: docStatus.fileName,
            };
          }
          return {
            id: 'doc1',
            type: 'DS' as const,
            displayLabel: 'Discharge Summary',
            uploaded: false,
            missingReason: 'Pending upload',
            fileName: 'discharge_summary.pdf',
          };
        })(),
        {
          id: 'doc2',
          type: 'RO',
          displayLabel: 'Referral / Orders',
          uploaded: true,
          uploadedAt: '2024-10-02 10:20 AM',
          fileName: 'referral.pdf',
        },
        // Check if visit note was uploaded
        (() => {
          const docStatus = this.documentStateService.getDocumentStatus('doc5');
          if (docStatus) {
            return {
              id: 'doc5',
              type: 'VN' as const,
              displayLabel: 'Visit Note',
              uploaded: true,
              uploadedAt: docStatus.uploadedAt,
              fileName: docStatus.fileName,
            };
          }
          return {
            id: 'doc5',
            type: 'VN' as const,
            displayLabel: 'Visit Note',
            uploaded: false,
            missingReason: 'Pending upload',
            fileName: 'visit_note.pdf',
          };
        })(),
        // History & Physical - Commented out
        // {
        //   id: 'doc6',
        //   type: 'H&P',
        //   displayLabel: 'History & Physical',
        //   uploaded: true,
        //   uploadedAt: '2024-10-02 9:50 AM',
        //   fileName: 'hp.pdf',
        // },
        {
          id: 'doc7',
          type: 'Labs',
          displayLabel: 'Lab Reports',
          uploaded: false,
          missingReason: 'External provider delays',
        },
        {
          id: 'doc8',
          type: 'Audio',
          displayLabel: 'Visit Recording',
          uploaded: true,
          uploadedAt: '2024-10-03 2:30 PM',
          fileName: 'johnSmith_Nurse_Visit.mp3',
          audioUrl: '/johnSmith_Nurse_Visit.mp3',
        },
      ],
      payment: {
        hippsCode: '2CB21',
        baseRate: 2753.5,
        comorbidityAdjustment: this.paymentStateService.payment().comorbidityAdjustment,
        // functionalLevelAdjustment: 122.0,  // Commented out
        lutsAdjustment: 0,
        totalPayment: this.paymentStateService.payment().totalPayment,
      },
    };
  }
}
