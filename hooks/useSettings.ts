import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  autoResumeOnRefresh: boolean;
}

const defaultSettings: AppSettings = {
  autoResumeOnRefresh: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['appSettings'], (res) => {
      if (res.appSettings) {
        setSettings({ ...defaultSettings, ...res.appSettings });
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.appSettings && changes.appSettings.newValue) {
        setSettings({ ...defaultSettings, ...changes.appSettings.newValue });
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    chrome.storage.local.get(['appSettings'], (res) => {
      const current = res.appSettings || defaultSettings;
      const updated = { ...current, ...newSettings };
      chrome.storage.local.set({ appSettings: updated });
    });
  }, []);

  return {
    settings,
    updateSettings,
    isSettingsOpen: isOpen,
    setSettingsOpen: setIsOpen
  };
}
