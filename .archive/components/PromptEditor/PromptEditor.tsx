import { useState, useEffect } from "react";
import { Input, Typography, Tag, Space, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

/** 可用的变量标签 */
const AVAILABLE_VARIABLES = [
  { key: "{{file_name}}", label: "文件名", description: "上传文件的名称" },
  { key: "{{file_type}}", label: "文件类型", description: "文件的扩展名类型" },
  { key: "{{project_name}}", label: "项目名", description: "当前项目的名称" },
  { key: "{{stage}}", label: "项目阶段", description: "项目当前所处阶段" },
];

/** PromptEditor 组件属性 */
interface PromptEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Prompt编辑器组件
 * 支持编辑分类prompt，可插入变量标签
 */
export default function PromptEditor({
  value = "",
  onChange,
  placeholder = "请输入分类提示词...",
  rows = 8,
}: PromptEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  /** 在光标位置插入变量 */
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector(
      ".prompt-editor-textarea textarea",
    ) as HTMLTextAreaElement | null;
    if (!textarea) {
      // 如果无法获取光标位置，直接追加到末尾
      const newValue = localValue + variable;
      setLocalValue(newValue);
      onChange?.(newValue);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue =
      localValue.substring(0, start) + variable + localValue.substring(end);
    setLocalValue(newValue);
    onChange?.(newValue);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div>
      {/* 变量标签栏 */}
      <div className="mb-2">
        <Space size="small" align="center">
          <Text type="secondary" className="text-sm">
            插入变量：
          </Text>
          {AVAILABLE_VARIABLES.map((v) => (
            <Tooltip key={v.key} title={v.description}>
              <Tag
                color="blue"
                className="cursor-pointer hover:opacity-80"
                onClick={() => insertVariable(v.key)}
              >
                {v.label}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      </div>

      {/* 编辑器 */}
      <TextArea
        className="prompt-editor-textarea"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={{ fontFamily: "monospace" }}
      />

      {/* 提示信息 */}
      <div className="mt-2">
        <Paragraph type="secondary" className="!mb-0 text-xs">
          <InfoCircleOutlined className="mr-1" />
          提示：点击上方标签可插入变量，AI会根据此提示词对文件进行分类。
        </Paragraph>
      </div>
    </div>
  );
}
