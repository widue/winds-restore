export interface ErrorCodeEntry { code: string; description: string; cause: string; }

export const ERROR_CODES: ErrorCodeEntry[] = [
  // 运行库 / DLL 相关
  { code: "0xc000007b", description: "应用程序无法正常启动", cause: "VC++ 运行库缺失/混装、显卡驱动未安装、DirectX 缺失" },
  { code: "0xc0000005", description: "访问违规（内存访问冲突）", cause: "内存损坏、杀毒拦截、兼容性设置、驱动冲突" },
  { code: "0xc0000142", description: "DLL 初始化失败", cause: "VC++ 运行库损坏、系统文件损坏、Windows Update 不完整" },
  { code: "126", description: "找不到指定的模块", cause: "DLL 文件缺失、PATH 环境变量错误、系统文件损坏" },
  { code: "127", description: "找不到指定的程序入口点", cause: "DLL 版本不匹配（如 x86/x64 混用）、文件损坏" },
  { code: "0x00007b", description: "INACCESSIBLE_BOOT_DEVICE", cause: "磁盘控制器驱动错误、BIOS AHCI/RAID 模式切换" },
  { code: "0xc0000135", description: "无法找到 .NET Framework", cause: ".NET 运行时未安装、版本不匹配" },

  // 安装类错误码
  { code: "80070643", description: "更新安装失败 / .NET 安装失败", cause: "系统文件损坏、Windows Installer 损坏、磁盘空间不足" },
  { code: "80070642", description: "用户取消或权限不足", cause: "权限不足、防病毒拦截、UAC 阻止" },
  { code: "0x800f0831", description: "组件存储（CBS）损坏", cause: "Windows 组件存储损坏，需 DISM /RestoreHealth" },
  { code: "0x800F0950", description: ".NET 3.5 启用失败", cause: "组策略限制、Windows Update 禁用、WSUS 托管" },
  { code: "0x800F0954", description: ".NET 3.5 启用失败（域环境）", cause: "WSUS 策略、组策略限制、指定了备用源路径" },
  { code: "0x80070002", description: "系统找不到指定的文件", cause: "安装源缺失、Windows 模块安装器找不到文件" },
  { code: "0x80070005", description: "访问被拒绝（权限不足）", cause: "注册表权限、文件权限、UAC 限制" },
  { code: "0x80070020", description: "进程正在访问文件", cause: "杀毒软件锁定、其他程序占用文件" },
  { code: "0x8007007e", description: "找不到指定的模块", cause: "系统环境变量问题、DLL 搜索路径错误" },
  { code: "0x80190001", description: "Windows Update 网络错误", cause: "代理设置、DNS 解析、防火墙拦截、TLS 版本" },
  { code: "0x81f40001", description: "VC++ 安装失败", cause: "已有更高版本、系统文件损坏、杀毒拦截" },
  { code: "Error 1935", description: "程序集安装失败", cause: "CBS 存储损坏、.NET 安装不一致、杀毒软件干预" },
  { code: "Error 1714", description: "旧版产品卸载失败", cause: "安装记录损坏、注册表残留" },
  { code: "0x80080005", description: "服务器运行失败", cause: "Windows Installer 服务未启动、权限不足" },
  { code: "0x800701b1", description: "设备未就绪", cause: "光盘/USB 驱动器未插入、网络驱动器离线" },
  { code: "0x80004002", description: "不支持此接口", cause: "COM 组件未注册、组件版本不匹配" },
  { code: "0x80004005", description: "未指定的错误", cause: "通用 COM 错误、权限不足、组件损坏" },

  // 游戏 / DirectX 相关
  { code: "0x887a0005", description: "DXGI 设备挂起", cause: "显卡驱动崩溃、超频不稳定、显存不足" },
  { code: "0x887a0022", description: "DXGI 设备已移除", cause: "显卡驱动重置、显卡过热、电源不足" },
  { code: "0x8876086a", description: "DirectX 功能不可用", cause: "显卡驱动太旧、显卡不支持该 DirectX 特性" },
  { code: "DXGI_ERROR_INVALID_CALL", description: "DirectX 无效调用", cause: "显卡驱动问题、游戏渲染设置异常" },
  { code: "E_OUTOFMEMORY", description: "内存不足（包括显存）", cause: "物理内存不足、虚拟内存不足、显存溢出" },
  { code: "0xc000001d", description: "非法指令", cause: "CPU 不支持该指令集（如 SSE4、AVX）、CPU 太老" },
  { code: "0xc000001e", description: "不支持的指令", cause: "CPU 太旧、需要 SSE2 等新指令集" },
  { code: "0xc0000094", description: "整数除法溢出", cause: "游戏/软件 bug、CPU 稳定性问题" },
  { code: "0xc0000008", description: "句柄无效", cause: "系统文件损坏、软件崩溃、杀毒拦截" },

  // 网络 / 连接相关
  { code: "0x800704cf", description: "无法访问网络位置", cause: "网络连接中断、防火墙阻止、网络驱动器离线" },
  { code: "0x80072efd", description: "服务器连接失败", cause: "代理设置、时间不正确、TLS 版本不足" },
  { code: "0x80072f76", description: "安全通道错误", cause: "系统时间不准确、证书过期" },
  { code: "0x80072f8f", description: "证书吊销检查失败", cause: "无法访问吊销服务器、网络受限" },

  // 显卡 / 驱动
  { code: "0x00000116", description: "蓝屏：显卡驱动崩溃", cause: "显卡驱动过旧/损坏、显卡过热、超频不稳" },
  { code: "0x00000124", description: "蓝屏：硬件错误", cause: "CPU/RAM 不稳定、超频、过热、电压不足" },
  { code: "0x00000050", description: "蓝屏：页面错误", cause: "内存故障、驱动 bug、磁盘错误" },
  { code: "0x000000d1", description: "蓝屏：驱动访问错误", cause: "网卡/磁盘/显卡驱动兼容问题" },
  { code: "0x0000007b", description: "蓝屏：无法访问启动设备", cause: "磁盘控制器驱动错误、BIOS 设置" },

  // Windows 功能
  { code: "0x800f0900", description: "Windows 功能启用失败", cause: "组件存储损坏、源文件缺失" },
  { code: "0x800f0907", description: "功能启用被组策略阻止", cause: "组策略限制、WSUS 托管" },
  { code: "0x800f0922", description: "功能安装失败", cause: "磁盘空间不足、下载失败、组件损坏" },
  { code: "0x800f081f", description: "源文件找不到", cause: "Windows 功能安装缺失源文件" },
  { code: "0x800f020b", description: "CBS 存储损坏", cause: "组件存储损坏，需 DISM /RestoreHealth" },

  // Steam / 游戏平台
  { code: "Steam 错误 53", description: "Steam 初始化失败", cause: "Steam 未运行、兼容性设置、管理员权限" },
  { code: "Steam 错误 80", description: "Steam 连接超时", cause: "网络代理、防火墙、Steam 认证服务器" },
  { code: "Epic 错误 LS-0006", description: "Epic 登录失败", cause: "网络代理、DNS、防火墙" },
  { code: "Epic 错误 AS-0003", description: "Epic 服务连接失败", cause: "代理设置、时间不正确" },
  { code: "Xbox 错误 0x80070490", description: "Xbox 登录失败", cause: "微软账户问题、Xbox 服务离线" },
];
