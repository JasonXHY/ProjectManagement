import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Tabs,
  Typography,
  message,
  Spin,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  RobotOutlined,
  FileOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { configService } from "../../services/configService";
import {
  ZHIPU_PROVIDER,
  MIMO_PROVIDER,
  DEFAULT_CLASSIFY_PROMPT_STAGES,
  DEFAULT_CLASSIFY_PROMPT_CONTENT,
  DEFAULT_ANALYZE_PROMPT,
  type AIProvider,
} from "../../types";

const { Text } = Typography;

/** SettingsPage 组件属性 */
interface SettingsPageProps {
  onBack: () => void;
}

/**
 * 设置页面
 * 包含AI模型配置和文件提取配置
 */
export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("zhipu");
  const [activeTab, setActiveTab] = useState("ai");

  /** 加载配置 */
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await configService.get();
      if (result.success && result.data) {
        form.setFieldsValue(result.data);
        setProvider((result.data.ai_provider as AIProvider) || "zhipu");
      }
    } catch (error) {
      message.error("加载配置失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /** 保存配置 */
  const handleSave = async () => {
    let values: Record<string, string>;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      const result = await configService.update(values);
      if (result.success) {
        message.success("保存成功");
      } else {
        message.error(result.error || "保存失败");
      }
    } catch (error) {
      message.error("保存配置失败");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  /** 恢复默认配置 */
  const handleReset = async () => {
    setLoading(true);
    try {
      form.resetFields();
      setProvider("zhipu");
      message.success("已重置表单（请保存以生效）");
    } catch (error) {
      message.error("重置失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /** 供应商切换 */
  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    if (value === "zhipu") {
      form.setFieldsValue({
        ai_model: ZHIPU_PROVIDER.models[0],
        ai_base_url: ZHIPU_PROVIDER.baseUrl,
      });
    } else if (value === "mimo") {
      form.setFieldsValue({
        ai_model: MIMO_PROVIDER.models[0],
        ai_base_url: MIMO_PROVIDER.baseUrl,
      });
    }
  };

  /** 获取模型选项 */
  const getModelOptions = () => {
    if (provider === "zhipu") {
      return ZHIPU_PROVIDER.models.map((m) => ({ value: m, label: m }));
    } else if (provider === "mimo") {
      return MIMO_PROVIDER.models.map((m) => ({ value: m, label: m }));
    }
    return [];
  };

  const extractionOptions = [
    { value: "local", label: "本地提取" },
    { value: "cloud", label: "云端分析" },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      <Spin spinning={loading}>
        {/* Tab 导航 */}
        <div
          style={{
            display: 'flex',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px',
            background: '#F3F4F6',
          }}
        >
          {[
            { key: 'ai', label: 'AI模型', icon: <RobotOutlined /> },
            { key: 'extraction', label: '文件提取', icon: <FileOutlined /> },
            { key: 'prompt', label: 'Prompt配置', icon: <EditOutlined /> },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 150ms',
                background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.key ? '#4F46E5' : '#6B7280',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <Form form={form} layout="vertical">
          {/* AI模型配置 */}
          {activeTab === 'ai' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                AI模型配置
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                配置AI模型供应商和接口参数，用于智能分析功能。
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <Form.Item label="模型供应商" name="ai_provider">
                  <Select
                    onChange={handleProviderChange}
                    options={[
                      { value: "zhipu", label: "智谱AI" },
                      { value: "mimo", label: "小米MiMo" },
                      { value: "custom", label: "自定义" },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="模型" name="ai_model">
                  {provider === "custom" ? (
                    <Input placeholder="输入模型名称" />
                  ) : (
                    <Select options={getModelOptions()} />
                  )}
                </Form.Item>
              </div>

              <Form.Item
                label="API Key"
                name="ai_api_key"
                rules={[{ required: true, message: "请输入API Key" }]}
              >
                <Input.Password placeholder="输入API Key" />
              </Form.Item>

              <Form.Item label="API地址" name="ai_base_url">
                <Input placeholder="API地址" />
              </Form.Item>
            </div>
          )}

          {/* 文件提取配置 */}
          {activeTab === 'extraction' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                文件提取配置
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                配置不同文件类型的提取方式。本地提取更快，云端分析更准确。
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <Form.Item label="TXT/MD文件" name="extraction_txt">
                  <Select options={extractionOptions} />
                </Form.Item>

                <Form.Item label="PDF（文字版）" name="extraction_pdf_text">
                  <Select options={extractionOptions} />
                </Form.Item>

                <Form.Item label="PDF（扫描版）" name="extraction_pdf_scanned">
                  <Select
                    options={[{ value: "cloud", label: "云端分析（必须）" }]}
                    disabled
                  />
                </Form.Item>

                <Form.Item label="Word文档" name="extraction_word">
                  <Select options={extractionOptions} />
                </Form.Item>

                <Form.Item label="Excel表格" name="extraction_excel">
                  <Select options={extractionOptions} />
                </Form.Item>

                <Form.Item label="图片" name="extraction_image">
                  <Select
                    options={[{ value: "cloud", label: "云端分析（必须）" }]}
                    disabled
                  />
                </Form.Item>
              </div>
            </div>
          )}

          {/* Prompt配置 */}
          {activeTab === 'prompt' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Prompt配置
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                配置AI分类和分析的Prompt模板。使用 {'{content}'} 作为文件内容占位符。
              </div>

              <Form.Item
                label="文件分类Prompt（按阶段）"
                name="classify_prompt_stages"
                initialValue={DEFAULT_CLASSIFY_PROMPT_STAGES}
              >
                <Input.TextArea
                  rows={8}
                  placeholder="请输入文件分类Prompt模板..."
                  style={{
                    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                />
              </Form.Item>

              <Form.Item
                label="文件分类Prompt（按内容）"
                name="classify_prompt_content"
                initialValue={DEFAULT_CLASSIFY_PROMPT_CONTENT}
              >
                <Input.TextArea
                  rows={8}
                  placeholder="请输入文件分类Prompt模板..."
                  style={{
                    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                />
              </Form.Item>

              <Form.Item
                label="项目分析Prompt"
                name="analyze_prompt"
                initialValue={DEFAULT_ANALYZE_PROMPT}
              >
                <Input.TextArea
                  rows={8}
                  placeholder="请输入项目分析Prompt模板..."
                  style={{
                    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                />
              </Form.Item>
            </div>
          )}
        </Form>
      </Spin>

      {/* 保存按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <Button
          icon={<UndoOutlined />}
          onClick={handleReset}
          loading={loading}
        >
          重置
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          保存配置
        </Button>
      </div>
    </div>
  );
}
