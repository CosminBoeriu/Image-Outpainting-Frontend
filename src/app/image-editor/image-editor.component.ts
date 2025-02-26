import {Component, HostListener} from '@angular/core';
import {NgIf, NgOptimizedImage} from '@angular/common';
import {CdkDrag, DragDropModule} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  imports: [
    NgIf,
    NgOptimizedImage,
    CdkDrag
  ],
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent {
  imageSrc: string | ArrayBuffer | null | undefined = null;
  private mousePos: Array<number> | null = null;
  private isDragging: boolean = false;


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




}
