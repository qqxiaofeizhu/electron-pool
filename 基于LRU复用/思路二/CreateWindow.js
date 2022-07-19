import {merge} from 'lodash';
import {BrowserWindow} from 'electron';

function calculatingConfigurationItem(config = {}) {
    const basicConfig = {
        backgroundColor: '#ffffff', // 窗口背景色为 #ffffff
        resizable: isDevelopment, // 不可以拖拽边框改变大小
        frame: false, // 无边框
        show: false, // 一开始不展示窗口，需要通过 win.show() 方法来展示
        modal: false,
        skipTaskbar: true,
        thickFrame: true, // 设置为 false 时将移除窗口的阴影和动画
        devTools: isDevelopment, // 不添加devTool
        maximizable: isDevelopment, // 不可以双击最大化
        webPreferences: {
            webviewTag: false,
            enableRemoteModule: true, //  是否可以在渲染进程使用remote
            nodeIntegration: true, // 可以使用nodejs 默认值为false
            webgl: false // 启用WebGL支持。 默认值为true
        }
    };
    const finalConfig = merge(basicConfig, config);

    return finalConfig;
}

function createWindow(config) {
    const fiallyConfig = calculatingConfigurationItem(config);
    const window = new BrowserWindow(fiallyConfig);

    window.removeMenu();

    // 当渲染进程崩溃或被结束时触发(killed === true 崩溃，false结束)
    window.webContents.on('render-process-gone', (event, details) => {
        setTimeout(() => {
            window.webContents.reload();
        }, 1000);
    });

    // 当页面变得没有响应时触发
    window.webContents.on('unresponsive', () => {
        // 当前窗体正在监听进程是否真正无响应 (这可能需要长达30秒). 当此事件发生时, 它提供用户两个选项: 重新加载或关闭.
        setTimeout(() => {
            window.webContents.reload();
        }, 1000);
    });

    // 当窗体获取到响应时触发
    window.webContents.on('responsive', function () {
        // 当窗口再次响应时做些什么
        consoleLog('窗体恢复响应');
    });

    // 渲染进程加载失败
    window.webContents.on('did-fail-load', (event, ...reset) => {
        consoleError('did-fail-load 渲染进程加载失败 reset', reset);
    });

    return window;
}

export default createWindow;
