const { build } = require('esbuild')
const { resolve, relative } = require('path')
const args = require('minimist')(process.argv.slice(2))

const target = args._[0] || 'vue'
const format = args.f || 'global'
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)
const relativeOutfile = relative(process.cwd(), outfile)
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm'

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.js`)],
  outfile,
  bundle: true, // 把所有的包全部打包到一起
  sourcemap: true,
  format: outputFormat, // 输出格式
  globalName: pkg.buildOptions?.name, // 打包后的全局变量名
  platform: format === 'cjs' ? 'node' : "browser", // 平台
  watch: { // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt: ${relativeOutfile}`)
    }
  }
}).then(() => {
  console.log(`watching: ${relativeOutfile}`)
})
