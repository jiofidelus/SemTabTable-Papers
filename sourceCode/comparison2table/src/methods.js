const {
	isPredicatesListCorrect,
	extendPropertyIds,
	similarPropertiesByLabel,
	getPropertyObjectFromData
} = require('./components/Comparison/hooks/helpers')

const fs = require('fs')
const { unparse } = require('papaparse')
const { uniq, without } = require('lodash')
const {
	getStatementsBySubject,
	getStatementsBySubjectAndPredicate
} = require('./services/backend/statements')
const { getResource } = require('./services/backend/resources')
const {
	getComparison,
	getResourceData
} = require('./services/similarity/index')
const {
	filterObjectOfStatementsByPredicateAndClass,
	getErrorMessage,
	getComparisonData,
	asyncLocalStorage
} = require('./utils')
const { PREDICATES, CLASSES } = require('./constants/graphSettings')
const {
	getComparisonConfiguration,
	generateFilterControlData
} = require('./components/Comparison/hooks/helpers')

const DEFAULT_COMPARISON_METHOD = 'path'

async function _getComparison({ id, isEmbeddedMode = false }) {
	const comparisonId = id
	const hiddenGroupsStorageName = comparisonId
		? `comparison-${comparisonId}-hidden-rows`
		: null

	const myAwesomeComparison = {
		comparisonResource: {
			id: '',
			label: '',
			created_at: null,
			classes: [],
			shared: 0,
			created_by: '00000000-0000-0000-0000-000000000000',
			observatory_id: '00000000-0000-0000-0000-000000000000',
			extraction_method: 'UNKNOWN',
			organization_id: '00000000-0000-0000-0000-000000000000',
			authors: [],
			references: [],
			resources: [],
			figures: [],
			visualizations: [],
			contributions: [],
			researchField: null,
			hasPreviousVersion: null,
			doi: null,
			description: '',
			properties: ''
		},
		configuration: {
			transpose: false,
			comparisonType: DEFAULT_COMPARISON_METHOD,
			responseHash: null,
			contributionsList: [],
			predicatesList: []
		},
		properties: [],
		contributions: [],
		data: {},
		filterControlData: [],
		errors: [],
		versions: [],
		createdBy: null,
		observatory: null,
		shortLink: '',
		researchField: null,
		isLoadingMetadata: false,
		isFailedLoadingMetadata: false,
		isLoadingResult: true,
		isFailedLoadingResult: false,
		isOpenVisualizationModal: false,
		isOpenReviewModal: false,
		useReconstructedDataInVisualization: false,
		hiddenGroups: [],
		isEditing: false,
		isEmbeddedMode: false
	}
	/**
	 * Load comparison meta data and comparison config
	 *
	 * @param {String} cId comparison ID
	 */
	const loadComparisonMetaData = async (cId) => {
		if (cId) {
			myAwesomeComparison.isLoadingMetadata = true
			// Get the comparison resource and comparison config
			try {
				const [_comparisonResource, configurationData] =
					await Promise.all([getResource(cId), getResourceData(cId)])
				//     // Make sure that this resource is a comparison
				if (!_comparisonResource.classes.includes(CLASSES.COMPARISON)) {
					throw new Error(
						`The requested resource is not of class "${CLASSES.COMPARISON}".`
					)
				}
				// Get meta data and config of a comparison
				const statements = await getStatementsBySubject({ id: cId })
				const comparisonObject = getComparisonData(
					_comparisonResource,
					statements
				)
				myAwesomeComparison.comparisonResource = comparisonObject

				const { url } = configurationData.data
				if (url) {
					myAwesomeComparison.configuration =
						getComparisonConfiguration(url)
				} else {
					myAwesomeComparison.configuration.predicatesList =
						filterObjectOfStatementsByPredicateAndClass(
							statements,
							PREDICATES.HAS_PROPERTY,
							false
						)?.map((p) => p.id)
					const contributionsIDs =
						without(
							uniq(
								filterObjectOfStatementsByPredicateAndClass(
									statements,
									PREDICATES.COMPARE_CONTRIBUTION,
									false,
									CLASSES.CONTRIBUTION
								)?.map((c) => c.id) ?? []
							),
							undefined,
							null,
							''
						) ?? []
					myAwesomeComparison.configuration.contributionsList =
						contributionsIDs
				}
				if (
					!filterObjectOfStatementsByPredicateAndClass(
						statements,
						PREDICATES.COMPARE_CONTRIBUTION,
						false,
						CLASSES.CONTRIBUTION
					)?.map((c) => c.id)
				) {
					myAwesomeComparison.isLoadingResult = false
				}
				myAwesomeComparison.isLoadingMetadata = false
				myAwesomeComparison.isFailedLoadingMetadata = false
			} catch (error) {
				let errorMessage = null
				if (error.statusCode && error.statusCode === 404) {
					errorMessage = 'The requested resource is not found'
				} else {
					errorMessage = getErrorMessage(error)
				}
				myAwesomeComparison.errors = errorMessage
				myAwesomeComparison.isLoadingMetadata = false
				myAwesomeComparison.isFailedLoadingMetadata = true
			}
		} else {
			myAwesomeComparison.isLoadingMetadata = false
			myAwesomeComparison.isFailedLoadingMetadata = true
		}
	}

	/**
	 * Call the comparison service to get the comparison result
	 */
	const getComparisonResult = async () => {
		myAwesomeComparison.isLoadingResult = true
		try {
			const comparisonData = await getComparison({
				contributionIds:
					myAwesomeComparison.configuration.contributionsList,
				type: myAwesomeComparison.configuration.comparisonType,
				response_hash: myAwesomeComparison.configuration.responseHash,
				save_response: false
			})
			// mocking function to allow for deletion of contributions via the url
			comparisonData.contributions.forEach((contribution, index) => {
				if (
					myAwesomeComparison.configuration.contributionsList
						?.length > 0 &&
					!myAwesomeComparison.configuration.contributionsList.includes(
						contribution.id
					)
				) {
					comparisonData.contributions[index].active = false
				} else {
					comparisonData.contributions[index].active = true
				}
			})

			comparisonData.properties = await extendAndSortProperties(
				comparisonData,
				myAwesomeComparison.comparisonType,
				myAwesomeComparison
			)

			myAwesomeComparison.contributions = comparisonData.contributions
			myAwesomeComparison.properties = comparisonData.properties
			myAwesomeComparison.data = comparisonData.data

			myAwesomeComparison.filterControlData = generateFilterControlData(
				comparisonData.contributions,
				comparisonData.properties,
				comparisonData.data
			)
			myAwesomeComparison.isLoadingResult = false
			myAwesomeComparison.isFailedLoadingResult = false

			if (comparisonData.response_hash) {
				myAwesomeComparison.configuration.responseHash =
					comparisonData.response_hash
			}
		} catch (error) {
			myAwesomeComparison.errors = error
			myAwesomeComparison.isLoadingResult = false
			myAwesomeComparison.isFailedLoadingMetadata = true
		}
	}
	// const getHiddenGroup = async () => {
	// 	if (comparisonId && hiddenGroupsStorageName) {
	// 		const _data = await asyncLocalStorage.getItem(
	// 			hiddenGroupsStorageName
	// 		)
	// 		try {
	// 			const parsedData = JSON.parse(_data)
	// 			if (_data && Array.isArray(parsedData)) {
	// 				// dispatch(setHiddenGroups(parsedData));
	// 				myAwesomeComparison.hiddenGroups = parsedData
	// 			}
	// 		} catch (e) {}
	// 	}
	// }
	// await getHiddenGroup()

	/**
	 * Get research field of the first contribution if no research field is found
	 */
	// get Research field of the first contributions
	if (
		!myAwesomeComparison.comparisonResource?.researchField &&
		myAwesomeComparison.contributions?.[0]?.paperId
	) {
		const s = await getStatementsBySubjectAndPredicate({
			subjectId: myAwesomeComparison.contributions[0]?.paperId,
			predicateId: PREDICATES.HAS_RESEARCH_FIELD
		})
		if (
			s.length &&
			!myAwesomeComparison.comparisonResource?.researchField
		) {
			myAwesomeComparison.researchField = s[0].object
		}
	}
	await loadComparisonMetaData(comparisonId)
	if (myAwesomeComparison.configuration.contributionsList?.length > 0) {
		await getComparisonResult()
	}
	myAwesomeComparison.isEmbeddedMode = isEmbeddedMode

	const {
		comparisonResource,
		isLoadingResult,
		data,
		contributions,
		properties
	} = myAwesomeComparison
	return {
		comparisonResource,
		isLoadingResult,
		data,
		contributions,
		properties
	}
}

