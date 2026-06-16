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
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  RobotOutlined,
  FileOutlined,
  EditOutlined,
  UserOutlined,
  PlusOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { configService } from "../../services/configService";
import {
  USER_ROLE_OPTIONS,
  type AIProvider,
} from "../../types";
import {
  getDefaultSubcategoryMap,
  parseSubcategoryConfig,
  serializeSubcategoryConfig,
  addSubcategory,
  removeSubcategory,
  isDefaultSubcategory,
  type SubcategoryMap,
} from "../../../electron/shared/subcategory-config";
import {
  getProviderList,
  getFullApiUrl,
  type AIModel,
} from "@shared/model-registry";

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
  const [isBuiltinApiKey, setIsBuiltinApiKey] = useState(false);
  const defaultStages = ['售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭'];
  const [customStages, setCustomStages] = useState<string[]>(defaultStages);
  const [newStageName, setNewStageName] = useState('');
  const [subcategoryMap, setSubcategoryMap] = useState<SubcategoryMap>(getDefaultSubcategoryMap());
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});

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
        // 加载自定义子分类配置（null/非法时回退默认）
        setSubcategoryMap(parseSubcategoryConfig(result.data.custom_subcategories));
        // 检测是否为内置API Key（内测版）
        if (result.data.ai_provider === 'xiaomi' && result.data.ai_model === 'mimo-v2.5') {
          setIsBuiltinApiKey(true);
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

      if (result.data?.ai_provider) {
        handleProviderChange(result.data.ai_provider as AIProvider);
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

    // 剔除未改动的API Key掩码字段，防止覆盖真实Key
    const SECRET_FIELDS = ['ai_api_key', 'classify_api_key', 'zhipu_api_key', 'mimo_api_key'] as const;
    for (const f of SECRET_FIELDS) {
      if (values[f] === 'sk-***' || values[f] === undefined) {
        delete values[f];
      }
    }

    setSaving(true);
    try {
      const result = await configService.update({
        ...values,
        custom_stages: JSON.stringify(customStages),
        custom_subcategories: serializeSubcategoryConfig(subcategoryMap),
      });
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
    await loadSettings();
    message.success("已恢复到保存的配置");
  };

  /** 供应商切换 */
  const handleProviderChange = (value: AIProvider) => {
    const providerConfig = providerList.find((p) => p.id === value);
    if (providerConfig) {
      const availableModels = providerConfig.models.filter(m => !m.deprecated);
      setModels(availableModels.length > 0 ? availableModels : providerConfig.models);

      const currentModel = form.getFieldValue('ai_model');
      const modelExists = availableModels.some(m => m.id === currentModel);
      const billingMode = form.getFieldValue('ai_billing_mode') || 'paygo';
      const url = billingMode === 'custom'
        ? ''
        : getFullApiUrl(value, billingMode as 'paygo' | 'token_plan' | 'coding_plan')
            .replace(/\/v1\/chat\/completions$/, '');

      if (modelExists) {
        form.setFieldsValue({ ai_base_url: url });
      } else {
        const firstModel = availableModels[0] || providerConfig.models[0];
        form.setFieldsValue({
          ai_model: firstModel?.id || "",
          ai_base_url: url,
        });
      }
    }
  };

  /** 计费模式切换 */
  const handleBillingModeChange = (mode: string) => {
    const provider = form.getFieldValue('ai_provider');
    if (mode === 'custom') {
      form.setFieldsValue({ ai_base_url: '' });
    } else {
      const url = getFullApiUrl(provider, mode as 'paygo' | 'token_plan' | 'coding_plan')
        .replace(/\/v1\/chat\/completions$/, '');
      form.setFieldsValue({ ai_base_url: url });
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

  /** 新增子分类 */
  const handleAddSubcategory = (stage: string) => {
    const name = (newSubInputs[stage] || '').trim();
    if (!name) return;
    setSubcategoryMap((prev) => addSubcategory(prev, stage, name));
    setNewSubInputs((prev) => ({ ...prev, [stage]: '' }));
  };

  /** 删除子分类（默认子分类不可删除） */
  const handleDeleteSubcategory = (stage: string, sub: string) => {
    setSubcategoryMap((prev) => removeSubcategory(prev, stage, sub));
  };

  /** 获取模型选项 */
  const getModelOptions = () => {
    return models.map((m) => {
      let label = m.name;
      if (m.isFree) label += ' (免费)';
      if (m.deprecated) label += ' [已废弃]';
      return {
        value: m.id,
        label,
        disabled: m.deprecated,
      };
    });
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
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1)',
            marginBottom: 'var(--space-6)',
            background: 'var(--bg-secondary)',
          }}
        >
          {[
            { key: 'ai', label: 'AI模型', icon: <RobotOutlined /> },
            { key: 'extraction', label: '文件提取', icon: <FileOutlined /> },
            { key: 'storage', label: '存储设置', icon: <FolderOutlined /> },
            { key: 'prompt', label: 'Prompt配置', icon: <EditOutlined /> },
            { key: 'role', label: '用户角色', icon: <UserOutlined /> },
            { key: 'stages', label: '文件分类管理', icon: <PlusOutlined /> },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all var(--transition-fast)',
                background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
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
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
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
                rules={[{ required: !isBuiltinApiKey, message: "请输入API Key" }]}
                extra={isBuiltinApiKey ? "内测版已内置API Key，不可编辑" : undefined}
              >
                <Input.Password
                  placeholder={isBuiltinApiKey ? "内测版已内置" : "输入API Key"}
                  readOnly={isBuiltinApiKey}
                  disabled={isBuiltinApiKey}
                  onCopy={(e) => isBuiltinApiKey && e.preventDefault()}
                  onCut={(e) => isBuiltinApiKey && e.preventDefault()}
                  onPaste={(e) => isBuiltinApiKey && e.preventDefault()}
                  onContextMenu={(e) => isBuiltinApiKey && e.preventDefault()}
                  onKeyDown={(e) => {
                    if (isBuiltinApiKey) {
                      // 阻止 Ctrl+C, Ctrl+A, Ctrl+X 等
                      if (e.ctrlKey && ['c', 'a', 'x'].includes(e.key.toLowerCase())) {
                        e.preventDefault();
                      }
                    }
                  }}
                  style={isBuiltinApiKey ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : undefined}
                />
              </Form.Item>

              <Form.Item label="计费模式" name="ai_billing_mode">
                <Radio.Group onChange={(e) => handleBillingModeChange(e.target.value)}>
                  <Radio value="paygo">按量计费</Radio>
                  <Radio value="token_plan">Token Plan</Radio>
                  <Radio value="custom">自定义URL</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="API地址" name="ai_base_url">
                <Input
                  placeholder="API地址"
                  disabled={form.getFieldValue('ai_billing_mode') !== 'custom'}
                  style={form.getFieldValue('ai_billing_mode') !== 'custom' ? { backgroundColor: '#f5f5f5' } : undefined}
                />
              </Form.Item>
            </div>
          )}

          {/* 文件提取配置 */}
          {activeTab === 'extraction' && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
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

          {/* 存储设置 */}
          {activeTab === 'storage' && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                存储设置
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                配置项目文件的存储位置。新创建的项目将使用此路径。
              </div>

              <Form.Item
                label="项目存储路径"
                name="project_storage_path"
                extra="留空则使用默认路径（用户数据目录下的projects文件夹）"
              >
                <Input
                  placeholder="留空使用默认路径"
                  addonAfter={
                    <Button
                      type="text"
                      icon={<FolderOutlined />}
                      onClick={async () => {
                        const result = await window.api.settings.browseFolder()
                        if (result.success && result.data) {
                          form.setFieldsValue({ project_storage_path: result.data })
                        }
                      }}
                    >
                      浏览
                    </Button>
                  }
                />
              </Form.Item>
            </div>
          )}

          {/* Prompt配置 */}
          {activeTab === 'prompt' && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
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
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
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
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                文件分类管理
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                管理文件分类阶段。新增的分类阶段将用于AI自动分类，可自定义阶段名称。项目阶段（售前/进行中/关闭）由系统自动管理，不在此处配置。
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <Input
                    placeholder="输入新分类阶段名称"
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
                    添加分类阶段
                  </Button>
                </Space>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {customStages.map((stage) => (
                  <Tooltip key={stage} title={defaultStages.includes(stage) ? '默认阶段不可删除' : ''}>
                    <Tag
                      closable={!defaultStages.includes(stage)}
                      onClose={() => handleDeleteStage(stage)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '14px',
                        borderRadius: '6px',
                      }}
                    >
                      {stage}
                    </Tag>
                  </Tooltip>
                ))}
              </div>

              {/* 子分类管理（每个阶段下的子分类，默认子分类不可删除） */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  子分类管理
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  为每个分类阶段管理子分类（按文档用途划分）。默认子分类不可删除，自定义子分类可删除。
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {customStages.map((stage) => (
                    <div
                      key={stage}
                      data-testid={`subcat-stage-${stage}`}
                      style={{
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{stage}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {(subcategoryMap[stage] || []).map((sub) => {
                          const isDefault = isDefaultSubcategory(stage, sub);
                          return (
                            <Tooltip key={sub} title={isDefault ? '默认子分类不可删除' : ''}>
                              <Tag
                                closable={!isDefault}
                                onClose={() => handleDeleteSubcategory(stage, sub)}
                                style={{ padding: '2px 10px', fontSize: '13px', borderRadius: '6px' }}
                              >
                                {sub}
                              </Tag>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <Space>
                        <Input
                          size="small"
                          placeholder="新增子分类"
                          value={newSubInputs[stage] || ''}
                          onChange={(e) => setNewSubInputs((prev) => ({ ...prev, [stage]: e.target.value }))}
                          onPressEnter={() => handleAddSubcategory(stage)}
                          style={{ width: '160px' }}
                        />
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddSubcategory(stage)}
                          disabled={!(newSubInputs[stage] || '').trim()}
                        >
                          添加
                        </Button>
                      </Space>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Form>
      </Spin>

      {/* 保存按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
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
