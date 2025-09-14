import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface DialogData {
  title: string;
  message: string;
  details: string;
  defenseInfo: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p class="message">{{ data.message }}</p>
        <p class="details">{{ data.details }}</p>
        <div class="defense-info">
          <strong>{{ data.defenseInfo }}</strong>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-button">
          {{ 'cases.cancel' | translate }}
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-button">
          <mat-icon>delete_forever</mat-icon>
          {{ 'cases.confirm' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      max-width: 550px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 32px 32px 24px 32px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        pointer-events: none;
      }
    }
    
    .warning-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fef2f2;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    
    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .dialog-content {
      padding: 32px;
      background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    }
    
    .message {
      font-size: 1.2rem;
      color: #1f2937;
      margin-bottom: 20px;
      line-height: 1.6;
      font-weight: 500;
    }
    
    .details {
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.5;
      font-size: 1rem;
    }
    
    .defense-info {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      padding: 20px;
      border-radius: 12px;
      border-left: 5px solid #dc2626;
      color: #1f2937;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%);
        border-radius: 12px;
        pointer-events: none;
      }
    }
    
    .dialog-actions {
      padding: 24px 32px 32px 32px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      border-top: 1px solid #e2e8f0;
    }
    
    .cancel-button {
      color: #6b7280;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: #e5e7eb;
        color: #374151;
        transform: translateY(-1px);
      }
    }
    
    .confirm-button {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &:hover {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      mat-icon {
        margin-right: 8px;
        font-size: 20px;
      }
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
