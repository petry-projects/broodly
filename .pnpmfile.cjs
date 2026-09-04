function readPackageHook(pkg) {
  if (!pkg.peerDependencies) {
    pkg.peerDependencies = {}
  }

  if (pkg.dependencies) {
    pkg.dependencies = {
      ...pkg.dependencies,
      '@xmldom/xmldom': '>=0.9.12',
      'postcss-selector-parser': '>=6.1.3',
      '@humanfs/node': '>=0.16.8',
      'browserslist': '>=4.28.7',
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage: readPackageHook,
  },
}
