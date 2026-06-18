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
        minHeight: '64px',
        maxHeight: '80px',
        border: '2px dashed #E5E7EB',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        marginBottom: '12px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '20px', color: '#D1D5DB' }}>
          <InboxOutlined />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
          拖拽文件到此处，或点击上传
        </span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {['PDF', 'Word', 'Excel'].map((format) => (
            <span
              key={format}
              style={{
                padding: '1px 4px',
                background: '#F3F4F6',
                borderRadius: '3px',
                fontSize: '9px',
                color: '#9CA3AF',
                fontWeight: 500,
              }}
            >
              {format}
            </span>
          ))}
        </div>
      </div>
    </Dragger>
  )
}