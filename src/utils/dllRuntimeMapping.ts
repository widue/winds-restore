export interface RuntimeMapping {
  runtimeId: string;
  runtimeName: string;
  category: string;
}

const DLL_RUNTIME_MAP: Record<string, RuntimeMapping> = {};

function addMapping(dllNames: string[], runtimeId: string, runtimeName: string, category: string) {
  dllNames.forEach(name => {
    DLL_RUNTIME_MAP[name.toLowerCase()] = { runtimeId, runtimeName, category };
  });
}

addMapping(
  [
    "msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll", "vcruntime140_clr0400.dll",
    "msvcp140_1.dll", "msvcp140_2.dll", "msvcp140_atomic_wait.dll", "msvcp140_codecvt_ids.dll",
    "vcomp140.dll", "concrt140.dll", "vccorlib140.dll", "mfc140.dll", "mfc140u.dll",
    "mfcm140.dll", "atl140.dll", "ucrtbase.dll",
    "api-ms-win-crt-runtime-l1-1-0.dll", "api-ms-win-crt-stdio-l1-1-0.dll",
    "api-ms-win-crt-math-l1-1-0.dll", "api-ms-win-crt-string-l1-1-0.dll",
    "api-ms-win-crt-heap-l1-1-0.dll", "api-ms-win-crt-convert-l1-1-0.dll",
    "api-ms-win-crt-locale-l1-1-0.dll", "api-ms-win-crt-filesystem-l1-1-0.dll",
    "api-ms-win-crt-time-l1-1-0.dll", "api-ms-win-crt-environment-l1-1-0.dll",
    "api-ms-win-crt-utility-l1-1-0.dll", "api-ms-win-crt-multibyte-l1-1-0.dll",
  ],
  "vcredist-2022-x64",
  "VC++ 2015-2022 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  ["msvcr120.dll", "msvcp120.dll", "vcomp120.dll", "mfc120.dll", "mfc120u.dll", "atl120.dll", "mfcm120.dll"],
  "vcredist-2013-x64",
  "VC++ 2013 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  ["msvcr110.dll", "msvcp110.dll", "vcomp110.dll", "mfc110.dll", "mfc110u.dll", "atl110.dll"],
  "vcredist-2012-x64",
  "VC++ 2012 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  ["msvcr100.dll", "msvcp100.dll", "vcomp100.dll", "mfc100.dll", "mfc100u.dll", "atl100.dll"],
  "vcredist-2010-x64",
  "VC++ 2010 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  ["msvcr90.dll", "msvcp90.dll", "vcomp90.dll", "mfc90.dll", "mfc90u.dll", "atl90.dll", "msvcm90.dll"],
  "vcredist-2008-x64",
  "VC++ 2008 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  ["msvcr80.dll", "msvcp80.dll", "vcomp80.dll", "mfc80.dll", "mfc80u.dll", "atl80.dll", "msvcm80.dll"],
  "vcredist-2005-x64",
  "VC++ 2005 运行库 (x64)",
  "VC++ 运行库"
);

addMapping(
  [
    "d3dx9_43.dll", "d3dx9_42.dll", "d3dx9_41.dll", "d3dx9_40.dll", "d3dx9_39.dll",
    "d3dx9_38.dll", "d3dx9_37.dll", "d3dx9_36.dll", "d3dx9_35.dll", "d3dx9_34.dll",
    "d3dx9_33.dll", "d3dx9_32.dll", "d3dx9_31.dll", "d3dx9_30.dll", "d3dx9_29.dll",
    "d3dx9_28.dll", "d3dx9_27.dll", "d3dx9_26.dll", "d3dx9_25.dll", "d3dx9_24.dll",
    "d3dx10_43.dll", "d3dx10_42.dll", "d3dx10_41.dll", "d3dx10_40.dll", "d3dx10_39.dll",
    "d3dx10_38.dll", "d3dx10_37.dll", "d3dx10_36.dll", "d3dx10_35.dll", "d3dx10_34.dll",
    "d3dx10_33.dll", "d3dx11_43.dll", "d3dx11_42.dll",
    "d3dcsx_43.dll", "d3dcsx_42.dll",
    "d3dcompiler_47.dll", "d3dcompiler_46.dll", "d3dcompiler_45.dll", "d3dcompiler_44.dll",
    "d3dcompiler_43.dll", "d3dcompiler_42.dll",
    "xinput1_4.dll", "xinput1_3.dll", "xinput1_2.dll", "xinput1_1.dll", "xinput9_1_0.dll",
    "xaudio2_9.dll", "xaudio2_8.dll", "xaudio2_7.dll", "xaudio2_6.dll", "xaudio2_5.dll",
    "xaudio2_4.dll", "xaudio2_3.dll", "xaudio2_2.dll", "xaudio2_1.dll", "xaudio2_0.dll",
    "x3daudio1_7.dll", "x3daudio1_6.dll", "x3daudio1_5.dll", "x3daudio1_4.dll",
    "x3daudio1_3.dll", "x3daudio1_2.dll", "x3daudio1_1.dll", "x3daudio1_0.dll",
    "xapofx1_5.dll", "xapofx1_4.dll", "xapofx1_3.dll", "xapofx1_2.dll", "xapofx1_1.dll",
    "xapofx1_0.dll",
    "d3dx9d_30.dll",
  ],
  "directx-jun2010",
  "DirectX 9.0c (Jun 2010)",
  "DirectX"
);

