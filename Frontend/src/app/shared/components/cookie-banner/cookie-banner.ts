import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const STORAGE_KEY = 'madraza_cookie_consent';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss'
})
export class CookieBannerComponent implements OnInit {

  visible = signal(false);

  ngOnInit(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      this.visible.set(true);
    }
  }

  aceptarTodas(): void {
    localStorage.setItem(STORAGE_KEY, 'all');
    this.visible.set(false);
  }

  soloNecesarias(): void {
    localStorage.setItem(STORAGE_KEY, 'necessary');
    this.visible.set(false);
  }

  rechazar(): void {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    this.visible.set(false);
  }
}
