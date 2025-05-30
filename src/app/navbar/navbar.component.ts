import {Component, EventEmitter, Injectable, Input, Output} from '@angular/core';
import {RouterLink} from '@angular/router';
import { Router } from '@angular/router';
import {NgIf, NgOptimizedImage} from '@angular/common';
import { AuthService } from '../services/auth.service'; // adjust path if needed


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports: [
    RouterLink,
    NgIf,
    NgOptimizedImage
  ],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();
  @Input() isSidebarOpen!: boolean;
  isLoggedIn = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  onToggleClick() {
    this.toggle.emit();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  goHome(){
    this.router.navigate(['/home']).then(r => {});
  }

  register() {
    this.router.navigate(['/register']).then(r => {});
  }
  login() {
    this.router.navigate(['/login']).then(r => {});
  }
  logout() {
    this.authService.logout();
  }
}


