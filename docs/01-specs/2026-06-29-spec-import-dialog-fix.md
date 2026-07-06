## ImportDialog 弹窗尺寸修复方案

**文件**：`src/components/Handover/ImportDialog.tsx`

**问题**：Modal 没有高度约束，`Upload.Dragger` 上传区域默认撑满可用空间，导致弹窗高度过大，视觉比例失调。调整为固定尺寸后拖拽区域又过小，需要找到合适的平衡点。

---

### 修改点 1：Modal 增加 body 高度约束

在第 161 行的 `<Modal` 标签上增加 `styles` 属性：

```tsx
<Modal
  title="导入转交项目"
  open={open}
  onCancel={onClose}
  width={500}
  styles={{
    body: { maxHeight: '480px', overflow: 'auto' }
  }}
  footer={
    preview ? (
      <Space>
        <Button onClick={onClose}>取消</Button>
        <Button
          type="primary"
          loading={importing}
          onClick={handleImport}
        >
          确认导入
        </Button>
      </Space>
    ) : null
  }
>
  {renderContent()}
</Modal>
```

### 修改点 2：Dragger 上传区域固定高度

将第 108-121 行的 Dragger 改为：

```tsx
<Dragger
  accept=".zip"
  showUploadList={false}
  beforeUpload={handleBeforeUpload}
  style={{
    padding: '32px 0',
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">点击或拖拽 .pmaer.zip 文件到此处</p>
</Dragger>
```

---

### 预期效果

- 弹窗宽度保持 500px 不变
- 弹窗内容区最大高度 480px，超出可滚动
- 上传区域固定 320px 高度，图标和文字居中显示，拖拽操作舒适
- 整体视觉协调，既有足够的拖拽空间，又不会撑满屏幕
