import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProdutoService, Produto } from '../../services/produto';
import { NotaService, ItemNota } from '../../services/nota';

@Component({
  selector: 'app-nova-nota',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <h2>Nova Nota Fiscal</h2>

    <mat-card style="margin-bottom: 24px">
      <mat-card-header>
        <mat-card-title>Adicionar Produto</mat-card-title>
      </mat-card-header>
      <mat-card-content style="padding-top: 16px">
        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center">
          <mat-form-field style="min-width: 250px">
            <mat-label>Produto</mat-label>
            <mat-select [(ngModel)]="produtoSelecionado">
              <mat-option *ngFor="let p of produtos" [value]="p">
                {{ p.codigo }} - {{ p.descricao }} (Saldo: {{ p.saldo }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field style="width: 120px">
            <mat-label>Quantidade</mat-label>
            <input matInput type="number" [(ngModel)]="quantidade" min="1">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="adicionarItem()">
            <mat-icon>add</mat-icon> Adicionar
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="itens.length > 0" style="margin-bottom: 24px">
      <mat-card-header>
        <mat-card-title>Itens da Nota</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="itens" style="width: 100%">
          <ng-container matColumnDef="produto">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let item">{{ item.descricao }}</td>
          </ng-container>
          <ng-container matColumnDef="quantidade">
            <th mat-header-cell *matHeaderCellDef>Quantidade</th>
            <td mat-cell *matCellDef="let item">{{ item.quantidade }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let item; let i = index">
              <button mat-icon-button color="warn" (click)="removerItem(i)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="salvar()">
          <mat-icon>save</mat-icon> Salvar Nota
        </button>
        <button mat-button routerLink="/notas">Cancelar</button>
      </mat-card-actions>
    </mat-card>
  `
})
export class NovaNotaComponent implements OnInit {
  produtos: Produto[] = [];
  produtoSelecionado?: Produto;
  quantidade = 1;
  itens: any[] = [];
  colunas = ['produto', 'quantidade', 'acoes'];

  constructor(
    private produtoService: ProdutoService,
    private notaService: NotaService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.produtoService.listar().subscribe(p => this.produtos = p);
  }

  adicionarItem() {
    if (!this.produtoSelecionado || this.quantidade < 1) {
      this.snackBar.open('Selecione um produto e quantidade válida!', 'Fechar', { duration: 3000 });
      return;
    }
    if (this.quantidade > this.produtoSelecionado.saldo) {
      this.snackBar.open('Quantidade maior que o saldo disponível!', 'Fechar', { duration: 3000 });
      return;
    }
    this.itens.push({
      produto_id: this.produtoSelecionado.id,
      descricao: this.produtoSelecionado.descricao,
      quantidade: this.quantidade
    });
    this.produtoSelecionado = undefined;
    this.quantidade = 1;
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
  }

  salvar() {
    if (this.itens.length === 0) {
      this.snackBar.open('Adicione pelo menos um produto!', 'Fechar', { duration: 3000 });
      return;
    }
    const payload = {
      itens: this.itens.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade }))
    };
    this.notaService.criar(payload).subscribe(() => {
      this.snackBar.open('Nota criada com sucesso!', 'Fechar', { duration: 3000 });
      this.router.navigate(['/notas']);
    });
  }
}