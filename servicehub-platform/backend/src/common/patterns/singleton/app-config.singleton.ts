/**
 * Singleton pour la configuration globale de l'application
 * Centralise tous les paramètres de configuration
 */

export interface AppConfiguration {
  // Configuration générale
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';

  // Configuration métier
  defaultTaxRate: number;
  defaultPaymentDelayDays: number;
  maxTicketsPerUser: number;
  ticketAutoCloseDelayDays: number;

  // Configuration technique
  bcryptSaltRounds: number;
  jwtExpirationHours: number;
  paginationDefaultLimit: number;
  paginationMaxLimit: number;

  // Configuration des références
  referenceFormats: {
    ticket: string;
    invoice: string;
    payment: string;
  };
}

const DEFAULT_CONFIG: AppConfiguration = {
  appName: 'ServiceHub',
  appVersion: '1.0.0',
  environment: 'development',

  defaultTaxRate: 20,
  defaultPaymentDelayDays: 30,
  maxTicketsPerUser: 100,
  ticketAutoCloseDelayDays: 7,

  bcryptSaltRounds: 10,
  jwtExpirationHours: 24,
  paginationDefaultLimit: 10,
  paginationMaxLimit: 100,

  referenceFormats: {
    ticket: 'TKT-{DATE}-{SEQ}',
    invoice: 'INV-{DATE}-{SEQ}',
    payment: 'PAY-{DATE}-{SEQ}',
  },
};

export class AppConfig {
  private static instance: AppConfig | null = null;
  private config: AppConfiguration;
  private isLocked: boolean = false;

  /**
   * Constructeur privé
   */
  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Obtient l'instance unique de la configuration
   */
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Récupère toute la configuration
   */
  public getAll(): Readonly<AppConfiguration> {
    return { ...this.config };
  }

  /**
   * Récupère une valeur de configuration
   */
  public get<K extends keyof AppConfiguration>(key: K): AppConfiguration[K] {
    return this.config[key];
  }

  /**
   * Modifie une valeur de configuration
   * @throws Error si la configuration est verrouillée
   */
  public set<K extends keyof AppConfiguration>(key: K, value: AppConfiguration[K]): void {
    if (this.isLocked) {
      throw new Error('Configuration is locked and cannot be modified');
    }
    this.config[key] = value;
  }

  /**
   * Charge une configuration complète
   */
  public load(config: Partial<AppConfiguration>): void {
    if (this.isLocked) {
      throw new Error('Configuration is locked and cannot be modified');
    }
    this.config = { ...this.config, ...config };
  }

  /**
   * Charge la configuration depuis les variables d'environnement
   */
  public loadFromEnv(): void {
    if (this.isLocked) {
      throw new Error('Configuration is locked and cannot be modified');
    }

    const env = process.env;

    if (env.APP_NAME) this.config.appName = env.APP_NAME;
    if (env.APP_VERSION) this.config.appVersion = env.APP_VERSION;
    if (env.NODE_ENV) {
      this.config.environment = env.NODE_ENV as AppConfiguration['environment'];
    }
    if (env.DEFAULT_TAX_RATE) {
      this.config.defaultTaxRate = parseFloat(env.DEFAULT_TAX_RATE);
    }
    if (env.DEFAULT_PAYMENT_DELAY_DAYS) {
      this.config.defaultPaymentDelayDays = parseInt(env.DEFAULT_PAYMENT_DELAY_DAYS, 10);
    }
    if (env.BCRYPT_SALT_ROUNDS) {
      this.config.bcryptSaltRounds = parseInt(env.BCRYPT_SALT_ROUNDS, 10);
    }
    if (env.JWT_EXPIRATION_HOURS) {
      this.config.jwtExpirationHours = parseInt(env.JWT_EXPIRATION_HOURS, 10);
    }
  }

  /**
   * Verrouille la configuration (empêche les modifications)
   */
  public lock(): void {
    this.isLocked = true;
  }

  /**
   * Déverrouille la configuration
   */
  public unlock(): void {
    this.isLocked = false;
  }

  /**
   * Vérifie si la configuration est verrouillée
   */
  public isConfigLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  public reset(): void {
    if (this.isLocked) {
      throw new Error('Configuration is locked and cannot be reset');
    }
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Réinitialise l'instance singleton (pour les tests)
   */
  public static resetInstance(): void {
    AppConfig.instance = null;
  }

  /**
   * Helpers pour les valeurs courantes
   */
  public get taxRate(): number {
    return this.config.defaultTaxRate;
  }

  public get paymentDelay(): number {
    return this.config.defaultPaymentDelayDays;
  }

  public get isProd(): boolean {
    return this.config.environment === 'production';
  }

  public get isDev(): boolean {
    return this.config.environment === 'development';
  }
}

// Export de l'instance unique
export const appConfig = AppConfig.getInstance();
