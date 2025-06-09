import api  from '@/lib/api';

// User settings interfaces
export interface UserSettings {
  id?: number;
  user_id?: number;
  currency: string;
  language: string;
  timezone: string;
  display: {
    theme: 'light' | 'dark' | 'system';
    compact_view: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    budget_alerts: boolean;
    goal_reminders: boolean;
    transaction_updates: boolean;
  };
  privacy: {
    profile_visibility: 'private' | 'public';
    data_sharing: boolean;
  };
}

export interface UpdateSettingsRequest {
  currency?: string;
  language?: string;
  timezone?: string;
  display?: Partial<UserSettings['display']>;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Language {
  code: string;
  name: string;
}

class SettingsService {
  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await api.get('/settings/user');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Settings API not implemented yet, using default settings:', errorMessage);
      // Return default settings if API fails
      return this.getDefaultSettings();
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(updates: UpdateSettingsRequest): Promise<UserSettings> {
    try {
      const response = await api.put('/settings/user', updates);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to update settings (API not implemented yet):', errorMessage);
      // For now, merge updates with defaults and return
      const currentSettings = this.getDefaultSettings();
      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...updates,
        display: { ...currentSettings.display, ...updates.display },
        notifications: { ...currentSettings.notifications, ...updates.notifications },
        privacy: { ...currentSettings.privacy, ...updates.privacy }
      };
      console.warn('Settings update simulated locally:', updatedSettings);
      return updatedSettings;
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings(): UserSettings {
    return {
      currency: 'USD',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      display: {
        theme: 'system',
        compact_view: false,
      },
      notifications: {
        email: true,
        push: false,
        budget_alerts: true,
        goal_reminders: true,
        transaction_updates: false,
      },
      privacy: {
        profile_visibility: 'private',
        data_sharing: false,
      },
    };
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    ];
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Language[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'zh', name: '中文' },
    ];
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<UserSettings> {
    const defaultSettings = this.getDefaultSettings();
    return await this.updateSettings(defaultSettings);
  }

  /**
   * Export settings as JSON
   */
  exportSettings(settings: UserSettings): string {
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(settingsJson: string): Promise<UserSettings> {
    try {
      const settings = JSON.parse(settingsJson);
      return await this.updateSettings(settings);
    } catch {
      throw new Error('Invalid settings JSON format');
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;
