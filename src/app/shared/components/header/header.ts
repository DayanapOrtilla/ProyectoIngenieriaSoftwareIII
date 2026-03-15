import { Component, Inject, inject } from '@angular/core';
import { AuthService }       from '../../../core/services/auth.service';
import { UiService }   from '../../../core/services/ui.service';



@Component({
  selector:   'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  protected auth = inject(AuthService);
  protected ui = inject(UiService)
}