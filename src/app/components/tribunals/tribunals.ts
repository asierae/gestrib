import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-tribunals',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './tribunals.html',
  styleUrl: './tribunals.scss'
})
export class TribunalsComponent {
  
}
