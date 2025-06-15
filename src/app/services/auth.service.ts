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
  private username: string | null = null;

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private usernameSubject = new BehaviorSubject<string>(this.getUsername() || '');
  public username$ = this.usernameSubject.asObservable();

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('authToken');
    this.username = localStorage.getItem('username');
  }

  storeToken(token: string, username: string) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    this.token = token;
    this.username = username;
    this.isLoggedInSubject.next(true);
    this.usernameSubject.next(username);
  }

  getToken(): string | null {
    return this.token;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res.token) {
          this.storeToken(res.token, res.username);
        }
      })
    );
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => {
        if (res.token) {
          this.storeToken(res.token, res.username);
        }
      })
    );
  }

  logout() {
    this.token = null;
    this.username = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    this.isLoggedInSubject.next(false);
    this.usernameSubject.next('');
  }

}
