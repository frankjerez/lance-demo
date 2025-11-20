export interface PatientDocs {
  ds: 'present' | 'missing';
  ro: 'present' | 'missing';
  vn: 'present' | 'missing';
}

export interface PatientEligibility {
  label: string;
  badgeClass: string;
  canRecheck: boolean;
}

export interface PatientStatus {
  label: string;
  badgeClass: string;
}

export interface PatientListItem {
  id: string; // could be patientId / assessmentId
  name: string;
  mrn: string;
  assessmentType: string;
  docs: PatientDocs;
  status: PatientStatus;
  deadlineLabel: string;
  eligibility: PatientEligibility;
  primaryActionLabel: string;
  primaryActionType: 'review' | 'continue' | 'view' | 'upload';
}

export const myPatients: PatientListItem[] = [
  {
    id: 'p1',
    name: 'Maria Garcia',
    mrn: 'MRN-98765',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'AI Draft Ready',
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    deadlineLabel: 'Today, 5:00 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: true,
    },
    primaryActionLabel: 'Review Draft →',
    primaryActionType: 'review',
  },
  {
    id: 'p2',
    name: 'John Smith',
    mrn: 'MRN-87654',
    assessmentType: 'Recertification (ROC)',
    docs: { ds: 'present', ro: 'present', vn: 'missing' },
    status: {
      label: 'In Review',
      badgeClass: 'bg-blue-100 text-blue-800',
    },
    deadlineLabel: 'Tomorrow, 3:00 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'Continue Review →',
    primaryActionType: 'continue',
  },
  {
    id: 'p3',
    name: 'Robert Johnson',
    mrn: 'MRN-76543',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'Completed',
      badgeClass: 'bg-green-100 text-green-800',
    },
    deadlineLabel: 'Nov 15, 2:30 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'View Assessment',
    primaryActionType: 'view',
  },
  {
    id: 'p4',
    name: 'Patricia Williams',
    mrn: 'MRN-65432',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'AI Draft Ready',
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    deadlineLabel: 'Today, 7:00 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: true,
    },
    primaryActionLabel: 'Review Draft →',
    primaryActionType: 'review',
  },
  {
    id: 'p5',
    name: 'Michael Brown',
    mrn: 'MRN-54321',
    assessmentType: 'Discharge (DC)',
    docs: { ds: 'missing', ro: 'missing', vn: 'missing' },
    status: {
      label: 'Pending Upload',
      badgeClass: 'bg-purple-100 text-purple-800',
    },
    deadlineLabel: 'Nov 20, 10:00 AM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'Upload Documents →',
    primaryActionType: 'upload',
  },
  {
    id: 'p6',
    name: 'Linda Davis',
    mrn: 'MRN-43210',
    assessmentType: 'Recertification (ROC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'AI Draft Ready',
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    deadlineLabel: 'Tomorrow, 11:00 AM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'Review Draft →',
    primaryActionType: 'review',
  },
  {
    id: 'p7',
    name: 'James Wilson',
    mrn: 'MRN-32109',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'missing', vn: 'present' },
    status: {
      label: 'In Review',
      badgeClass: 'bg-blue-100 text-blue-800',
    },
    deadlineLabel: 'Today, 4:00 PM',
    eligibility: {
      label: '⚠ Pending',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      canRecheck: true,
    },
    primaryActionLabel: 'Continue Review →',
    primaryActionType: 'continue',
  },
  {
    id: 'p8',
    name: 'Barbara Martinez',
    mrn: 'MRN-21098',
    assessmentType: 'Transfer (TRN)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'Completed',
      badgeClass: 'bg-green-100 text-green-800',
    },
    deadlineLabel: 'Nov 14, 9:00 AM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'View Assessment',
    primaryActionType: 'view',
  },
  {
    id: 'p9',
    name: 'David Anderson',
    mrn: 'MRN-10987',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'AI Draft Ready',
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    deadlineLabel: 'Tomorrow, 9:00 AM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'Review Draft →',
    primaryActionType: 'review',
  },
  {
    id: 'p10',
    name: 'Susan Taylor',
    mrn: 'MRN-09876',
    assessmentType: 'Recertification (ROC)',
    docs: { ds: 'present', ro: 'present', vn: 'missing' },
    status: {
      label: 'In Review',
      badgeClass: 'bg-blue-100 text-blue-800',
    },
    deadlineLabel: 'Nov 21, 1:00 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'Continue Review →',
    primaryActionType: 'continue',
  },
  {
    id: 'p11',
    name: 'Charles Thomas',
    mrn: 'MRN-98701',
    assessmentType: 'Start of Care (SOC)',
    docs: { ds: 'present', ro: 'missing', vn: 'missing' },
    status: {
      label: 'Pending Upload',
      badgeClass: 'bg-purple-100 text-purple-800',
    },
    deadlineLabel: 'Nov 22, 2:00 PM',
    eligibility: {
      label: '⚠ Pending',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      canRecheck: true,
    },
    primaryActionLabel: 'Upload Documents →',
    primaryActionType: 'upload',
  },
  {
    id: 'p12',
    name: 'Jennifer Moore',
    mrn: 'MRN-87012',
    assessmentType: 'Discharge (DC)',
    docs: { ds: 'present', ro: 'present', vn: 'present' },
    status: {
      label: 'Completed',
      badgeClass: 'bg-green-100 text-green-800',
    },
    deadlineLabel: 'Nov 13, 4:30 PM',
    eligibility: {
      label: '✓ Eligible',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      canRecheck: false,
    },
    primaryActionLabel: 'View Assessment',
    primaryActionType: 'view',
  },
  // …add the rest or later load from API
];
