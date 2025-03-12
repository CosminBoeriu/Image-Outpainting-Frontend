import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {NgIf, NgOptimizedImage} from '@angular/common';
import {CdkDrag, DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  imports: [
    NgIf,
    NgOptimizedImage,
    CdkDrag,
    FormsModule
  ],
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent {
  @ViewChild('canvas') myCanvas!: ElementRef;
  imageSrc: string | ArrayBuffer | null | undefined = null;
  private dimensions: Array<number> = [80, 80]
  private mousePos: Array<number> | null = null;
  private isDragging: boolean = false;

  constructor() {
     this.resizeCanvas(this.dimensions[0], this.dimensions[1]);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.imageSrc = e.target?.result;
      };

      reader.readAsDataURL(file);
    }
  }

  updateMousePosition(event: MouseEvent) {
    this.mousePos = [event.offsetX, event.offsetY];
  }

  resizeCanvas(width: number, height: number) {
    this.myCanvas.nativeElement.width.vh = width;
    this.myCanvas.nativeElement.height.vh = height;
  }



}
