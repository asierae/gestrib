import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent {
  
}