async function downloadAnnotationFiles(comparisonId) {
	// Creating the folder containing the annotation files and the table
	fs.mkdir('annotations', (e) => {})
	// Getting the current timestamp to name the table
	const filename = `KNSR${Date.now()}`
	// Getting the comparison data, based on its identifier
	const comparison = await _getComparison({ id: comparisonId })
	// Get the comparison table as CSV string
	const annotationTable = getAnnotationTable({ comparison })
	// Get CEA data as CSV string
	const ceaData = getCEAData({ comparison })
	// Get CTA data as CSV string
	const ctaData = getCTAData({ comparison })
	// Get CPA data as CSV string
	const cpaData = getCPAData({ comparison })
	// Get TTD data as CSV string
	const ttdData = getTTDData({ comparison })

	// Downloading files
	fs.mkdir(`annotations/${filename}`, (e) => {
		if (e) console.log(e)
		saveFile(annotationTable, filename, 'table')
		saveFile(ceaData, filename, 'cea')
		saveFile(ctaData, filename, 'cta')
		saveFile(cpaData, filename, 'cpa')
		saveFile(ttdData, filename, 'ttd')
	})
}

function getAnnotationTable({ comparison }) {
	const rows = []

	for (let i = 0; i < comparison.contributions.length; i += 1) {
		const contribution = comparison.contributions[i]
		if (contribution.active) {
			const row = [contribution.title]
			for (const property of comparison.properties) {
				if (property.active) {
					let value = ''
					if (comparison.data[property.id]) {
						value = comparison.data[property.id][i]
							.map((entry) => entry.label)
							.join(', ')
						row.push(value)
					}
				}
			}
			rows.push(row)
		}
	}

	return unparse(rows)
	return rows
}

