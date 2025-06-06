import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Moon, 
  Sun, 
  Globe, 
  DollarSign, 
  Bell, 
  Shield, 
  Palette,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApiError } from '@/utils/errorHandler';
import { settingsService, UserSettings, UpdateSettingsRequest } from '@/services/settingsService';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  const { handleError } = useApiError();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSettings = await settingsService.getSettings();
      setSettings(userSettings);
      // Sync theme with settings
      if (userSettings.display.theme !== theme) {
        setTheme(userSettings.display.theme as any);
      }
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch settings');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: UpdateSettingsRequest) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      setHasChanges(false);
      
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Update settings');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (settings) {
      updateSettings({ 
        display: { 
          ...settings.display, 
          theme: newTheme 
        } 
      });
    }
  };

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return;
    
    const updatedNotifications = {
      ...settings.notifications,
      [key]: value
    };
    
    setSettings({
      ...settings,
      notifications: updatedNotifications
    });
    setHasChanges(true);
  };

  const handleCurrencyChange = (currency: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      currency
    });
    setHasChanges(true);
  };

  const handleLanguageChange = (language: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      language
    });
    setHasChanges(true);
  };

  const handlePrivacyChange = (key: keyof UserSettings['privacy'], value: boolean | string) => {
    if (!settings) return;
    
    const updatedPrivacy = {
      ...settings.privacy,
      [key]: value
    };
    
    setSettings({
      ...settings,
      privacy: updatedPrivacy
    });
    setHasChanges(true);
  };

  const saveChanges = () => {
    if (!settings || !hasChanges) return;
    
    updateSettings({
      currency: settings.currency,
      language: settings.language,
      notifications: settings.notifications,
      privacy: settings.privacy,
      display: settings.display,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Failed to load settings. Please try again.'}
          </AlertDescription>
        </Alert>
        
        <Button onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>
        
        {hasChanges && (
          <Button onClick={saveChanges} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="appearance" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs sm:text-sm">Preferences</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs sm:text-sm">Privacy</TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
              <CardDescription className="text-sm">
                Choose your preferred theme for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  className="flex items-center gap-2 h-16 sm:h-20 flex-col"
                >
                  <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  className="flex items-center gap-2 h-16 sm:h-20 flex-col"
                >
                  <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('system')}
                  className="flex items-center gap-2 h-16 sm:h-20 flex-col"
                >
                  <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">System</span>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Current theme: <span className="font-medium">{actualTheme}</span>
                {theme === 'system' && ' (from system preference)'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Display Options</CardTitle>
              <CardDescription className="text-sm">
                Customize how information is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base">Compact View</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Show more information in less space
                  </p>
                </div>
                <Switch
                  checked={settings?.display.compact_view || false}
                  onCheckedChange={(checked) => {
                    if (settings) {
                      setSettings({
                        ...settings,
                        display: { ...settings.display, compact_view: checked }
                      });
                      setHasChanges(true);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <DollarSign className="h-5 w-5" />
                Currency & Region
              </CardTitle>
              <CardDescription className="text-sm">
                Set your preferred currency and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm sm:text-base">Default Currency</Label>
                  <Select
                    value={settings?.currency || 'USD'}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {settingsService.getSupportedCurrencies().map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <span className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span className="hidden sm:inline">{currency.name}</span>
                            <span>({currency.code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm sm:text-base">Language</Label>
                  <Select
                    value={settings?.language || 'en'}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {settingsService.getSupportedLanguages().map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm sm:text-base">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings?.timezone || ''}
                  disabled
                  className="bg-muted text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Timezone is automatically detected from your system
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-sm">
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Email Notifications</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.email || false}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Push Notifications</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.push || false}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Budget Alerts</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Get notified when approaching budget limits
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.budget_alerts || false}
                    onCheckedChange={(checked) => handleNotificationChange('budget_alerts', checked)}
                  />
                </div>
                
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Goal Reminders</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Receive reminders about your financial goals
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.goal_reminders || false}
                    onCheckedChange={(checked) => handleNotificationChange('goal_reminders', checked)}
                  />
                </div>
                
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Transaction Updates</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Get notified about new transactions
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.transaction_updates || false}
                    onCheckedChange={(checked) => handleNotificationChange('transaction_updates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-sm">
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Profile Visibility</Label>
                  <Select
                    value={settings?.privacy.profile_visibility || 'private'}
                    onValueChange={(value) => handlePrivacyChange('profile_visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Control who can see your profile information
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label className="text-sm sm:text-base">Data Sharing</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Allow anonymous usage data to help improve the app
                    </p>
                  </div>
                  <Switch
                    checked={settings?.privacy.data_sharing || false}
                    onCheckedChange={(checked) => handlePrivacyChange('data_sharing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
              <CardDescription className="text-sm">
                Your account details and security information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium text-sm sm:text-base truncate">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Member Since</Label>
                  <p className="font-medium text-sm sm:text-base">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base">Two-Factor Authentication</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile Save Button */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm">You have unsaved changes</div>
            <Button size="sm" onClick={saveChanges} disabled={saving} className="w-auto">
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Save Indicator */}
      {hasChanges && (
        <div className="hidden lg:block fixed bottom-6 right-6 bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-sm">You have unsaved changes</div>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
