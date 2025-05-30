import {Component, NgModule} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavbarComponent} from './navbar/navbar.component';
import {ImageEditorComponent} from './image-editor/image-editor.component';
import {SidebarComponent} from './sidebar/sidebar.component';
import {AuthService} from './services/auth.service';
import {HTTP_INTERCEPTORS} from '@angular/common/http';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ImageEditorComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  isSidebarOpen = false;
  title = 'Front';

  constructor(public authService: AuthService) {}


  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
