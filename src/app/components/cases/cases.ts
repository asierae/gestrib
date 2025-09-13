import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cases.html',
  styleUrl: './cases.scss'
})
export class CasesComponent {
  
}
