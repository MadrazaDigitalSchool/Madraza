import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
export class AppComponent { }