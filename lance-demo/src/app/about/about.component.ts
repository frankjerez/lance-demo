import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>About</h2>
    <p>This is the about page.</p>
  `,
})
export class AboutComponent {}
