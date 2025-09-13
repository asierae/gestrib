import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent {
  
}
