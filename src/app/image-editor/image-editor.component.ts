import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ImageStateService} from '../services/image-share.service';
import {ImageMode, ModeStateService} from '../services/mode-share.service';
import {filter, interval, Subscription, switchMap} from 'rxjs';
import {ApiService, StartResponse, StatusResponse} from '../services/api.service';
import {NavigationEnd, Router} from '@angular/router';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  imports: [
    NgIf,
    FormsModule
  ],
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent implements AfterViewInit, OnDestroy, OnInit{
  @ViewChild('canvas', { static: true })  myCanvas!: ElementRef<HTMLCanvasElement>;

  imageSrc: string | null = null;
  secondarySrc: string | null = null;
  secondaryImage!: HTMLImageElement;
  currentMode: ImageMode = null;
  hasSelection = false;
  resultBlob: Blob | null    = null;
  private pollSubscription: Subscription | null = null;
  public task_progress_number = -1;
  public task_is_active = false;
  public task_message: string | null = null;

  private sub = new Subscription();

  private baseImage!: HTMLImageElement;

  // new: store the last‐drawn image box
  private imageBox: { x0: number, y0: number, w: number, h: number } | null = null;

  private isDrawing = false;
  private startX   = 0;
  private startY   = 0;
  private curX     = 0;
  private curY     = 0;
  private task_id = -1;

  constructor(private imageService: ImageStateService, private modeService: ModeStateService, private api: ApiService) {}

  ngOnInit() {

    this.sub.add(
      this.modeService.mode$.subscribe(m => {
        this.currentMode = m;
        this.hasSelection = false;
        if (m && this.imageSrc) {
          this.loadAndDrawImage(this.imageSrc);
        }
      })
    );
  }

  ngAfterViewInit() {
    this.drawBackgroundImage();
    this.imageService.imageSrc$.subscribe(src => {
      this.imageSrc = src as string;
      this.hasSelection = false;
      if (src) {
        this.loadAndDrawImage(src as string);
      }
    });
  }
  ngOnDestroy() {
    // clean up mode subscription
    this.onCancelClick()
    this.sub.unsubscribe();
  }

  private loadAndDrawImage(src: string) {
    const canvas = this.myCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      this.baseImage = img;
      const container = canvas.parentElement as HTMLElement;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      this.drawBackgroundImage();
    };
    img.src = src;
  }

  private dataURLtoBlob(dataUrl: string): Blob {
    // Split the header from the base64 payload
    const [header, base64] = dataUrl.split(',');
    // Extract the MIME type from the header
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    // Decode the base64 string
    const byteString = atob(base64);
    // Create an ArrayBuffer and view to hold the bytes
    const buf = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(buf);
    // Write the decoded bytes into the view
    for (let i = 0; i < byteString.length; i++) {
      view[i] = byteString.charCodeAt(i);
    }
    // Build a Blob of the right type
    return new Blob([view], { type: mime });
  }

  private blobUrlToBlob(blobUrl: string): Promise<Blob> {
    return fetch(blobUrl).then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch blob URL (status ${res.status})`);
      }
      return res.blob();
    });
  }


  /** Draws the image at 90% size, centers it, *and* stores its draw‐box. */
  private drawBackgroundImage() {
    if (!this.baseImage) return;
    const canvas = this.myCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;
    const img    = this.baseImage;

    const cw = canvas.width, ch = canvas.height;
    const maxW = cw * 0.9, maxH = ch * 0.9;
    const aspect = img.naturalWidth / img.naturalHeight;

    let w = maxW, h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }

    const x0 = (cw - w) / 2;
    const y0 = (ch - h) / 2;

    // store for hit-testing
    this.imageBox = { x0, y0, w, h };

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, x0, y0, w, h);
  }

  onCanvasClick(event: MouseEvent) {
    if(this.currentMode === 'outpaint' || this.currentMode === null) return;
    if (!this.imageBox) return;

    const { x0, y0, w, h } = this.imageBox;
    const { x, y } = this.getCanvasCoords(event);

    // only start/stop if clicking *inside* the image area
    if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) {
      // ignore clicks outside the image
      return;
    }

    if (!this.isDrawing) {
      // begin a new rectangle
      this.startX = x;
      this.startY = y;
      this.isDrawing = true;
      this.hasSelection = false;
    } else {
      // finish up, but clamp end‐point to the image
      this.isDrawing = false;
      this.curX = this.clamp(x, x0, x0 + w);
      this.curY = this.clamp(y, y0, y0 + h);
      this.redrawWithRectangle(this.startX, this.startY, this.curX, this.curY);
      this.hasSelection = true;
    }
  }

  onCanvasMouseMove(event: MouseEvent) {
    if(this.currentMode === 'outpaint' || this.currentMode === null) return;
    if (!this.isDrawing || !this.imageBox) return;

    const { x0, y0, w, h } = this.imageBox;
    const { x, y } = this.getCanvasCoords(event);

    // live‐preview, clamped to image bounds
    this.curX = this.clamp(x, x0, x0 + w);
    this.curY = this.clamp(y, y0, y0 + h);
    this.redrawWithRectangle(this.startX, this.startY, this.curX, this.curY);
  }

  private redrawWithRectangle(x1: number, y1: number, x2: number, y2: number) {
    const canvas = this.myCanvas.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    // 1) put back the image
    this.drawBackgroundImage();

    // 2) normalize coords
    const left   = Math.min(x1, x2);
    const top    = Math.min(y1, y2);
    const width  = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    // 3) draw rectangle
    ctx.strokeStyle = 'black';
    ctx.lineWidth   = 2;
    ctx.strokeRect(left, top, width, height);

    if(this.currentMode === 'inpaint') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(left, top, width, height);
    }
    else{
      const patternImg = this.secondaryImage;           // or another HTMLImageElement
      const pattern    = ctx.createPattern(patternImg, 'no-repeat');
      if (pattern) {
        // 2) scale it so it stretches to the rectangle size
        //    DOMMatrix takes [a, b, c, d, e, f], where
        //    a = scaleX, d = scaleY
        const m = new DOMMatrix()
          .translate(left, top)                    // move origin to rect top-left
          .scale(width / patternImg.width,
            height / patternImg.height);
        pattern.setTransform(m);

        // 3) use it to fill
        ctx.fillStyle = pattern;
        ctx.fillRect(left, top, width, height);
      }
    }
  }

  /** Helpers **/

  // clamp a value to [min, max]
  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  // convert event to canvas coords
  private getCanvasCoords(event: MouseEvent) {
    const rect = this.myCanvas.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onSecondaryImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.secondarySrc = reader.result as string;
      this.loadSecondaryImage(this.secondarySrc);
    };
    reader.readAsDataURL(file);

    // reset the input so you can re-upload the same file if needed:
    input.value = '';
  }

  private loadSecondaryImage(src: string) {
    const img = new Image();
    img.onload = () => {
      this.secondaryImage = img;
      // now you can display it or pass its Blob to your blend API
    };
    img.src = src;
    this.drawBackgroundImage();
    this.hasSelection = false;
  }


  onOutpaint() {
    if (!this.imageSrc) return;
    if (this.imageSrc.startsWith('blob:')) {
      this.blobUrlToBlob(this.imageSrc).then(blob => {
          this.api.outpaint(blob).subscribe(
            b => this.handleRequestStartResult(b),
          )}
        )
    }
    else if (this.imageSrc.startsWith('data:')) {
      const blob = this.dataURLtoBlob(this.imageSrc);
      this.api.outpaint(blob).subscribe(
        b => this.handleRequestStartResult(b),
      );
    } else {
      console.error('Unsupported imageSrc format:', this.imageSrc);
    }
  }

  onInpaint() {
    if (!this.imageSrc || !this.hasSelection || !this.imageBox) return;

    // map canvas‐coords back to image‐pixels:
    const { x0,y0,w:dw,h:dh } = this.imageBox;
    const scaleX = this.baseImage.naturalWidth  / dw;
    const scaleY = this.baseImage.naturalHeight / dh;
    const rectBox = {
      x: Math.round((Math.min(this.startX,this.curX)-x0)*scaleX),
      y: Math.round((Math.min(this.startY,this.curY)-y0)*scaleY),
      width:  Math.round(Math.abs(this.curX-this.startX)*scaleX),
      height: Math.round(Math.abs(this.curY-this.startY)*scaleY)
    };
    if (this.imageSrc.startsWith('blob:')) {
      this.blobUrlToBlob(this.imageSrc).then(blob => {
        this.api.inpaint(blob, rectBox).subscribe(b => this.handleRequestStartResult(b))
      })
    }
    else if (this.imageSrc.startsWith('data:')) {
      const blob = this.dataURLtoBlob(this.imageSrc);
      this.api.inpaint(blob, rectBox).subscribe(b => this.handleRequestStartResult(b));
    } else {
      console.error('Unsupported imageSrc format:', this.imageSrc);
    }
  }
  /*
  onBlend() {
    if (!this.imageSrc || !this.secondarySrc || !this.hasSelection || !this.imageBox) return;

    const primaryBlob   = this.dataURLtoBlob(this.imageSrc);
    const secondaryBlob = this.dataURLtoBlob(this.secondarySrc);

    const { x0,y0,w:dw,h:dh } = this.imageBox;
    const scaleX = this.baseImage.naturalWidth  / dw;
    const scaleY = this.baseImage.naturalHeight / dh;
    const rectBox = {
      x: Math.round((Math.min(this.startX,this.curX)-x0)*scaleX),
      y: Math.round((Math.min(this.startY,this.curY)-y0)*scaleY),
      width:  Math.round(Math.abs(this.curX-this.startX)*scaleX),
      height: Math.round(Math.abs(this.curY-this.startY)*scaleY)
    };

    this.api.blend(primaryBlob, secondaryBlob, { rectBox })
      .subscribe(b => this.handleResult(b));
  }
  */


  // common result handler
  private handleRequestStartResult(result: StartResponse) {
    this.task_id = result.task_id;
    this.task_is_active = true;
    this.pollSubscription = interval(3000).pipe(
      switchMap(() => this.api.get_task_status(this.task_id))
    ).subscribe({
      next: (s: StatusResponse) => {
        console.log('progress:', s.progress, 'message:', s.message, 'status:', s.status);
        this.task_progress_number = s.progress;
        this.task_message = s.message;
        if (s.status === 'DONE') {
          this.pollSubscription?.unsubscribe();
          this.api.get_task_result(this.task_id).subscribe({
            next: (blob: Blob) => {
              this.downloadBlob(blob);
              this.onResultBlob(blob);
              this.task_progress_number = -1;
              this.task_message = '';
              this.task_is_active = false;
            },
            error: err => {
              console.error('Error fetching result image:', err);
              this.task_progress_number = -1;
              this.task_message = '';
              this.task_is_active = false;
            }
          });
        }

        if (s.status === 'ERROR' || s.status === 'CANCELED') {
          this.pollSubscription?.unsubscribe();
          console.error('Task failed:', s.message);
          this.task_progress_number = -1;
          this.task_message = '';
          this.task_is_active = false;
        }
      },
      error: err => {
        console.error('Poll error:', err);
        this.task_progress_number = -1;
        this.task_message = '';
        this.task_is_active = false;
      }
    });
  }

  private onResultBlob(blob: Blob) {
    this.resultBlob = blob;
    const url = URL.createObjectURL(blob);
    this.imageSrc = url;
    const img = new Image();
    img.onload = () => {
      this.baseImage = img;
      this.drawBackgroundImage();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      console.error('Failed to load blob into <img>');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  public onCancelClick() {
    if (this.task_id < 0) { return; }
    this.api.cancelTask(this.task_id).subscribe({
      next: resp => {
        this.task_progress_number = -1;
        this.task_message = '';
        this.task_is_active = false;
        this.pollSubscription?.unsubscribe();
      },
      error: err => {
        console.error('Error sending cancel request:', err);
        this.task_message = 'Error: could not send cancel request';
        this.task_progress_number = -1;
        this.task_message = '';
        this.task_is_active = false;
      }
    });
  }

  private downloadBlob(blob: Blob) {
    // 1) Create the object URL
    const objectUrl = window.URL.createObjectURL(blob);

    // 2) Build an <a> pointing to it
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'result.png';
    a.style.display = 'none';
    document.body.appendChild(a);

    // 3) Use setTimeout to ensure the click happens “just after” a user event
    setTimeout(() => {
      a.click();

      // 4) Cleanup: remove <a> and revoke the URL
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    }, 0);
  }

}
