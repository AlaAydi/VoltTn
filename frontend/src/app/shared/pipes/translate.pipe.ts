import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@core/services/i18n.service';

@Pipe({
  name: 'trans',
  standalone: true,
  pure: false 
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string): string {
    return this.i18n.translate(key);
  }
}
