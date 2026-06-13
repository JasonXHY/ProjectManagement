import { Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024

interface UploadAreaProps {
  onUpload: (file: File) => void
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  return (
    <Dragger
      name="file"
      multiple={true}
      showUploadList={false}
      customRequest={({ file }) => {
        const f = file as unknown as File
        if (f.size > MAX_UPLOAD_SIZE) {
          message.warning('文件大小超过50MB，请压缩后上传')
          return
        }
        onUpload(f)
      }}
      style={{
        width: '100%',
        minHeight: '80px',
        border: '2px dashed #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        marginBottom: '20px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '12px', transition: 'all 200ms' }}>
        <InboxOutlined />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
        拖拽文件到此处，或点击上传
      </div>
      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
        AI 将自动识别文件内容并分类到对应阶段
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {['PDF', 'Word', 'Excel', 'PPT', 'TXT', 'MD'].map((format) => (
          <span
            key={format}
            style={{
              padding: '2px 8px',
              background: '#F3F4F6',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#9CA3AF',
              fontWeight: 500,
            }}
          >
            {format}
          </span>
        ))}
      </div>
    </Dragger>
  )
}