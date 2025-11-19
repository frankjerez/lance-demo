import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from "./app.routes";
import { provideHttpClient } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';





export const appConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: "top",
    })),
  ],
};
