import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import PromptEditor from "./PromptEditor";
import { getConfig, saveConfig, resetConfig } from "../../services/configService";
import type { AppConfig } from "../../types";

const { Title, Text } = Typography;

/** SettingsPage 组件属性 */
interface SettingsPageProps {
  onBack: () => void;
}

/**
 * 设置页面
 * 包含AI配置和分类Prompt配置
 */
export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialValues, setInitialValues] = useState<AppConfig | null>(null);

  /** 加载配置 */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getConfig();
      setInitialValues(config);
      form.setFieldsValue(config);
    } catch (error) {
      message.error("加载配置失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /** 保存配置 */
  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      await saveConfig(values as AppConfig);
      message.success("配置已保存");
      setInitialValues(values as AppConfig);
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
      const config = await resetConfig();
      setInitialValues(config);
      form.setFieldsValue(config);
      message.success("已恢复默认配置");
    } catch (error) {
      message.error("恢复默认配置失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /** 检查是否有未保存的更改 */
  const hasChanges = () => {
    if (!initialValues) return false;
    const currentValues = form.getFieldsValue();
    return JSON.stringify(currentValues) !== JSON.stringify(initialValues);
  };

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
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
            disabled={!hasChanges()}
          >
            保存
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues || {}}
        >
          {/* AI配置区域 */}
          <Card title="AI 配置" className="mb-4 shadow-sm">
            <Text type="secondary" className="block mb-4">
              配置智谱AI接口参数，用于文件智能分类功能。
            </Text>
            <Form.Item
              name="zhipu_api_key"
              label="API Key"
              rules={[{ required: true, message: "请输入API Key" }]}
            >
              <Input.Password placeholder="请输入智谱AI的API Key" />
            </Form.Item>
            <Form.Item
              name="zhipu_api_url"
              label="API 端点"
              rules={[{ required: true, message: "请输入API端点" }]}
            >
              <Input placeholder="https://open.bigmodel.cn/api/paas/v4/chat/completions" />
            </Form.Item>
            <Form.Item
              name="model_name"
              label="模型名称"
              rules={[{ required: true, message: "请输入模型名称" }]}
            >
              <Input placeholder="glm-4-flash" />
            </Form.Item>
          </Card>

          {/* 分类Prompt配置区域 */}
          <Card title="分类 Prompt 配置" className="shadow-sm">
            <Text type="secondary" className="block mb-4">
              配置AI分类文件时使用的提示词，可使用变量动态替换内容。
            </Text>
            <Form.Item
              name="classification_prompt"
              label="分类提示词"
              rules={[{ required: true, message: "请输入分类提示词" }]}
            >
              <PromptEditor rows={10} />
            </Form.Item>
          </Card>
        </Form>
      </Spin>
    </div>
  );
}
