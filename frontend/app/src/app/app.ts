import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <span>Korp ERP - Notas Fiscais</span>
      <span style="flex: 1"></span>
      <button mat-button routerLink="/produtos" routerLinkActive="active">Produtos</button>
      <button mat-button routerLink="/notas" routerLinkActive="active">Notas Fiscais</button>
    </mat-toolbar>
    <div style="padding: 24px">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .active { background: rgba(255,255,255,0.2); border-radius: 4px; }
  `]
})
export class App {
  title = 'app';
}