import { Routes } from '@angular/router';
// DECOMMISSIONED: LanceOasisCopilotComponent - preserved for reference, uncomment to restore
// import { LanceOasisCopilotComponent } from './oasis/lance-oasis-copilot';
import { AboutComponent } from './about/about.component';
import { PatientListComponent } from './patient-list/patient-list';
import { LoginComponent } from './login/login';
import { PatientSummaryComponent } from './patient-summary/patient-summary';
import { OasisJohnComponent } from './oasis-john/oasis-john';

export const routes: Routes = [
  // DECOMMISSIONED: Old OASIS component - using OasisJohnComponent instead
  // { path: 'oasis', component: LanceOasisCopilotComponent },
  { path: 'oasis', component: OasisJohnComponent },
  { path: '', component: LoginComponent },
  { path: 'patients', component: PatientListComponent },
  { path: 'patients/:id/summary', component: PatientSummaryComponent },
  { path: 'about', component: AboutComponent },
  {
    path: '**',
    redirectTo: '',
  },
];
