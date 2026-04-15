import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotaFiscal {
  id: number;
  numero: number;
  status: string;
  criado_em: string;
}

export interface ItemNota {
  id: number;
  nota_id: number;
  produto_id: number;
  quantidade: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private apiUrl = 'http://localhost:8082/notas';

  constructor(private http: HttpClient) {}

  listar(): Observable<NotaFiscal[]> {
    return this.http.get<NotaFiscal[]>(this.apiUrl);
  }

  criar(itens: ItemNota[]): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(this.apiUrl, { itens });
  }

  buscar(id: number): Observable<NotaFiscal> {
    return this.http.get<NotaFiscal>(`${this.apiUrl}/${id}`);
  }

  imprimir(id: number): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${id}/imprimir`, {}, { responseType: 'blob' });
  }
}
