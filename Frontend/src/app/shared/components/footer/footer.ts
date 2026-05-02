import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Footer principal de la aplicación Madraza
 * @author Hafdala Mehdi Sidi
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent { }