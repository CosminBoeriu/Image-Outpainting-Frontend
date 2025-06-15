// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {environment} from '../../environments/environment';

export interface StatusResponse {
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'CANCELED';
  progress: number;     // 0..100
  message: string | null;
}

export interface StartResponse {
  message: string;
  task_id: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  inpaint(image: Blob, rectBox: any): Observable<StartResponse> {
    const fd = new FormData();
    fd.append('image', image, 'image.png');
    fd.append('rectBox', JSON.stringify(rectBox));
    return this.http.post<StartResponse>(`${this.apiUrl}/inpaint`, fd)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('startInpaint error', err);
          return throwError(() => new Error(err.message));
        })
      );
  }

  outpaint(image: Blob): Observable<StartResponse> {
    const fd = new FormData();
    fd.append('image', image, 'image.png');
    return this.http.post<StartResponse>(`${this.apiUrl}/outpaint`, fd)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('startOutpaint error', err);
          return throwError(() => new Error(err.message));
        })
      );
  }

  blend(imageA: Blob, imageB: Blob, params: any): Observable<Blob> {
    const fd = new FormData();
    fd.append('imageA', imageA, 'imageA.png');
    fd.append('imageB', imageB, 'imageB.png');
    fd.append('blendParams', JSON.stringify(params));
    return this.http.post(`${this.apiUrl}/blend`, fd, {
      responseType: 'blob'
    });
  }

  get_task_status(task_id: number): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.apiUrl}/task-status/${task_id}`);
  }

  get_task_result(task_id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/task-result/${task_id}`, {
      responseType: 'blob'
    });
  }

  cancelTask(taskId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/task-cancel/${taskId}`,
      {}  // an empty body is fine
    );
  }

}
