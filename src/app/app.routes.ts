import { Routes } from '@angular/router';
import { LanceOasisCopilotComponent } from './oasis/lance-oasis-copilot';
import { AboutComponent } from './about/about.component';
import { PatientListComponent } from './patient-list/patient-list';
import { LoginComponent } from './login/login';

export const routes: Routes = [
  { path: 'oasis', component: LanceOasisCopilotComponent },
  { path: '', component: LoginComponent },
  { path: 'patients', component: PatientListComponent },
  { path: 'about', component: AboutComponent },
  {
    path: '**',
    redirectTo: '',
  },
];
