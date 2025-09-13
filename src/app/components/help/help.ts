import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './help.html',
  styleUrl: './help.scss'
})
export class HelpComponent {
  
}
