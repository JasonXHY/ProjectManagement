import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Radio,
  message,
  Spin,
  Tag,
  Space,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  RobotOutlined,
  FileOutlined,
  EditOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { configService } from "../../services/configService";
import {
  USER_ROLE_OPTIONS,
  type AIProvider,
} from "../../types";
import {
  getProviderList,
  type AIModel,
} from "../../shared/model-registry";

/** SettingsPage 组件属性 */
interface SettingsPageProps {
  onBack: () => void;
}

const providerList = getProviderList()

/**
 * 设置页面
 * 包含AI模型配置和文件提取配置
 */
export default function SettingsPage(_props: SettingsPageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [models, setModels] = useState<AIModel[]>([]);
  const defaultStages = ['售前', '进行中', '关闭'];
  const [customStages, setCustomStages] = useState<string[]>(defaultStages);
  const [newStageName, setNewStageName] = useState('');

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
        if (result.data.custom_stages) {
          try {
            const parsed = JSON.parse(result.data.custom_stages);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCustomStages(parsed);
            }
          } catch {
            // JSON parse error, use default stages
          }
        }
      }
      
      const promptsResult = await configService.getPrompts();
      if (promptsResult.success && promptsResult.data) {
        form.setFieldsValue({
          classify_prompt_stages: promptsResult.data.classify_stages,
          classify_prompt_content: promptsResult.data.classify_content,
          analyze_prompt: promptsResult.data.analyze,
        });
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
      const result = await configService.update({ ...values, custom_stages: JSON.stringify(customStages) });
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
      setModels([]);
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
    const providerConfig = providerList.find((p) => p.id === value);
    if (providerConfig) {
      setModels(providerConfig.models);
      const firstModel = providerConfig.models[0];
      form.setFieldsValue({
        ai_model: firstModel?.id || "",
        ai_base_url: providerConfig.baseUrl,
      });
    }
  };

  /** 添加自定义阶段 */
  const handleAddStage = () => {
    if (newStageName && !customStages.includes(newStageName)) {
      setCustomStages([...customStages, newStageName]);
      setNewStageName('');
    }
  };

  /** 删除自定义阶段 */
  const handleDeleteStage = (stage: string) => {
    setCustomStages(customStages.filter(s => s !== stage));
  };

  /** 获取模型选项 */
  const getModelOptions = () => {
    return models.map((m) => ({
      value: m.id,
      label: m.isFree ? `${m.name} (免费)` : m.name,
    }));
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
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px',
            background: 'var(--bg-secondary)',
          }}
        >
          {[
            { key: 'ai', label: 'AI模型', icon: <RobotOutlined /> },
            { key: 'extraction', label: '文件提取', icon: <FileOutlined /> },
            { key: 'prompt', label: 'Prompt配置', icon: <EditOutlined /> },
            { key: 'role', label: '用户角色', icon: <UserOutlined /> },
            { key: 'stages', label: '自定义阶段', icon: <PlusOutlined /> },
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
                color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--text-secondary)',
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
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                AI模型配置
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                配置AI模型供应商和接口参数，用于智能分析功能。
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <Form.Item label="模型厂商" name="ai_provider">
                  <Select
                    onChange={handleProviderChange}
                    options={providerList.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                  />
                </Form.Item>

                <Form.Item label="AI模型" name="ai_model">
                  <Select options={getModelOptions()} />
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
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                文件提取配置
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
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
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Prompt配置
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                配置AI分类和分析的Prompt模板。使用 {'{content}'} 作为文件内容占位符。
              </div>

              <Form.Item
                label="文件分类Prompt（按阶段）"
                name="classify_prompt_stages"
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

          {/* 用户角色配置 */}
          {activeTab === 'role' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                用户角色
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                选择您的角色，后续将根据角色提供差异化的功能体验。
              </div>

              <Form.Item label="当前角色" name="user_role" initialValue="pm">
                <Radio.Group options={USER_ROLE_OPTIONS} />
              </Form.Item>
            </div>
          )}

          {/* 自定义阶段配置 */}
          {activeTab === 'stages' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                自定义阶段
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                管理项目的自定义阶段。这些阶段将用于文件分类和项目进度管理。
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <Input
                    placeholder="输入新阶段名称"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    onPressEnter={handleAddStage}
                    style={{ width: '200px' }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddStage}
                    disabled={!newStageName}
                  >
                    添加阶段
                  </Button>
                </Space>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {customStages.map((stage) => (
                  <Tag
                    key={stage}
                    closable
                    onClose={() => handleDeleteStage(stage)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '14px',
                      borderRadius: '6px',
                    }}
                  >
                    {stage}
                  </Tag>
                ))}
              </div>
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
