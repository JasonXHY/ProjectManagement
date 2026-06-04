use std::path::Path;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

/// 验证路径组件是否安全（防止路径遍历攻击）
///
/// 拒绝包含 `..`、`/` 或 `\\` 的路径组件
fn validate_path_component(component: &str) -> Result<(), String> {
    if component.contains("..") || component.contains('/') || component.contains('\\') {
        return Err(format!("非法路径组件: {}", component));
    }
    if component.is_empty() {
        return Err("路径组件不能为空".to_string());
    }
    Ok(())
}

/// 保存文件到磁盘（使用绝对路径）
///
/// # Arguments
/// * `app_data_dir` - 应用数据目录（绝对路径）
/// * `project_name` - 项目名称
/// * `stage` - 项目阶段
/// * `file_name` - 文件名
/// * `content_base64` - base64编码的文件内容
///
/// # Returns
/// 文件保存的绝对路径
pub fn save_file(
    app_data_dir: &Path,
    project_name: &str,
    stage: &str,
    file_name: &str,
    content_base64: &str,
) -> Result<String, String> {
    // 解码base64内容
    let content = BASE64.decode(content_base64)
        .map_err(|e| format!("base64解码失败: {}", e))?;

    // 验证路径组件，防止路径遍历攻击
    validate_path_component(project_name)?;
    validate_path_component(stage)?;
    validate_path_component(file_name)?;

    // 构建绝对文件路径: app_data_dir/projects/{project_name}/{stage}/{file_name}
    let file_path = app_data_dir
        .join("projects")
        .join(project_name)
        .join(stage)
        .join(file_name);

    // 确保目录存在
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }

    // 写入文件
    std::fs::write(&file_path, &content)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    let path_str = file_path.to_string_lossy().to_string();
    eprintln!("[FILE_STORAGE] 保存文件: {}", path_str);

    Ok(path_str)
}

/// 读取文件内容（base64编码）
pub fn read_file(file_path: &Path) -> Result<String, String> {
    let content = std::fs::read(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    Ok(BASE64.encode(&content))
}

/// 检查文件是否存在
pub fn file_exists(file_path: &Path) -> bool {
    file_path.exists()
}

/// 删除文件（幂等操作：文件不存在时记录日志但不报错）
pub fn delete_file(file_path: &Path) -> Result<(), String> {
    if file_path.exists() {
        std::fs::remove_file(file_path)
            .map_err(|e| format!("删除文件失败: {}", e))?;
        eprintln!("[FILE_STORAGE] 已删除文件: {}", file_path.display());
    } else {
        eprintln!("[FILE_STORAGE] 文件不存在，跳过删除: {}", file_path.display());
    }
    Ok(())
}
