/*global require, process, __dirname, module*/
/*eslint no-undef: "error"*/
const {defineConfig} = require('@vue/cli-service')
const path = require("path");
const port = process.env.port || process.env.npm_config_port || 9528 // dev port

const name = 'cesium-ais' // page title
function resolve(dir) {
    return path.join(__dirname, dir)
}

module.exports = defineConfig({
    transpileDependencies: true,
    outputDir: './dist',
    lintOnSave:false,
    assetsDir: './',
    productionSourceMap: false,
    devServer: {
        port: port,
        open: true
    },
    configureWebpack: {
        // provide the app's title in webpack's name field, so that
        // it can be accessed in index.html to inject the correct title.
        name: name,
        resolve: {
            alias: {
                '@': resolve('src'),
                vue$: 'vue/dist/vue.esm.js'
            }
        }
    }
})
