import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { Home } from './navigation/home/home';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet, RouterModule],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('portfolio');
}
