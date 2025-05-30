import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageStateService {
  private imageSrcSubject = new BehaviorSubject<string | ArrayBuffer | null>(null);
  public imageSrc$ = this.imageSrcSubject.asObservable();

  setImage(src: string | ArrayBuffer | null) {
    this.imageSrcSubject.next(src);
  }
}
