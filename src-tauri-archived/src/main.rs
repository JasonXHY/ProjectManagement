// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::panic;
use std::thread;

fn main() {
    // 设置panic处理器，记录panic信息
    panic::set_hook(Box::new(|info| {
        let thread = thread::current();
        let thread_name = thread.name().unwrap_or("unknown");
        let location = info.location().map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column())).unwrap_or_else(|| "unknown".to_string());
        let payload = info.payload().downcast_ref::<&str>().unwrap_or(&"unknown error");

        eprintln!("[PANIC] Thread: {}, Location: {}, Payload: {}", thread_name, location, payload);

        // 尝试获取完整的backtrace
        let backtrace = std::backtrace::Backtrace::capture();
        eprintln!("[PANIC] Backtrace:\n{:?}", backtrace);
    }));

    my_tauri_app_lib::run()
}