function getCEAData({ comparison, filename = 'table' }) {
	const header = ['file', 'dimX', 'dimY', 'dimZ', 'Uri']
	const url = 'https://orkg.org'
	const rows = [header]

	for (let i = 0; i < comparison.contributions.length; i += 1) {
		const contribution = comparison.contributions[i]
		if (contribution.active) {
			rows.push([
				filename,
				`${i}`,
				'0',
				'0',
				`${url}/paper/${contribution.paperId}/${contribution.id}`
			])
			let j = 0
			for (const property of comparison.properties) {
				if (property.active) {
					if (comparison.data[property.id]) {
						let k = 0
						for (const entry of comparison.data[property.id][i]) {
							const row = [filename]
							row.push(`${i}`)
							row.push(`${j}`)
							row.push(`${k}`)
							if (entry.type && entry.type !== 'literal') {
								row.push(
									`${url}/${entry.type}/${entry.resourceId}`
								)
							} else if (entry.label) {
								row.push(entry.resourceId)
							} else {
								row.push('NIL')
							}
							rows.push(row)
							k += 1
						}
						j += 1
					}
				}
			}
		}
	}
	return unparse(rows)
	return rows
}

function getCTAData({ comparison, filename = 'table' }) {
	const header = ['file', 'col', 'Uri']
	const url = 'https://orkg.org'
	const rows = [header]

	for (let i = 0; i < comparison.contributions.length; i += 1) {
		const contribution = comparison.contributions[i]
		if (contribution.active) {
			rows.push([
				filename,
				`${i}`,
				'0',
				'0',
				`${url}/paper/${contribution.paperId}/${contribution.id}`
			])
		}
	}
	return unparse(rows)
	return rows
}

