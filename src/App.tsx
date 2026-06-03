import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, Input, Card, Space, Typography, Layout } from "antd";
import { ProjectOutlined, RobotOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="flex items-center bg-white shadow-sm px-6">
        <div className="flex items-center gap-3">
          <RobotOutlined className="text-xl text-blue-500" />
          <Title level={4} className="!mb-0 !text-gray-800">
            AI Project Manager
          </Title>
        </div>
      </Header>
      <Content className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 shadow-sm">
            <div className="text-center py-12">
              <ProjectOutlined className="text-6xl text-blue-400 mb-4" />
              <Title level={2}>Welcome to AI Project Manager</Title>
              <Text type="secondary" className="text-lg">
                A lightweight AI-powered project management tool built with
                Tauri + React + TypeScript
              </Text>
            </div>
          </Card>

          <Card title="Quick Start" className="shadow-sm">
            <Space direction="vertical" className="w-full" size="middle">
              <Text>Enter your name to get started:</Text>
              <Space.Compact className="w-full max-w-md">
                <Input
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onPressEnter={greet}
                />
                <Button type="primary" onClick={greet}>
                  Greet
                </Button>
              </Space.Compact>
              {greetMsg && (
                <Card size="small" className="bg-blue-50 border-blue-200">
                  <Text strong>{greetMsg}</Text>
                </Card>
              )}
            </Space>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
