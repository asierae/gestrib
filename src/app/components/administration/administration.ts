import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './administration.html',
  styleUrl: './administration.scss'
})
export class AdministrationComponent {
  
}
