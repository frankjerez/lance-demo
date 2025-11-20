export interface PatientDemographics {
  name: string;
  dob: string;
  sex: 'M' | 'F';
  age: number;
  phone: string;
  address: string;
  insurance: string;
  memberId: string;
  pcp: string;
  agencyName: string;
}

export interface EpisodeHistoryItem {
  episodeId: string;
  type: string; // SOC, ROC, DC, TRN
  startDate: string;
  endDate?: string;
  status: string;
  clinician: string;
}

export interface MedicalDocument {
  id: string;
  type: 'DS' | 'RO' | 'VN' | 'H&P' | 'Labs' | 'Other';
  displayLabel: string;
  uploaded: boolean;
  uploadedAt?: string;
  fileName?: string;
  missingReason?: string;
}

export interface PDGMPaymentBreakdown {
  hippsCode: string;
  baseRate: number;
  comorbidityAdjustment: number;
  functionalLevelAdjustment: number;
  lutsAdjustment: number;
  totalPayment: number;
}

export interface PatientSummary {
  id: string;
  mrn: string;
  demographics: PatientDemographics;
  history: EpisodeHistoryItem[];
  docs: MedicalDocument[];
  payment: PDGMPaymentBreakdown;
}

export const myPatientSummary: PatientSummary = {
  id: 'p1',
  mrn: 'MRN-98765',
  demographics: {
    name: 'Maria Garcia',
    dob: '1950-06-12',
    sex: 'F',
    age: 74,
    phone: '(305) 555-2890',
    address: '1234 Coral Way, Miami, FL 33145',
    insurance: 'Medicare Fee-For-Service',
    memberId: 'MCR-987654321',
    pcp: 'Dr. Anna Rodriguez, MD',
    agencyName: 'Sunrise Home Health Agency',
  },

  history: [
    {
      episodeId: 'EP-20231101',
      type: 'Start of Care (SOC)',
      startDate: '2023-11-01',
      endDate: '2023-12-15',
      status: 'Completed',
      clinician: 'Dr. Anna Thompson',
    },
    {
      episodeId: 'EP-20240215',
      type: 'Recertification (ROC)',
      startDate: '2024-02-15',
      endDate: '2024-03-30',
      status: 'Completed',
      clinician: 'RN Sarah Martinez',
    },
    {
      episodeId: 'EP-20241002',
      type: 'Start of Care (SOC)',
      startDate: '2024-10-02',
      status: 'In Review',
      clinician: 'RN John Alvarez',
    },
  ],

  docs: [
    {
      id: 'doc1',
      type: 'DS',
      displayLabel: 'Discharge Summary',
      uploaded: true,
      uploadedAt: '2024-10-02 10:15 AM',
      fileName: 'discharge_summary.pdf',
    },
    {
      id: 'doc2',
      type: 'RO',
      displayLabel: 'Referral / Orders',
      uploaded: true,
      uploadedAt: '2024-10-02 10:20 AM',
      fileName: 'referral.pdf',
    },
    {
      id: 'doc3',
      type: 'VN',
      displayLabel: 'Visit Note',
      uploaded: true,
      uploadedAt: '2024-10-02 1:40 PM',
      fileName: 'visit_note_1.pdf',
    },
    {
      id: 'doc4',
      type: 'VN',
      displayLabel: 'Visit Note',
      uploaded: true,
      uploadedAt: '2024-10-05 2:10 PM',
      fileName: 'visit_note_2.pdf',
    },
    {
      id: 'doc5',
      type: 'VN',
      displayLabel: 'Visit Note',
      uploaded: false,
      missingReason: 'Clinician did not complete documentation',
    },
    {
      id: 'doc6',
      type: 'H&P',
      displayLabel: 'History & Physical',
      uploaded: true,
      uploadedAt: '2024-10-02 9:50 AM',
      fileName: 'hp.pdf',
    },
    {
      id: 'doc7',
      type: 'Labs',
      displayLabel: 'Lab Reports',
      uploaded: false,
      missingReason: 'External provider delays',
    },
  ],

  payment: {
    hippsCode: '2CB21',
    baseRate: 2753.5,
    comorbidityAdjustment: 287.0,
    functionalLevelAdjustment: 125.0,
    lutsAdjustment: 89.25,
    totalPayment: 2753.5 + 287 + 125 + 89.25, // 3254.75
  },
};
