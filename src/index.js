const os = require('os')
const fs = require('fs')
const exec = require('child_process').exec

// todo 支持回调事件
// todo 方法返回多个参数到下一个方法

/**
 * systems
 * aix
 * darwin
 * freebsd
 * linux
 * openbsd
 * sunos
 * win32
 */
const platform = os.platform()

function compose(...funcs) {
  if(funcs.length === 0) {
    return arg => arg
  }

  if(funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

function noop (...args) {
  return args
}

// 验证方法
const validate = {
  isUrl: function (url) {

  },
  isFilePath: function (filepath) {
    return fs.existsSync(filepath)
  },
  isString: function (str) {
    if (!str) return false
    return Object.getPrototypeOf(str) === String.prototype
  }
}

// 资源管理
const fileManage = {
  validate: function (filepath) {
    if (!validate.isFilePath(filepath)) {
      throw new Error(`${filepath} non-existent`)
    }
    return filepath
  },
  win32: function (filepath) {
    exec(`explorer ${filepath}`)
  },
  darwin: function (filepath) {
  }
}

// 弹框提示
const msgBox = {
  validate: function (title, content) {
    const isString = validate.isString
    if (!isString(title)) {
      throw new Error('title isn\'t a string')
    }
    if (!isString(content)) {
      throw new Error('content isn\'t a string')
    }
    return {title, content}
  }
  ,
  win32: function ({title, content}) {
    exec(`mshta vbscript:msgbox("${content}",64,"${title}")(window.close)`)
  },
  darwin: function () {
  }
}

// 打开浏览器
const openBrowser = {
  win32: function (url, a) {
    console.log(a)
    exec(`start ${url}`)
  },
  darwin: function () {
  }
}

const commands = {
  fileManage,
  msgBox,
  openBrowser,
}

Object.keys(commands).forEach(command => {
  commands[command] = compose(
    commands[command][platform],
    commands[command].validate ? commands[command].validate : noop,
  )
})

module.exports = commands