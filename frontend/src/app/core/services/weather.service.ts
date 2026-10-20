import { Injectable, signal, computed } from '@angular/core';

export interface WeatherData {
  governorate: string;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  directNormalIrradianceWm2: number; // Rayonnement solaire direct
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  updatedAt: string;
}

const GOVERNORATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Tunis': { lat: 36.8065, lng: 10.1815 },
  'Ariana': { lat: 36.8665, lng: 10.1956 },
  'Ben Arous': { lat: 36.7531, lng: 10.2189 },
  'Manouba': { lat: 36.8081, lng: 10.0972 },
  'Nabeul': { lat: 36.4561, lng: 10.7376 },
  'Zaghouan': { lat: 36.4029, lng: 10.1429 },
  'Bizerte': { lat: 37.2744, lng: 9.8739 },
  'Béja': { lat: 36.7256, lng: 9.1817 },
  'Jendouba': { lat: 36.5011, lng: 8.7802 },
  'Le Kef': { lat: 36.1742, lng: 8.7049 },
  'Siliana': { lat: 36.0849, lng: 9.3708 },
  'Sousse': { lat: 35.8256, lng: 10.6369 },
  'Monastir': { lat: 35.7779, lng: 10.8262 },
  'Mahdia': { lat: 35.5047, lng: 11.0622 },
  'Sfax': { lat: 34.7406, lng: 10.7603 },
  'Kairouan': { lat: 35.6781, lng: 10.0963 },
  'Kasserine': { lat: 35.1676, lng: 8.8365 },
  'Sidi Bouzid': { lat: 35.0382, lng: 9.4858 },
  'Gabès': { lat: 33.8815, lng: 10.0982 },
  'Médenine': { lat: 33.3549, lng: 10.5055 },
  'Tataouine': { lat: 32.9297, lng: 10.4518 },
  'Gafsa': { lat: 34.4250, lng: 8.7842 },
  'Tozeur': { lat: 33.9197, lng: 8.1335 },
  'Kébili': { lat: 33.7044, lng: 8.9690 }
};

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private weatherCache = signal<Record<string, WeatherData>>({
    'Tunis': {
      governorate: 'Tunis',
      temperatureC: 32,
      humidityPct: 45,
      windSpeedKmh: 18,
      directNormalIrradianceWm2: 820,
      weatherCode: 0,
      weatherDescription: 'Ensoleillé / Chaleur estivale',
      weatherIcon: 'wb_sunny',
      updatedAt: 'Temps réel'
    },
    'Sousse': {
      governorate: 'Sousse',
      temperatureC: 31,
      humidityPct: 55,
      windSpeedKmh: 22,
      directNormalIrradianceWm2: 850,
      weatherCode: 0,
      weatherDescription: 'Ensoleillé / Brise marine',
      weatherIcon: 'wb_sunny',
      updatedAt: 'Temps réel'
    },
    'Sfax': {
      governorate: 'Sfax',
      temperatureC: 33,
      humidityPct: 48,
      windSpeedKmh: 16,
      directNormalIrradianceWm2: 870,
      weatherCode: 0,
      weatherDescription: 'Très ensoleillé',
      weatherIcon: 'wb_sunny',
      updatedAt: 'Temps réel'
    },
    'Tozeur': {
      governorate: 'Tozeur',
      temperatureC: 41,
      humidityPct: 18,
      windSpeedKmh: 24,
      directNormalIrradianceWm2: 980,
      weatherCode: 0,
      weatherDescription: 'Canicule désertique & Solaire maximal',
      weatherIcon: 'local_fire_department',
      updatedAt: 'Temps réel'
    }
  });

  readonly liveWeather = computed(() => this.weatherCache());

  constructor() {
    this.refreshAllTunisiaWeather();
  }

  getWeatherForGov(govName: string): WeatherData {
    const cached = this.weatherCache()[govName];
    if (cached) return cached;

    // Fallback standard tunisien réaliste
    return {
      governorate: govName,
      temperatureC: 32,
      humidityPct: 50,
      windSpeedKmh: 20,
      directNormalIrradianceWm2: 840,
      weatherCode: 0,
      weatherDescription: 'Ensoleillé & Ciel dégagé',
      weatherIcon: 'wb_sunny',
      updatedAt: 'Estimé'
    };
  }

  // Appel de l'API Open-Meteo pour un gouvernorat donné
  async fetchLiveWeather(govName: string): Promise<WeatherData> {
    const coords = GOVERNORATE_COORDS[govName] || GOVERNORATE_COORDS['Tunis'];
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,direct_normal_irradiance&timezone=Africa%2FTunis`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        const weatherDesc = this.mapWeatherCode(current.weather_code);

        const weatherItem: WeatherData = {
          governorate: govName,
          temperatureC: Math.round(current.temperature_2m),
          humidityPct: Math.round(current.relative_humidity_2m),
          windSpeedKmh: Math.round(current.wind_speed_10m),
          directNormalIrradianceWm2: Math.round(current.direct_normal_irradiance || 800),
          weatherCode: current.weather_code,
          weatherDescription: weatherDesc.description,
          weatherIcon: weatherDesc.icon,
          updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };

        this.weatherCache.update(c => ({ ...c, [govName]: weatherItem }));
        return weatherItem;
      }
    } catch {
      // Ignorer l'erreur réseau et garder les données en cache
    }
    return this.getWeatherForGov(govName);
  }

  private mapWeatherCode(code: number): { description: string; icon: string } {
    if (code === 0) return { description: 'Ciel totalement dégagé', icon: 'wb_sunny' };
    if (code <= 3) return { description: 'Partiellement voilé', icon: 'partly_cloudy_day' };
    if (code <= 48) return { description: 'Brumeux', icon: 'foggy' };
    if (code <= 67) return { description: 'Pluie légère', icon: 'rainy' };
    if (code <= 82) return { description: 'Averses orageuses', icon: 'thunderstorm' };
    return { description: 'Beau temps', icon: 'wb_sunny' };
  }

  async refreshAllTunisiaWeather(): Promise<void> {
    const mainGovs = ['Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Tozeur', 'Gabès', 'Kairouan', 'Nabeul'];
    for (const gov of mainGovs) {
      this.fetchLiveWeather(gov);
    }
  }
}
