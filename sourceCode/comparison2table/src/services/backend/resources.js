const { url } = require('../../constants/misc')
const { submitGetRequest } = require('../../network')

const resourcesUrl = `${url}resources/`

const getResource = (id) =>
	submitGetRequest(`${resourcesUrl}${encodeURIComponent(id)}/`)

module.exports = { resourcesUrl, getResource }
