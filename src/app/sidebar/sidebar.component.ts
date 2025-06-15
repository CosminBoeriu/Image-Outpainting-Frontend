import {Component, Input} from '@angular/core';
import {NavigationEnd, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import { Router } from '@angular/router';
import {filter} from 'rxjs';
import {ImageStateService} from '../services/image-share.service';
import {ImageMode, ModeStateService} from '../services/mode-share.service';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  imageSrc: string | ArrayBuffer | null | undefined = null;
  selectedMode: ImageMode = null;
  isLoggedIn = false;
  currentRoute: string = '';
  @Input() isSidebarOpen!: boolean;

  constructor(private router: Router, private imageService: ImageStateService, public modeService: ModeStateService, public authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
    // Subscribe to router events to keep currentRoute updated
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
    this.modeService.mode$.subscribe(m => this.selectedMode = m);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imageService.setImage(reader.result); // 🔄 share image
        target.value = '';
      };
      reader.readAsDataURL(file);
    }
  }
}


