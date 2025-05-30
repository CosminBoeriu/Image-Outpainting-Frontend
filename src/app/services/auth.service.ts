import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private token: string | null = null;

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();


  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('authToken');
  }

  storeToken(token: string) {
    localStorage.setItem('authToken', token);
    this.token = token;
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return this.token;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res.token) {
          this.storeToken(res.token);
        }
      })
    );
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => {
        if (res.token) {
          this.storeToken(res.token);
        }
      })
    );
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    this.isLoggedInSubject.next(false);
  }

}
