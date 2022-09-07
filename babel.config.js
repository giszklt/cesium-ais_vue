module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  compact: false,
  "plugins": [
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ]
  ]
}
