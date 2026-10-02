import { Routes } from '@angular/router';
import { Home } from './navigation/home/home';
import { IprCalculator } from './tools/ipr-calculator/ipr-calculator';

export const routes: Routes = [
  // 1. Redirect empty path to 'home'
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'ipr-calculator', component: IprCalculator },
];
