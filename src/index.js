const os = require('os')
const fs = require('fs')
const { exec } = require('child_process')

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
    exec(`open ${filepath}`)
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
  darwin: function (url) {
    exec(`open '${url}'`)
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
  darwin: function ({title, content, cb}) {
    return new Promise((resolve, reject) => {
      const cmd = exec(`osascript -e 'tell application (path to frontmost application as text) to display dialog "${content}" buttons {"OK"} with title "${title}" with icon note'`)
      cmd.stderr.on('data', (err) => {
        reject(err)
      })
      cmd.on('exit', function (code) {
        if (cb) cb(code)
        resolve(code)
      })
    })
  },
}

// 获取默认网关地址
const getGateway = {
  validate (networkCardName, cb) {
    if (!networkCardName || !validate.isString(networkCardName)) {
      throw new Error(`networkCardName expect is String not ${typeof networkCardName}`)
    }
    return {networkCardName, cb}
  },
  win32: function ({networkCardName, cb}) {
    // todo
  },
  darwin: function ({networkCardName, cb}) {
    return new Promise((resolve, reject) => {
      const cmd = exec(`netstat -rn | grep 'default'`)
      cmd.stderr.on('data', (err) => {
        reject(err)
      })
      cmd.stdout.on('data', (data) => {
        const rowReg = `[^\\n]+${networkCardName}`
        const row = data.match(rowReg, 'g')[0]
        const gateway = row.match(/\d+\.\d+\.\d+\.\d+/)[0]
        cb(gateway)
        resolve(gateway)
      })
    })
  }
}

const commands = {
  fileManage,
  msgBox,
  openBrowser,
  getGateway
}

Object.keys(commands).forEach(command => {
  commands[command] = compose(
    commands[command][platform],
    commands[command].validate ? commands[command].validate : noop,
  )
})

module.exports = commands
