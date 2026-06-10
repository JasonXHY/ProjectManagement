import React, { useState } from 'react';
import { Button, Input, Select, Tag, Table, Menu, Upload, Modal, Card, Tabs, Radio, Checkbox, Switch, Badge, Pagination, Alert, Message, Empty } from 'antd';
import { InboxOutlined, UploadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SearchOutlined, SettingOutlined, RobotOutlined, MessageOutlined, ArrowLeftOutlined, PlusOutlined, FolderOpenOutlined, ReloadOutlined, ClearOutlined, SendOutlined, PaperClipOutlined, UserOutlined, FundOutlined, RocketOutlined, FileSearchOutlined, SolutionOutlined, ToolOutlined, ExperimentOutlined, CloudUploadOutlined, CheckCircleOutlined, TeamOutlined, FolderOutlined, AppstoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const StyleTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [radioValue, setRadioValue] = useState(1);
  const [switchValue, setSwitchValue] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const tableColumns = [
    { title: '文件名', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '操作', key: 'action', render: () => <Button type="link" size="small">删除</Button> },
  ];

  const tableData = [
    { key: '1', name: '系统架构设计文档 v2.1.pdf', category: '构建', size: '2.4 MB' },
    { key: '2', name: '需求规格说明书.docx', category: '需求', size: '856 KB' },
    { key: '3', name: '测试用例清单.xlsx', category: '测试', size: '340 KB' },
  ];

  const menuItems = [
    { key: '1', icon: <AppstoreOutlined />, label: '所有文件', children: [
      { key: '1-1', icon: <FundOutlined />, label: '售前', children: [{ key: '1-1-1', label: '文件1' }] },
      { key: '1-2', icon: <RocketOutlined />, label: '启动' },
      { key: '1-3', icon: <FileSearchOutlined />, label: '需求' },
      { key: '1-4', icon: <SolutionOutlined />, label: '方案' },
      { key: '1-5', icon: <ToolOutlined />, label: '构建' },
      { key: '1-6', icon: <ExperimentOutlined />, label: '测试' },
      { key: '1-7', icon: <CloudUploadOutlined />, label: '上线' },
      { key: '1-8', icon: <CheckCircleOutlined />, label: '验收' },
      { key: '1-9', icon: <TeamOutlined />, label: '转客户成功' },
      { key: '1-10', icon: <FolderOutlined />, label: '关闭' },
    ] },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 600 }}>样式验证页</h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="按钮样式" key="buttons">
          <Card title="按钮样式验证" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button type="primary">主按钮</Button>
              <Button>次按钮</Button>
              <Button type="text">文字按钮</Button>
              <Button danger>危险按钮</Button>
              <Button disabled>禁用按钮</Button>
              <Button loading>加载中</Button>
              <Button icon={<SearchOutlined />}>带图标</Button>
              <Button type="primary" icon={<PlusOutlined />}>新建项目</Button>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button size="small">小按钮</Button>
              <Button size="small" type="primary">小主按钮</Button>
              <Button size="small" icon={<DeleteOutlined />}>小图标按钮</Button>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="输入框样式" key="inputs">
          <Card title="输入框样式验证" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <Input placeholder="默认输入框" />
              <Input placeholder="带前缀" prefix={<SearchOutlined />} />
              <Input placeholder="带后缀" suffix={<EyeOutlined />} />
              <Input.Password placeholder="密码输入框" />
              <TextArea placeholder="文本域" rows={4} />
              <Select placeholder="请选择" style={{ width: '100%' }}>
                <Option value="option1">选项1</Option>
                <Option value="option2">选项2</Option>
                <Option value="option3">选项3</Option>
              </Select>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="标签样式" key="tags">
          <Card title="标签样式验证" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Tag color="warning">售前</Tag>
              <Tag color="success">启动</Tag>
              <Tag color="processing">需求</Tag>
              <Tag color="purple">方案</Tag>
              <Tag color="magenta">构建</Tag>
              <Tag color="error">测试</Tag>
              <Tag color="success">上线</Tag>
              <Tag color="error">验收</Tag>
              <Tag>转客户成功</Tag>
              <Tag>关闭</Tag>
              <Tag>未分类</Tag>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Tag>默认标签</Tag>
              <Tag color="blue">蓝色标签</Tag>
              <Tag color="green">绿色标签</Tag>
              <Tag color="red">红色标签</Tag>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="表格样式" key="table">
          <Card title="表格样式验证" style={{ marginBottom: '24px' }}>
            <Table columns={tableColumns} dataSource={tableData} pagination={false} />
          </Card>
        </TabPane>

        <TabPane tab="菜单样式" key="menu">
          <Card title="菜单样式验证" style={{ marginBottom: '24px' }}>
            <div style={{ width: '200px', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px' }}>
              <Menu
                mode="inline"
                defaultSelectedKeys={['1-5']}
                defaultOpenKeys={['1']}
                items={menuItems}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="上传样式" key="upload">
          <Card title="上传样式验证" style={{ marginBottom: '24px' }}>
            <Dragger
              name="file"
              multiple={true}
              action="https://www.mocky.io/v2/5cc8069c300000980a055e76"
              style={{ marginBottom: '16px' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">拖拽文件到此处，或点击上传</p>
              <p className="ant-upload-hint">AI 将自动识别文件内容并分类到对应阶段</p>
              <div style={{ marginTop: '10px' }}>
                <Tag>PDF</Tag>
                <Tag>Word</Tag>
                <Tag>Excel</Tag>
                <Tag>PPT</Tag>
                <Tag>TXT</Tag>
                <Tag>MD</Tag>
              </div>
            </Dragger>
          </Card>
        </TabPane>

        <TabPane tab="抽屉样式" key="drawer">
          <Card title="抽屉样式验证" style={{ marginBottom: '24px' }}>
            <Button type="primary" onClick={() => setModalVisible(true)}>
              打开抽屉
            </Button>
            <Modal
              title="抽屉预览"
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={null}
              width={240}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: '16px' }}>
                <p>这是一个抽屉预览</p>
                <p>宽度：240px</p>
                <p>从右侧弹出</p>
              </div>
            </Modal>
          </Card>
        </TabPane>

        <TabPane tab="其他组件" key="others">
          <Card title="其他组件样式验证" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ marginBottom: '8px' }}>Radio 组：</p>
                <Radio.Group onChange={e => setRadioValue(e.target.value)} value={radioValue}>
                  <Radio value={1}>选项一</Radio>
                  <Radio value={2}>选项二</Radio>
                  <Radio value={3}>选项三</Radio>
                </Radio.Group>
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Checkbox：</p>
                <Checkbox>复选框</Checkbox>
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Switch：</p>
                <Switch checked={switchValue} onChange={setSwitchValue} />
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Badge：</p>
                <Badge count={5}>
                  <Button>带徽标</Button>
                </Badge>
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Pagination：</p>
                <Pagination current={1} total={50} pageSize={10} />
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Alert：</p>
                <Alert message="信息提示" type="info" style={{ marginBottom: '8px' }} />
                <Alert message="成功提示" type="success" style={{ marginBottom: '8px' }} />
                <Alert message="警告提示" type="warning" style={{ marginBottom: '8px' }} />
                <Alert message="错误提示" type="error" />
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}>Empty：</p>
                <Empty description="暂无数据" />
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StyleTest;
