import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm!: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private authService: AuthService) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  ngOnInit() {
    this.registerForm = this.fb.group({
      username: [''],
      email: [''],
      password: ['']
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { username, email, password } = this.registerForm.value;
      console.log('Registering:', { username, email });

      this.authService.register({ username, email, password }).subscribe({
        next: (res) => {
          console.log('Registration successful:', res);
          this.router.navigate(['/home']); // or auto-login if preferred
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.errorMessage = 'Registration failed';
        }
      });
    } else if (this.registerForm.hasError('mismatch')) {
      this.errorMessage = 'Passwords do not match';
    }
  }
}
