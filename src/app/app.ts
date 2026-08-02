import { authGuard } from './core/guards/auth-guard';
import { Component, ChangeDetectionStrategy, inject, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  private auth = inject(AuthService);

  constructor() {
    afterNextRender(async () => {
      await this.auth.init();
    });
  }
}
