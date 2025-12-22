import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Macros, Language } from '../../models/types';
import { TRANSLATIONS } from '../../models/constants';

@Component({
  selector: 'app-macro-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './macro-progress.html',
})
export class MacroProgress implements OnChanges {
  @Input() current!: Macros;
  @Input() target!: Macros;
  @Input() theme: string = 'blue';
  @Input() lang: Language = 'en';

  mainColor = '#3b82f6';
  calPercent = 0;
  strokeDashoffset = 351;
  
  t = TRANSLATIONS['en'];

  ngOnChanges() {
    this.t = TRANSLATIONS[this.lang];
    this.updateColor();
    this.calPercent = this.calculatePercentage(this.current.calories, this.target.calories);
    this.strokeDashoffset = 351 - (351 * this.calPercent) / 100;
  }

  getThemeColor() {
     switch(this.theme) {
      case 'green': return '#10b981';
      case 'orange': return '#f97316';
      default: return '#3b82f6';
    }
  }
  
  updateColor() {
      this.mainColor = this.getThemeColor();
  }

  calculatePercentage(curr: number, total: number) {
    if (total === 0) return 0;
    return Math.min(100, Math.max(0, (curr / total) * 100));
  }
  
  Math = Math;
}