addMapping(
  [
    "mscoree.dll", "mscorlib.dll", "mscoreei.dll", "clr.dll", "clrjit.dll",
    "System.dll", "System.Core.dll", "System.Data.dll", "System.Xml.dll",
    "System.Drawing.dll", "System.Windows.Forms.dll",
    "PresentationCore.dll", "PresentationFramework.dll",
  ],
  "dotnet-48",
  ".NET Framework 4.8",
  ".NET Framework"
);

addMapping(
  ["hostfxr.dll", "hostpolicy.dll", "coreclr.dll"],
  "dotnet-8-x64",
  ".NET 8.0 运行库 (x64)",
  ".NET"
);

export function findRuntimeForDll(dllName: string): RuntimeMapping | null {
  return DLL_RUNTIME_MAP[dllName.toLowerCase()] || null;
}

export interface ErrorCodeRuntimeMapping {
  runtimeIds: string[];
  runtimeNames: string[];
  description: string;
}

const ERROR_CODE_RUNTIME_MAP: Record<string, ErrorCodeRuntimeMapping> = {
  "0xc000007b": {
    runtimeIds: ["vcredist-2022-x64", "directx-jun2010"],
    runtimeNames: ["VC++ 2015-2022 运行库", "DirectX 9.0c"],
    description: "VC++ 运行库缺失/混装、DirectX 缺失是最常见原因",
  },
  "0xc0000142": {
    runtimeIds: ["vcredist-2022-x64"],
    runtimeNames: ["VC++ 2015-2022 运行库"],
    description: "DLL 初始化失败，通常是 VC++ 运行库损坏",
  },
  "126": {
    runtimeIds: ["vcredist-2022-x64", "directx-jun2010"],
    runtimeNames: ["VC++ 2015-2022 运行库", "DirectX 9.0c"],
    description: "找不到指定的模块，通常是运行库 DLL 缺失",
  },
  "127": {
    runtimeIds: ["vcredist-2022-x64"],
    runtimeNames: ["VC++ 2015-2022 运行库"],
    description: "找不到指定的程序入口点，可能是 DLL 版本不匹配",
  },
  "0xc0000135": {
    runtimeIds: ["dotnet-48"],
    runtimeNames: [".NET Framework 4.8"],
    description: "无法找到 .NET Framework，需要安装 .NET 运行时",
  },
  "80070643": {
    runtimeIds: ["dotnet-48", "vcredist-2022-x64"],
    runtimeNames: [".NET Framework 4.8", "VC++ 2015-2022 运行库"],
    description: "安装失败可能是系统文件损坏，建议先修复系统再安装",
  },
  "0x800f0831": {
    runtimeIds: ["dotnet-48"],
    runtimeNames: [".NET Framework 4.8"],
    description: "组件存储损坏，需要 DISM 修复后再安装 .NET",
  },
  "0x800F0950": {
    runtimeIds: ["dotnet-48"],
    runtimeNames: [".NET Framework 4.8"],
    description: ".NET 3.5 启用失败，建议安装 .NET 4.8",
  },
  "0x81f40001": {
    runtimeIds: ["vcredist-2022-x64"],
    runtimeNames: ["VC++ 2015-2022 运行库"],
    description: "VC++ 安装失败，可能已有更高版本或系统文件损坏",
  },
  "error 1935": {
    runtimeIds: ["dotnet-48", "vcredist-2022-x64"],
    runtimeNames: [".NET Framework 4.8", "VC++ 2015-2022 运行库"],
    description: "程序集安装失败，通常是 CBS 存储损坏",
  },
  "0x887a0005": {
    runtimeIds: ["directx-jun2010"],
    runtimeNames: ["DirectX 9.0c"],
    description: "DXGI 设备挂起，建议更新显卡驱动并修复 DirectX",
  },
  "0x887a0022": {
    runtimeIds: ["directx-jun2010"],
    runtimeNames: ["DirectX 9.0c"],
    description: "DXGI 设备已移除，建议更新显卡驱动",
  },
  "0x8876086a": {
    runtimeIds: ["directx-jun2010"],
    runtimeNames: ["DirectX 9.0c"],
    description: "DirectX 功能不可用，建议安装 DirectX 9.0c",
  },
};

export function findRuntimesForErrorCode(errorCode: string): ErrorCodeRuntimeMapping | null {
  const normalized = errorCode.toLowerCase().replace(/\s+/g, "");
  return ERROR_CODE_RUNTIME_MAP[normalized] || null;
}
