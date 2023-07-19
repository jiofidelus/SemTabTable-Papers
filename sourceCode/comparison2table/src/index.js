const { downloadAnnotationFiles } = require('./methods')
const process = require('process')
var id = process.argv[2]
console.log(id)
downloadAnnotationFiles(id)
