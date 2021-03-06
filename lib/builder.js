const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

const config = require('../config/webpack.config.js')

const writeAssetsToJson = (stats) => {
  const target = path.resolve(
    process.cwd(), 'build', 'client', 'webpack-chunks.json')
  const content = { assets: [] }
  for (const chunk in stats.children[0].assetsByChunkName) {
    const assets = stats.children[0].assetsByChunkName[chunk]
    if (Array.isArray(assets)) {
      for (const asset of assets) {
        content.assets.push(asset)
      }
    } else {
      content.assets.push(assets)
    }
  }
  fs.writeFileSync(target, JSON.stringify(content))
  console.log(chalk.green('Wrote webpack-chunks.json'))
}

module.exports = (opts = {}) => {
  const isWatch = !!opts.isWatch
  const configs = [
    config({
      isWatch: isWatch
    }),
    config({
      isServerSide: true,
      isWatch: isWatch
    })
  ]

  console.log(chalk.green('Build started.'))
  const compiler = webpack(configs)
  const plugin = { name: 'universal-scripts' }
  compiler.hooks.invalid.tap(plugin, () => {
    console.log('\n' + chalk.yellowBright('Compiling...'))
  })
  compiler.hooks.done.tap(plugin, stats => {
    const statsJson = stats.toJson({}, true)
    if (statsJson.errors.length) {
      console.log(chalk.red('Failed to compile.'))
    } else {
      if (statsJson.warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.'))
      } else {
        console.log(chalk.green('Compiled successfully.'))
      }
      if (!isWatch) {
        // When not using the watch mode (dev server), we need to
        // write the chunk info somewhere for the server to read it.
        writeAssetsToJson(statsJson)
      }
    }
    console.log(stats.toString({
      colors: true,
      chunks: false,
      modules: false,
      entrypoints: false
    }))
  })
  return compiler
}
