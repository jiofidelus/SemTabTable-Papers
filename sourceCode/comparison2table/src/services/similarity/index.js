// import { submitGetRequest } from ''
const { submitGetRequest } = require('../../network')
const qs = require('qs')
// import qs from 'qs'
// import env from '@beam-australia/react-env';

// const similarityServiceUrl = 'https://orkg.org/api/simcomp/'
const similarityServiceUrl = 'https://orkg.org/simcomp/'
// const similarityServiceUrl = 'https://sandbox.orkg.org/simcomp/'
// const similarityServiceUrl = env('SIMILARITY_SERVICE_URL');
const comparisonUrl = `${similarityServiceUrl}compare/`
const visualizationServiceUrl = `${similarityServiceUrl}visualization/`

/**
 * Get comparison result
 *
 * @param {Array[String]} contributionIds Contribution id
 * @param {String} type Method used to compare (path | merge)
 * @param {String} response_hash Response hash
 * @param {Boolean} save_response To return a response hash and save a copy of the result
 */
const getComparison = ({
	contributionIds = [],
	type = null,
	response_hash = null,
	save_response = false
}) => {
	const params = qs.stringify(
		{
			contributions: contributionIds.join(','),
			response_hash,
			type,
			save_response
		},
		{
			skipNulls: true
		}
	)
	return submitGetRequest(`${comparisonUrl}?${params}`)
}
const getVisualization = (resourceId) =>
	submitGetRequest(
		`${visualizationServiceUrl}?resourceId=${encodeURI(resourceId)}`,
		{
			'Content-Type': 'application/json'
		}
	)
const getResourceData = (resourceId) => getVisualization(resourceId)

module.exports = {similarityServiceUrl, comparisonUrl, visualizationServiceUrl, getComparison, getVisualization, getResourceData}