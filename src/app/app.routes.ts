import { Routes } from '@angular/router';
import { LanceOasisCopilotComponent } from './oasis/lance-oasis-copilot';
import { AboutComponent } from './about/about.component';
import { PatientListComponent } from './patient-list/patient-list';
import { LoginComponent } from './login/login';
import { PatientSummaryComponent } from './patient-summary/patient-summary';

export const routes: Routes = [
  { path: 'oasis', component: LanceOasisCopilotComponent },
  { path: '', component: LoginComponent },
  { path: 'patients', component: PatientListComponent },
  { path: 'patients/:id/summary', component: PatientSummaryComponent },
  { path: 'about', component: AboutComponent },
  {
    path: '**',
    redirectTo: '',
  },
];
