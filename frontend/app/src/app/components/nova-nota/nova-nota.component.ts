import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { NotaService, ItemNota } from '../../services/nota';
import { ProdutoService, Produto } from '../../services/produto';

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
    MatSnackBarModule,
    MatSelectModule
  ],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2 style="margin: 0">Nova Nota Fiscal</h2>
      <button mat-button (click)="voltar()">
        <mat-icon>arrow_back</mat-icon> Voltar
      </button>
    </div>

    <mat-card style="margin-bottom: 24px">
      <mat-card-header>
        <mat-card-title>Adicionar Item</mat-card-title>
      </mat-card-header>
      <mat-card-content style="padding-top: 16px">
        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: end">
          <mat-form-field style="flex: 1; min-width: 200px">
            <mat-label>Produto</mat-label>
            <mat-select [(ngModel)]="itemSelecionado.produto_id">
              <mat-option *ngFor="let produto of produtos" [value]="produto.id">
                {{ produto.descricao }} ({{ produto.codigo }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field style="width: 120px">
            <mat-label>Quantidade</mat-label>
            <input matInput type="number" [(ngModel)]="itemSelecionado.quantidade" min="1">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="adicionarItem()" [disabled]="!itemSelecionado.produto_id || !itemSelecionado.quantidade">
            <mat-icon>add</mat-icon> Adicionar
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card style="margin-bottom: 24px">
      <mat-card-header>
        <mat-card-title>Itens da Nota</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="itens" style="width: 100%">
          <ng-container matColumnDef="produto">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let item">{{ getProdutoNome(item.produto_id) }}</td>
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
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <div *ngIf="itens.length === 0" style="text-align: center; padding: 24px; color: gray">
          Nenhum item adicionado
        </div>
      </mat-card-content>
    </mat-card>

    <div style="text-align: right">
      <button mat-raised-button color="primary" (click)="salvarNota()" [disabled]="itens.length === 0">
        <mat-icon>save</mat-icon> Salvar Nota Fiscal
      </button>
    </div>
  `
})
export class NovaNotaComponent implements OnInit {
  produtos: Produto[] = [];
  itens: ItemNota[] = [];
  displayedColumns: string[] = ['produto', 'quantidade', 'acoes'];
  itemSelecionado: { produto_id: number; quantidade: number } = { produto_id: 0, quantidade: 1 };

  constructor(
    private notaService: NotaService,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos() {
    this.produtoService.listar().subscribe({
      next: (produtos) => this.produtos = produtos,
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 });
      }
    });
  }

  adicionarItem() {
    if (this.itemSelecionado.produto_id && this.itemSelecionado.quantidade > 0) {
      this.itens.push({
        id: 0, // será definido pelo backend
        nota_id: 0, // será definido pelo backend
        produto_id: this.itemSelecionado.produto_id,
        quantidade: this.itemSelecionado.quantidade
      });
      this.itemSelecionado = { produto_id: 0, quantidade: 1 };
    }
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
  }

  getProdutoNome(produtoId: number): string {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? `${produto.descricao} (${produto.codigo})` : 'Produto não encontrado';
  }

  salvarNota() {
    this.notaService.criar(this.itens).subscribe({
      next: (nota) => {
        this.snackBar.open(`Nota fiscal #${nota.numero} criada com sucesso!`, 'Fechar', { duration: 3000 });
        this.router.navigate(['/notas']);
      },
      error: (err) => {
        console.error('Erro ao criar nota:', err);
        this.snackBar.open('Erro ao criar nota fiscal', 'Fechar', { duration: 3000 });
      }
    });
  }

  voltar() {
    this.router.navigate(['/notas']);
  }
}
