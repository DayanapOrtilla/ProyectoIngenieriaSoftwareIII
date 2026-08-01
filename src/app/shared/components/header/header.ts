import { Component, Inject, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.css',
})
export class HeaderComponent {
  protected auth = inject(AuthService);
  protected ui = inject(UiService);
}
