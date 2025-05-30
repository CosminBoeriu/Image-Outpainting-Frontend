import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ImageMode = 'inpaint' | 'outpaint' | 'blend' | null;

@Injectable({ providedIn: 'root' })

export class ModeStateService {
  // only ever one of your modes (or null)
  private modeSubject = new BehaviorSubject<ImageMode>(null);
  public mode$ = this.modeSubject.asObservable();

  setMode(mode: ImageMode) {
    this.modeSubject.next(mode);
  }
}
