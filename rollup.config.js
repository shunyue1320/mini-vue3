import pkg from './package.json'
import typescript from 'rollup-plugin-typescript'
import sourceMaps from 'rollup-plugin-sourcemaps'

export default {
  input: './src/main.ts',
  plugins: [
    typescript({
      exclude: 'node_modules/**',
      typescript: require('typescript')
    }),
    sourceMaps()
  ],
  output: [
    {
      format: 'cjs',
      file: pkg.main,
      sourcemaps: true
    },
    {
      name: 'vue',
      format: 'es',
      format: pkg.module,
      sourcemaps: true
    }
  ]
}