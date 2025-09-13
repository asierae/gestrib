import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  protected readonly title = signal('gestrib');
}
