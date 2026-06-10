import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import "./index.css";
import "./styles/overrides.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#F8F7F4',
          colorText: '#111827',
          colorTextSecondary: '#6B7280',
          colorBorder: '#E5E7EB',
          colorBorderSecondary: '#F3F4F6',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          fontSize: 14,
          controlHeight: 36,
          controlOutline: 'rgba(79, 70, 229, 0.1)',
        },
        components: {
          Button: {
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
          },
          Table: {
            headerBg: '#F3F4F6',
            headerColor: '#6B7280',
            rowHoverBg: '#F9FAFB',
            borderColor: '#F3F4F6',
          },
          Card: {
            paddingLG: 16,
          },
          Modal: {
            titleFontSize: 16,
            headerBg: 'transparent',
          },
          Menu: {
            itemSelectedBg: '#EEF2FF',
            itemSelectedColor: '#4F46E5',
            itemHoverBg: '#F9FAFB',
          },
          Tabs: {
            inkBarColor: '#4F46E5',
            itemActiveColor: '#4F46E5',
            itemSelectedColor: '#4F46E5',
          },
          Input: {
            activeBorderColor: '#4F46E5',
            hoverBorderColor: '#D1D5DB',
          },
          Select: {
            optionSelectedBg: '#EEF2FF',
          },
          Upload: {
            draggerColor: '#F3F4F6',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
