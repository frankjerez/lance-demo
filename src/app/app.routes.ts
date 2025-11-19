import { Routes } from '@angular/router';
import { LanceOasisCopilotComponent } from './hello/lance-oasis-copilot';

export const routes: Routes = [
  { path: '', component: LanceOasisCopilotComponent },
  {
    path: '**',
    redirectTo: '',
  },
];
