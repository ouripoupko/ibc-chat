import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Contract, Method } from './contract';
// import { Collection } from './statement';

@Injectable({
  providedIn: 'root'
})
export class ContractService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient) { }

  getIdentities(server: string): Observable<string[]> {
    return this.http.get<string[]>(`${server}ibc/app`).pipe(
        tap(_ => console.log('fetched identities')),
        catchError(this.handleError<string[]>('getIdentities', []))
      );
  }

  getContracts(server: string, identity: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${server}ibc/app/${identity}`).pipe(
        tap(_ => console.log('fetched contracts')),
        catchError(this.handleError<Contract[]>('getContracts', []))
      );
  }

  listen(server: string, identity: string, contract: string): EventSource {
    return new EventSource(`${server}stream/${identity}/${contract}`);
  }

  write(server: string, identity: string, contract: string, method: Method): Observable<any> {
    const url = `${server}ibc/app/${identity}/${contract}/${method.name}`;
    return this.http.put<any>(url, method, this.httpOptions).pipe(
//      tap((list: Collection) => console.log(list)),
      catchError(this.handleError<any>(`write name=${name}`))
    );
  }

  read(server: string, identity: string, contract: string, method: Method): Observable<any> {
    const url = `${server}ibc/app/${identity}/${contract}/${method.name}`;
    return this.http.post<any>(url, method, this.httpOptions).pipe(
//      tap((list: Collection) => console.log(list)),
      catchError(this.handleError<any>(`read name=${name}`))
    );
  }


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
