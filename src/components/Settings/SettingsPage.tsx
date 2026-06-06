import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Tabs,
  Typography,
  message,
  Spin,
  Space,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { configService } from "../../services/configService";
import {
  ZHIPU_PROVIDER,
  MIMO_PROVIDER,
  type AIProvider,
} from "../../types";

const { Title, Text } = Typography;

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
      // 清空所有字段
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
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回
          </Button>
          <SettingOutlined className="text-xl text-gray-600" />
          <Title level={3} className="!mb-0">
            设置
          </Title>
        </div>
        <Space>
          <Popconfirm
            title="确定恢复默认配置？"
            description="当前修改将丢失"
            onConfirm={handleReset}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<UndoOutlined />} loading={loading}>
              恢复默认
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: "ai",
                label: "AI模型配置",
                children: (
                  <Card>
                    <Text type="secondary" className="block mb-4">
                      配置AI模型供应商和接口参数，用于智能分析功能。
                    </Text>
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

                    <Form.Item
                      label="API Key"
                      name="ai_api_key"
                      rules={[{ required: true, message: "请输入API Key" }]}
                    >
                      <Input.Password placeholder="输入API Key" />
                    </Form.Item>

                    <Form.Item label="API地址" name="ai_base_url">
                      <Input
                        placeholder="API地址"
                        disabled={provider !== "custom"}
                      />
                    </Form.Item>
                  </Card>
                ),
              },
              {
                key: "extraction",
                label: "文件提取配置",
                children: (
                  <Card>
                    <Text type="secondary" className="block mb-4">
                      配置不同文件类型的提取方式。本地提取更快，云端分析更准确。
                    </Text>
                    <Form.Item label="TXT/MD文件" name="extraction_txt">
                      <Select options={extractionOptions} />
                    </Form.Item>

                    <Form.Item label="PDF（文字版）" name="extraction_pdf_text">
                      <Select options={extractionOptions} />
                    </Form.Item>

                    <Form.Item
                      label="PDF（扫描版）"
                      name="extraction_pdf_scanned"
                    >
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
                  </Card>
                ),
              },
            ]}
          />
        </Form>
      </Spin>
    </div>
  );
}
