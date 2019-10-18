//////////////////////////////////////////////////////////////////////////////
// 文件名：editor.js
// 功能：  实现VScode中的代码编辑器调用, 在网页中嵌入monaco.editor，并在本地进程中嵌入一个浏览器打开该网页
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
///代码编辑器 monaco.editor
//////////////////////////////////////////////////////////////////////////////

//当前代码编辑器所打开的文件，为空则为新建文件
var g_model = null;
var g_filename = "";
//编辑器实例
var g_editor = null;


//初始化编辑器
function init_editor(layoutid, code_str) {
    if (g_editor)
        return;
    //初始化编辑器
    require.config(
        {
            paths: {'vs': 'monaco-editor-0.16.2/package/min/vs'},
            'vs/nls': {availableLanguages: {'*': 'zh-cn'}}
        }
    );
    require(['vs/editor/editor.main'], function () {
        g_editor = monaco.editor.create(
            document.getElementById(layoutid),
            {
                language: 'python',             //程序语言
                theme: 'vs-dark',               //界面主题
                value: code_str,                //初始文本内容
                automaticLayout: true,          //随布局Element自动调整大小                        
                minimap: {enabled: true},       //代码略缩图
                fontSize: 24,                   //字体大小
                //wordWrap: "on",               //自动换行，注意大小写
                //wrappingIndent: "indent",     //自动缩进
                //glyphMargin: true,            //字形边缘
                //useTabStops: false,           //tab键停留
                //selectOnLineNumbers: true,    //单击行号选中该行
                //roundedSelection: false,      //
                //readOnly: false,              // 只读
                //cursorStyle: 'line',          //光标样式
                //automaticLayout: false,       //自动布局
                //autoIndent:true,              //自动布局
                //quickSuggestionsDelay: 500,   //代码提示延时
            }
        );
    });

    //自适应大小，可以不要
    window.onresize = editor_layout;
    //编辑器加载成功后创建websocket连接
    window.onload = init_webskt;
}

//自适应窗口大小
function editor_layout() {
    if (g_editor)
        g_editor.layout()
}

//设置主题风格 theme:vs-dark vs hc-black, fontsize:S M L XL XXL
function set_theme(theme, fontsize) {
    monaco.editor.setTheme(theme);

    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    ind = sizes.indexOf(fontsize);
    if (ind < 0)
        return;
    //monaco.editor.FontInfo.fontSize = 24 * (1 + ind * 0.25)
}

//设置代码文件
function load_file(file, txt) {
    g_filename = file;
    g_editor.setValue(txt);
}

//保存代码到本地文件, 第一行为文件名, 文件名如果为空在在python端弹出保存对话框
function save_file(reqid, file) {
    fname = file;
    if (fname == "")
        fname = g_filename;
    data = {
        'cmd': 'savefile_rsp',
        'reqid': reqid,
        'file': fname,
        'txt': g_editor.getValue(),
        'errtxt': ''
    }
    senddata(data);
}


//////////////////////////////////////////////////////////////////////////////
///标签栏管理
//////////////////////////////////////////////////////////////////////////////
// == 值比较  === 类型比较 $(id) ---->  document.getElementById(id)
function $(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
}

//全局字典
var datas = new Array();

// 当前标签
var currtab = ""

// 切换标签
function switch_tab(newtab) {
    if (newtab == currtab)
        return;

    var tab = $(newtab.toString());
    if (!tab && newtab != "")
        return;

    if (tab)
        tab.className = 'current';
    load_file(newtab, tab ? datas[newtab] : '');

    tab = $(currtab.toString())
    if (tab)
        tab.className = '';

    currtab = newtab;
    // g_filename = currtab.id;
}

// 添加标签
function add_tab(name, value) {
    if (name == "" || datas[name])
        return;

    //新建标签
    var tab = document.createElement("li");
    tab.id = name;
    tab.innerHTML = name.substr(name.lastIndexOf('/') + 1);

    //新建关闭按钮
    var btn = document.createElement("a");
    btn.href = "#";
    btn.innerHTML = "x";

    //添加按钮到标签上
    tab.appendChild(btn);
    //添加按钮到标签栏上
    $('tabs').appendChild(tab);

    //设置标签和按钮的单击事件
    tab.onclick = function () {
        switch_tab(this.id);
    }
    btn.onclick = function () {
        var tab = this.parentNode;
        if (tab.className == 'current') {
            var _tab = tab.nextElementSibling;
            if (!_tab)
                _tab = tab.previousElementSibling;
            switch_tab(_tab ? _tab.id : '');
        }
        delete datas[tab.id];
        tab.remove();
    }

    //添加标签关联的数据
    datas[name] = value;
    //切换到新标签
    switch_tab(name);
}

function update_tab(name, value) {
    var tab = $(currtab.toString());
    tab.id = name;
    tab.innerHTML = name.substr(name.lastIndexOf('/') + 1);

    var btn = document.createElement("a");
    btn.href = "#";
    btn.innerHTML = "x";

    //添加按钮到标签上
    tab.appendChild(btn);
    //添加按钮到标签栏上
    $('tabs').appendChild(tab);

    //设置标签和按钮的单击事件
    tab.onclick = function () {
        switch_tab(this.id);
    }
    btn.onclick = function () {
        var tab = this.parentNode;
        if (tab.className == 'current') {
            var _tab = tab.nextElementSibling;
            if (!_tab)
                _tab = tab.previousElementSibling;
            switch_tab(_tab ? _tab.id : '');
        }
        delete datas[tab.id];
        tab.remove();
    }

    currtab = name;
}
