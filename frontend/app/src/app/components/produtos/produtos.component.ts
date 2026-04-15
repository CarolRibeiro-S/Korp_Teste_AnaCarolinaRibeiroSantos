import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProdutoService, Produto } from '../../services/produto';

@Component({
  selector: 'app-produtos',
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
    MatSnackBarModule
  ],
  template: `
    <mat-card style="margin-bottom: 24px">
      <mat-card-header>
        <mat-card-title>{{ editando ? 'Editar Produto' : 'Novo Produto' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content style="padding-top: 16px">
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <mat-form-field>
            <mat-label>Código</mat-label>
            <input matInput [(ngModel)]="form.codigo" placeholder="Ex: P001">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Descrição</mat-label>
            <input matInput [(ngModel)]="form.descricao" placeholder="Nome do produto">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Saldo</mat-label>
            <input matInput type="number" [(ngModel)]="form.saldo" placeholder="0">
          </mat-form-field>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="salvar()">
          {{ editando ? 'Atualizar' : 'Cadastrar' }}
        </button>
        <button mat-button (click)="limpar()" *ngIf="editando">Cancelar</button>
      </mat-card-actions>
    </mat-card>

    <mat-card>
      <mat-card-header>
        <mat-card-title>Produtos Cadastrados</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="produtos" style="width: 100%">
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let p">{{ p.codigo }}</td>
          </ng-container>
          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let p">{{ p.descricao }}</td>
          </ng-container>
          <ng-container matColumnDef="saldo">
            <th mat-header-cell *matHeaderCellDef>Saldo</th>
            <td mat-cell *matCellDef="let p">{{ p.saldo }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" (click)="editar(p)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deletar(p.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  colunas = ['codigo', 'descricao', 'saldo', 'acoes'];
  editando = false;
  idEditando?: number;
  form: Produto = { id: 0, codigo: '', descricao: '', saldo: 0 };

  constructor(private produtoService: ProdutoService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.produtoService.listar().subscribe({
      next: (produtos: Produto[]) => this.produtos = produtos,
      error: (err: any) => {
        console.error('Erro ao carregar produtos:', err);
        this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 });
      }
    });
  }

  salvar() {
    if (!this.form.codigo || !this.form.descricao) {
      this.snackBar.open('Preencha todos os campos!', 'Fechar', { duration: 3000 });
      return;
    }
    if (this.editando && this.idEditando) {
      this.produtoService.atualizar(this.idEditando, this.form).subscribe({
        next: () => {
          this.snackBar.open('Produto atualizado!', 'Fechar', { duration: 3000 });
          this.limpar();
          this.carregar();
        },
        error: (err: any) => {
          console.error('Erro ao atualizar produto:', err);
          this.snackBar.open('Erro ao atualizar produto', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      this.produtoService.criar(this.form).subscribe({
        next: () => {
          this.snackBar.open('Produto cadastrado!', 'Fechar', { duration: 3000 });
          this.limpar();
          this.carregar();
        },
        error: (err: any) => {
          console.error('Erro ao criar produto:', err);
          this.snackBar.open('Erro ao criar produto', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  editar(p: Produto) {
    this.editando = true;
    this.idEditando = p.id;
    this.form = { ...p };
  }

  deletar(id: number) {
    this.produtoService.deletar(id).subscribe({
      next: () => {
        this.snackBar.open('Produto deletado!', 'Fechar', { duration: 3000 });
        this.carregar();
      },
      error: (err: any) => {
        console.error('Erro ao deletar produto:', err);
        this.snackBar.open('Erro ao deletar produto', 'Fechar', { duration: 3000 });
      }
    });
  }

  limpar() {
    this.editando = false;
    this.idEditando = undefined;
    this.form = { id: 0, codigo: '', descricao: '', saldo: 0 };
  }
}