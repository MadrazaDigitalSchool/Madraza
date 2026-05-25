import { Component, OnInit, inject, isDevMode } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner';

/**
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatWidgetComponent, CookieBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private router    = inject(Router);
  private swUpdate  = inject(SwUpdate);

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    if (!isDevMode() && this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
      ).subscribe(() => document.location.reload());
    }
  }
}