function getCPAData({ comparison, filename = 'table' }) {
	const header = ['file', 'col0', 'colx', 'Uri']
	const url = 'https://orkg.org'
	const rows = [header]
	const contribution = comparison.contributions?.[0]
	if (contribution?.active) {
		let j = 1
		for (const property of comparison.properties) {
			if (property.active) {
				if (comparison.data[property.id]) {
					rows.push([
						filename,
						'0',
						`${j}`,
						`${url}/property/${
							getPropertyObjectFromData(
								comparison.data,
								comparison.properties[j - 1]
							).id
						}`
					])
				}
			}
			j += 1
		}
	}
	return unparse(rows)
	return rows
}

function getTTDData({ comparison, filename = 'table' }) {
	const header = ['file', 'Uri']
	const rows = [header]
	// const url = 'https://orkg.org';
	// rows.push([filename, `${url}/comparisons`]);
	rows.push([filename, 'comparison'])
	return unparse(rows)
	return rows
}

function saveFile(data, filename, fileType) {
	fs.writeFile(`annotations/${filename}/${fileType}.csv`, data, (e) => {
		if (e) console.log(e)
	})
}
/**
 * Extend and sort properties
 *
 * @param {Object} comparisonData Comparison Data result
 * @return {Array} list of properties extended and sorted
 */
const extendAndSortProperties = (
	comparisonData,
	_comparisonType,
	comparison
) => {
	// if there are properties in the query string
	const { predicatesList } = comparison.configuration
	if (predicatesList.length > 0) {
		// Create an extended version of propertyIds (ADD the IDs of similar properties)
		// Only use this on the 'merge' method because the if it's used in 'path' method, it will show properties that are not activated
		let extendedPropertyIds = predicatesList
		if (
			!isPredicatesListCorrect(predicatesList, _comparisonType) ||
			_comparisonType === 'merge'
		) {
			extendedPropertyIds = extendPropertyIds(
				predicatesList,
				comparisonData.data
			)
		} else {
			extendedPropertyIds = predicatesList
		}
		// sort properties based on query string (is not presented in query string, sort at the bottom)
		// TODO: sort by label when is not active
		comparisonData.properties.sort((a, b) => {
			const index1 =
				extendedPropertyIds.indexOf(a.id) !== -1
					? extendedPropertyIds.indexOf(a.id)
					: 1000
			const index2 =
				extendedPropertyIds.indexOf(b.id) !== -1
					? extendedPropertyIds.indexOf(b.id)
					: 1000
			return index1 - index2
		})
		// hide properties based on query string
		comparisonData.properties.forEach((property, index) => {
			if (!extendedPropertyIds.includes(property.id)) {
				comparisonData.properties[index].active = false
			} else {
				comparisonData.properties[index].active = true
			}
		})
	} else {
		// no properties ids in the url, but the ones from the api still need to be sorted
		comparisonData.properties.sort((a, b) => {
			if (a.active === b.active) {
				return a.label
					.toLowerCase()
					.localeCompare(b.label.toLowerCase())
			}
			return !a.active ? 1 : -1
		})
	}

	// Get Similar properties by Label
	comparisonData.properties.forEach((property, index) => {
		comparisonData.properties[index].similar = similarPropertiesByLabel(
			property.label,
			comparisonData.data[property.id]
		)
	})
	return comparisonData.properties
}

module.exports = {
	downloadAnnotationFiles
}
