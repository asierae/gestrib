import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface LanguageDetectionResponse {
  data: {
    detections: Array<Array<{
      language: string;
      confidence: number;
      isReliable: boolean;
    }>>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GoogleTranslateService {
  private http = inject(HttpClient);
  
  // Esta es una API key de ejemplo - deberías reemplazarla con tu propia API key
  private apiKey = 'TU_API_KEY_AQUI';
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2/detect';
  
  /**
   * Detecta el idioma de un texto usando Google Translate API
   * @param text El texto a analizar
   * @returns Observable con el código de idioma detectado
   */
  detectLanguage(text: string): Observable<string> {
    if (!text || text.trim().length < 3) {
      return of('es'); // Por defecto español si el texto es muy corto
    }
    
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    const body = { q: text };
    
    return this.http.post<LanguageDetectionResponse>(url, body).pipe(
      map(response => {
        if (response.data && response.data.detections && response.data.detections.length > 0) {
          const detection = response.data.detections[0][0];
          console.log('Google Translate API - Idioma detectado:', detection.language, 'Confianza:', detection.confidence);
          return this.mapGoogleLanguageToAppLanguage(detection.language);
        }
        return 'es'; // Fallback a español
      }),
      catchError(error => {
        console.warn('Error detectando idioma con Google Translate API:', error);
        // Fallback a detección por palabras clave
        return of(this.detectLanguageByKeywords(text));
      })
    );
  }
  
  /**
   * Mapea los códigos de idioma de Google Translate a los códigos de la aplicación
   * @param googleLanguageCode Código de idioma devuelto por Google
   * @returns Código de idioma de la aplicación
   */
  private mapGoogleLanguageToAppLanguage(googleLanguageCode: string): string {
    const mapping: Record<string, string> = {
      'es': 'es',  // Español
      'en': 'en',  // Inglés
      'eu': 'eu',  // Euskera
      'ca': 'es',  // Catalán -> Español (fallback)
      'gl': 'es',  // Gallego -> Español (fallback)
      'pt': 'es',  // Portugués -> Español (fallback)
      'fr': 'es',  // Francés -> Español (fallback)
      'de': 'es',  // Alemán -> Español (fallback)
      'it': 'es',  // Italiano -> Español (fallback)
      'ru': 'es',  // Ruso -> Español (fallback)
      'zh': 'es',  // Chino -> Español (fallback)
      'ja': 'es',  // Japonés -> Español (fallback)
      'ko': 'es',  // Coreano -> Español (fallback)
      'ar': 'es',  // Árabe -> Español (fallback)
      'hi': 'es',  // Hindi -> Español (fallback)
      'th': 'es',  // Tailandés -> Español (fallback)
      'vi': 'es',  // Vietnamita -> Español (fallback)
      'id': 'es',  // Indonesio -> Español (fallback)
      'ms': 'es',  // Malayo -> Español (fallback)
      'tl': 'es',  // Tagalo -> Español (fallback)
      'sw': 'es',  // Suajili -> Español (fallback)
      'am': 'es',  // Amárico -> Español (fallback)
      'ha': 'es',  // Hausa -> Español (fallback)
      'yo': 'es',  // Yoruba -> Español (fallback)
      'zu': 'es',  // Zulú -> Español (fallback)
      'af': 'es',  // Afrikáans -> Español (fallback)
      'no': 'es',  // Noruego -> Español (fallback)
      'da': 'es',  // Danés -> Español (fallback)
      'sv': 'es',  // Sueco -> Español (fallback)
      'fi': 'es',  // Finés -> Español (fallback)
      'pl': 'es',  // Polaco -> Español (fallback)
      'uk': 'es',  // Ucraniano -> Español (fallback)
      'cs': 'es',  // Checo -> Español (fallback)
      'hu': 'es',  // Húngaro -> Español (fallback)
      'ro': 'es',  // Rumano -> Español (fallback)
      'bg': 'es',  // Búlgaro -> Español (fallback)
      'hr': 'es',  // Croata -> Español (fallback)
      'sl': 'es',  // Esloveno -> Español (fallback)
      'sk': 'es',  // Eslovaco -> Español (fallback)
      'et': 'es',  // Estonio -> Español (fallback)
      'lv': 'es',  // Letón -> Español (fallback)
      'lt': 'es',  // Lituano -> Español (fallback)
      'el': 'es',  // Griego -> Español (fallback)
      'tr': 'es',  // Turco -> Español (fallback)
      'he': 'es',  // Hebreo -> Español (fallback)
      'is': 'es',  // Islandés -> Español (fallback)
      'ga': 'es',  // Irlandés -> Español (fallback)
      'cy': 'es',  // Galés -> Español (fallback)
      'br': 'es',  // Bretón -> Español (fallback)
      'ast': 'es', // Asturiano -> Español (fallback)
      'ext': 'es', // Extremeño -> Español (fallback)
      'an': 'es',  // Aragonés -> Español (fallback)
      'mwl': 'es', // Mirandés -> Español (fallback)
      'lad': 'es', // Ladino -> Español (fallback)
      'mxi': 'es', // Mozárabe -> Español (fallback)
      'osp': 'es', // Español antiguo -> Español (fallback)
      'und': 'es'  // Indeterminado -> Español (fallback)
    };
    
    return mapping[googleLanguageCode] || 'es';
  }
  
  /**
   * Detección de idioma por palabras clave como fallback
   * @param text El texto a analizar
   * @returns Código de idioma detectado
   */
  private detectLanguageByKeywords(text: string): string {
    const texto = text.toLowerCase();
    
    // Palabras clave en inglés
    const palabrasIngles = [
      'good', 'morning', 'afternoon', 'evening', 'night', 'hello', 'hi', 'bye', 'thanks', 'thank you',
      'please', 'yes', 'no', 'the', 'and', 'or', 'but', 'with', 'for', 'from', 'to', 'in', 'on', 'at',
      'by', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
      'system', 'application', 'software', 'hardware', 'database', 'network', 'security', 'analysis',
      'design', 'development', 'implementation', 'testing', 'management', 'algorithm', 'data', 'information',
      'technology', 'computer', 'programming', 'code', 'function', 'method', 'class', 'object', 'variable',
      'array', 'string', 'integer', 'boolean', 'interface', 'abstract', 'static', 'public', 'private',
      'protected', 'final', 'abstract', 'extends', 'implements', 'import', 'package', 'return', 'if', 'else',
      'while', 'for', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws'
    ];
    
    // Palabras clave en español
    const palabrasEspanol = [
      'buenos', 'días', 'tardes', 'noches', 'hola', 'adiós', 'gracias', 'por favor', 'sí', 'no',
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'con', 'por', 'para',
      'desde', 'hasta', 'sobre', 'bajo', 'entre', 'durante', 'antes', 'después', 'ahora', 'entonces',
      'es', 'son', 'era', 'eran', 'fue', 'fueron', 'será', 'serán', 'he', 'has', 'ha', 'han', 'había',
      'habías', 'había', 'habíamos', 'habíais', 'habían', 'habré', 'habrás', 'habrá', 'habremos',
      'habréis', 'habrán', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel',
      'aquella', 'aquellos', 'aquellas', 'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros',
      'vosotras', 'ellos', 'ellas', 'me', 'te', 'lo', 'la', 'nos', 'os', 'los', 'las', 'mi', 'tu',
      'su', 'nuestro', 'nuestra', 'vuestro', 'vuestra', 'suyo', 'suya', 'sistema', 'aplicación',
      'software', 'hardware', 'base', 'datos', 'red', 'seguridad', 'análisis', 'diseño', 'desarrollo',
      'implementación', 'pruebas', 'gestión', 'algoritmo', 'información', 'tecnología', 'computadora',
      'programación', 'código', 'función', 'método', 'clase', 'objeto', 'variable', 'arreglo', 'cadena',
      'entero', 'booleano', 'interfaz', 'abstracto', 'estático', 'público', 'privado', 'protegido',
      'final', 'extiende', 'implementa', 'importa', 'paquete', 'retorna', 'si', 'sino', 'mientras',
      'para', 'cambiar', 'caso', 'romper', 'continuar', 'intentar', 'capturar', 'finalmente', 'lanzar'
    ];
    
    // Palabras clave en euskera
    const palabrasEuskera = [
      'egun', 'on', 'arratsalde', 'gau', 'kaixo', 'agur', 'eskerrik', 'asko', 'mesedez',
      'bai', 'ez', 'eta', 'edo', 'baina', 'rekin', 'zergatik', 'nola', 'non', 'noiz', 'zein', 'zenbat',
      'da', 'dira', 'zen', 'ziren', 'izango', 'dira', 'dut', 'duzu', 'du', 'dute', 'dun', 'duzue',
      'nuen', 'zuen', 'zuen', 'genuen', 'zenuten', 'zuten', 'izango', 'dut', 'duzu', 'du', 'dute',
      'dun', 'duzue', 'dira', 'hau', 'hori', 'horiek', 'horiek', 'hura', 'hura', 'horiek', 'horiek',
      'ni', 'zu', 'hura', 'hura', 'gu', 'zuek', 'haiek', 'niri', 'zuri', 'hari', 'guri', 'zuei',
      'haiei', 'nire', 'zure', 'bere', 'gure', 'zuen', 'beren', 'sistema', 'aplikazioa', 'software',
      'hardware', 'datu', 'base', 'sarea', 'segurtasuna', 'analisia', 'diseinua', 'garapena',
      'inplementazioa', 'probak', 'kudeaketa', 'algoritmoa', 'datuak', 'informazioa', 'teknologia',
      'ordenagailua', 'programazioa', 'kodea', 'funtzioa', 'metodoa', 'klasea', 'objektua', 'aldagaia',
      'array', 'katea', 'osokoa', 'boolearra', 'interfazea', 'abstraktua', 'estatikoa', 'publikoa',
      'pribatua', 'babestua', 'finala', 'zabaltzen', 'inplementatzen', 'inportatzen', 'paketea',
      'itzultzen', 'bada', 'bestela', 'bitartean', 'aldaketa', 'kasua', 'hautsi', 'jarraitu', 'saiatu',
      'harrapatu', 'azkenean', 'bota'
    ];
    
    // Contar ocurrencias de cada idioma
    const contadorIngles = palabrasIngles.filter(palabra => texto.includes(palabra)).length;
    const contadorEspanol = palabrasEspanol.filter(palabra => texto.includes(palabra)).length;
    const contadorEuskera = palabrasEuskera.filter(palabra => texto.includes(palabra)).length;
    
    console.log('Detección por palabras clave - Inglés:', contadorIngles, 'Español:', contadorEspanol, 'Euskera:', contadorEuskera);
    
    // Si hay al menos 2 palabras de un idioma, considerarlo detectado
    if (contadorIngles >= 2) return 'en';
    if (contadorEspanol >= 2) return 'es';
    if (contadorEuskera >= 2) return 'eu';
    
    return 'es'; // Por defecto español
  }
}
