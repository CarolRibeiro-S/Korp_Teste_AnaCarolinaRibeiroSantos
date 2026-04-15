import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotaService, NotaFiscal } from '../../services/nota';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2 style="margin: 0">Notas Fiscais</h2>
      <button mat-raised-button color="primary" routerLink="/notas/nova">
        <mat-icon>add</mat-icon> Nova Nota
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="notas" style="width: 100%">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>Número</th>
            <td mat-cell *matCellDef="let n">{{ n.numero }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let n">
              <span [style.color]="n.status === 'Aberta' ? 'green' : 'gray'">
                {{ n.status }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="criado_em">
            <th mat-header-cell *matHeaderCellDef>Criado em</th>
            <td mat-cell *matCellDef="let n">{{ n.criado_em | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let n">
              <button mat-raised-button color="accent"
                [disabled]="n.status !== 'Aberta'"
                (click)="imprimir(n)">
                <mat-icon>print</mat-icon>
                Imprimir
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <div *ngIf="notas.length === 0" style="text-align: center; padding: 24px; color: gray">
          Nenhuma nota fiscal encontrada
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class NotasComponent implements OnInit {
  notas: NotaFiscal[] = [];
  displayedColumns: string[] = ['numero', 'status', 'criado_em', 'acoes'];

  constructor(
    private notaService: NotaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarNotas();
  }

  carregarNotas() {
    this.notaService.listar().subscribe({
      next: (notas) => {
        this.notas = notas;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar notas!', 'Fechar', { duration: 3000 })
    });
  }

  imprimir(nota: NotaFiscal) {
    if (nota.status !== 'Aberta') {
      this.snackBar.open('Apenas notas abertas podem ser impressas!', 'Fechar', { duration: 3000 });
      return;
    }
    this.notaService.imprimir(nota.id!).subscribe({
      next: () => {
        this.snackBar.open('Nota impressa e fechada com sucesso!', 'Fechar', { duration: 3000 });
        this.carregarNotas();
      },
      error: (err) => {
        this.snackBar.open(err.error?.erro || 'Erro ao imprimir!', 'Fechar', { duration: 3000 });
      }
    });
  }
}