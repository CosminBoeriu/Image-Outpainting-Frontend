// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  inpaint(image: Blob, rectBox: any): Observable<Blob> {
    const fd = new FormData();
    fd.append('image', image, 'image.png');
    fd.append('rectBox', JSON.stringify(rectBox));
    return this.http.post(`${this.apiUrl}/inpaint`, fd, {
      responseType: 'blob'
    });
  }

  outpaint(image: Blob): Observable<Blob> {
    const fd = new FormData();
    fd.append('image', image, 'image.png');
    return this.http.post(`${this.apiUrl}/outpaint`, fd, {
      responseType: 'blob'
    });
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
}
