import { Routes } from '@angular/router';
import { LanceOasisCopilotComponent } from './oasis/lance-oasis-copilot';
import { AboutComponent } from './about/about.component';
import { LanceLoginAndListComponent } from './login-and-list/login-and-list';

export const routes: Routes = [
  { path: 'oasis', component: LanceOasisCopilotComponent },
  { path: '', component: LanceLoginAndListComponent },
  { path: 'about', component: AboutComponent },
  {
    path: '**',
    redirectTo: '',
  },
];
