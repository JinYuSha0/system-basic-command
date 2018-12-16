const os = require('os')
const fs = require('fs')
const { exec, spawn } = require('child_process')

// todo macOS

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
  isUrl: function (_url) {
    return /^https?:\/\//.test(_url)
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
  win32: function (filepath, cb) {
    exec(`explorer ${filepath}`)
  },
  darwin: function (filepath) {
  }
}

// 打开浏览器
const openBrowser = {
  validate: function (url) {
    if (!validate.isUrl(url)) {
      throw new Error(`${url} isn\'t correct url`)
    }
    return url
  },
  win32: function (url) {
    exec(`start ${url}`)
  },
  darwin: function () {
  }
}

// 弹框提示
const msgBox = {
  validate: function (title, content, cb) {
    const isString = validate.isString
    if (!isString(title)) {
      throw new Error('title isn\'t a string')
    }
    if (!isString(content)) {
      throw new Error('content isn\'t a string')
    }
    return {title, content, cb}
  },
  win32: function ({title, content, cb}) {
    return new Promise((resolve, reject) => {
      const cmd = exec(`mshta vbscript:msgbox("${content}",1,"${title}")(window.close)`)
      cmd.stderr.on('data', (err) => {
        reject(err)
      })
      cmd.on('exit', function (code) {
        if (cb) cb(code)
        resolve(code)
      })
    })
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
