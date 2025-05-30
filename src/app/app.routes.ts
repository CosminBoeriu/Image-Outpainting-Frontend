import { Routes } from '@angular/router';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {RegisterComponent} from './register/register.component';


export const routes: Routes = [
  { path: 'image-editor', component: ImageEditorComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
];
