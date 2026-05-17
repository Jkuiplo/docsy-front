import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { ConfigProvider, Segmented, theme } from 'antd';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  activeTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const themeStorageKey = 'docsyThemeMode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

const getStoredMode = (): ThemeMode => {
  const storedMode = localStorage.getItem(themeStorageKey);
  return storedMode === 'light' || storedMode === 'dark' || storedMode === 'system' ? storedMode : 'system';
};

const getSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const activeTheme = mode === 'system' ? systemTheme : mode;
  const isDark = activeTheme === 'dark';

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!mediaQuery) {
      return;
    }

    const onThemeChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', onThemeChange);

    return () => mediaQuery.removeEventListener('change', onThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      activeTheme,
      setMode: (nextMode) => {
        localStorage.setItem(themeStorageKey, nextMode);
        setModeState(nextMode);
      },
    }),
    [activeTheme, mode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? '#7aa7ff' : '#2f6fed',
            colorBgBase: isDark ? '#151b26' : '#f4f6fb',
            colorBgContainer: isDark ? '#202838' : '#ffffff',
            colorBgElevated: isDark ? '#242d3f' : '#ffffff',
            colorBgLayout: isDark ? '#151b26' : '#f4f6fb',
            colorBorder: isDark ? '#344055' : '#dfe5ef',
            colorBorderSecondary: isDark ? '#2b3548' : '#edf1f7',
            colorText: isDark ? '#edf2fb' : '#152033',
            colorTextSecondary: isDark ? '#b8c2d2' : '#667085',
            borderRadius: 8,
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          components: {
            Card: {
              colorBgContainer: isDark ? '#202838' : '#ffffff',
              borderRadiusLG: 10,
            },
            Table: {
              colorBgContainer: isDark ? '#202838' : '#ffffff',
              headerBg: isDark ? '#263146' : '#f8fafd',
              headerColor: isDark ? '#edf2fb' : '#152033',
              rowHoverBg: isDark ? '#2a354a' : '#f8fafd',
            },
            Layout: {
              bodyBg: 'transparent',
              headerBg: 'transparent',
              siderBg: 'transparent',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

const useThemeMode = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside AppThemeProvider');
  }

  return context;
};

export const ThemeModeControl = ({ className }: { className?: string }) => {
  const { mode, setMode } = useThemeMode();

  return (
    <Segmented
      className={className}
      size="small"
      value={mode}
      onChange={(value) => setMode(value as ThemeMode)}
      options={[
        { value: 'system', icon: <DesktopOutlined />, label: 'System' },
        { value: 'light', icon: <SunOutlined />, label: 'Light' },
        { value: 'dark', icon: <MoonOutlined />, label: 'Dark' },
      ]}
    />
  );
};
