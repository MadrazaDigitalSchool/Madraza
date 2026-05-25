import { Component, signal, inject, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marked } from 'marked';
import { ChatService, ChatMensaje } from '../../../core/services/chat.service';

interface MensajeUI {
  role: 'user' | 'assistant';
  content: string;
  html?: SafeHtml;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss'
})
const RUTAS_FOCO = ['/apuntes', '/examen'];

export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private sanitizer   = inject(DomSanitizer);
  private router      = inject(Router);

  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  abierto        = signal(false);
  cargando       = signal(false);
  mensajes       = signal<MensajeUI[]>([]);
  burbujaVisible = signal(false);
  ocultoEnRuta   = signal(false);
  inputTexto     = '';
  private scrollPendiente = false;

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((e: NavigationEnd) => {
      const esFoco = RUTAS_FOCO.some(r => e.urlAfterRedirects.startsWith(r));
      this.ocultoEnRuta.set(esFoco);
      if (esFoco) {
        this.abierto.set(false);
        this.burbujaVisible.set(false);
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (!this.ocultoEnRuta()) {
        this.burbujaVisible.set(true);
        setTimeout(() => this.burbujaVisible.set(false), 5000);
      }
    }, 1500);
  }

  toggle(): void {
    this.burbujaVisible.set(false);
    this.abierto.update(v => !v);
    if (this.abierto() && this.mensajes().length === 0) {
      this.mensajes.set([{
        role: 'assistant',
        content: '¡Hola! 👋 Soy Madra, el asistente de Madraza. ¿En qué puedo ayudarte?',
        html:    this.toHtml('¡Hola! 👋 Soy Madra, el asistente de Madraza. ¿En qué puedo ayudarte?')
      }]);
      this.scrollPendiente = true;
    }
  }

  enviar(): void {
    const texto = this.inputTexto.trim();
    if (!texto || this.cargando()) return;

    this.mensajes.update(msgs => [...msgs, { role: 'user', content: texto }]);
    this.inputTexto = '';
    this.cargando.set(true);
    this.scrollPendiente = true;

    const historial: ChatMensaje[] = this.mensajes().map(m => ({ role: m.role, content: m.content }));

    this.chatService.enviar(historial).subscribe({
      next: (res) => {
        this.mensajes.update(msgs => [...msgs, {
          role:    'assistant',
          content: res.respuesta,
          html:    this.toHtml(res.respuesta)
        }]);
        this.cargando.set(false);
        this.scrollPendiente = true;
      },
      error: () => {
        this.mensajes.update(msgs => [...msgs, {
          role:    'assistant',
          content: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
          html:    this.toHtml('Ha ocurrido un error. Por favor, inténtalo de nuevo.')
        }]);
        this.cargando.set(false);
        this.scrollPendiente = true;
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  ngAfterViewChecked(): void {
    if (this.scrollPendiente && this.mensajesContainer) {
      const el = this.mensajesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollPendiente = false;
    }
  }

  private toHtml(content: string): SafeHtml {
    const html = marked.parse(content) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
