import api from '@/lib/api';
import { ErrorHandler } from '@/utils/errorHandler';

export interface UserSettings {
  currency: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    budget_alerts: boolean;
    goal_reminders: boolean;
    transaction_updates: boolean;
  };
  privacy: {
    profile_visibility: string;
    data_sharing: boolean;
  };
  display: {
    theme: string;
    compact_view: boolean;
  };
}

export interface UpdateSettingsRequest {
  currency?: string;
  language?: string;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  display?: Partial<UserSettings['display']>;
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
  private baseUrl = '/settings';

  /**
   * Get current user settings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await api.get(this.baseUrl);

      // Handle different response formats
      const data = response.data?.data || response.data;

      // Provide default settings if none exist
      return {
        currency: data?.currency || 'USD',
        language: data?.language || 'en',
        timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          email: data?.notifications?.email ?? true,
          push: data?.notifications?.push ?? true,
          budget_alerts: data?.notifications?.budget_alerts ?? true,
          goal_reminders: data?.notifications?.goal_reminders ?? true,
          transaction_updates: data?.notifications?.transaction_updates ?? false,
        },
        privacy: {
          profile_visibility: data?.privacy?.profile_visibility || 'private',
          data_sharing: data?.privacy?.data_sharing ?? false,
        },
        display: {
          theme: data?.display?.theme || 'system',
          compact_view: data?.display?.compact_view ?? false,
        },
      };
    } catch (error) {
      ErrorHandler.logError(error, 'Get settings');
      throw new Error(ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(updates: UpdateSettingsRequest): Promise<UserSettings> {
    try {
      const response = await api.put(this.baseUrl, updates);
      return response.data?.data || response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Update settings');
      throw new Error(ErrorHandler.extractErrorMessage(error));
    }
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
  async resetSettings(): Promise<UserSettings> {
    try {
      const response = await api.post(`${this.baseUrl}/reset`);
      return response.data?.data || response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Reset settings');
      throw new Error(ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Export user settings
   */
  async exportSettings(): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/export`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Export settings');
      throw new Error(ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Import user settings
   */
  async importSettings(file: File): Promise<UserSettings> {
    try {
      const formData = new FormData();
      formData.append('settings', file);

      const response = await api.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data?.data || response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Import settings');
      throw new Error(ErrorHandler.extractErrorMessage(error));
    }
  }
}

export const settingsService = new SettingsService();
