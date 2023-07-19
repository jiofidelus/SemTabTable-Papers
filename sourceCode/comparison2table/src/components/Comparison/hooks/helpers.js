const {
	getArrayParamFromQueryString,
	getParamFromQueryString
} = require('../../../utils')
const {
	uniq,
	without,
	flattenDepth,
	groupBy,
	flatten,
	last,
	find
} = require('lodash')
const { DEFAULT_COMPARISON_METHOD } = require('../../../constants/misc')

/**
 * Parse comparison configuration from url
 * @param {String} id
 * @param {String } label
 * @param {Array} comparisonStatements
 */
const getComparisonConfiguration = (url) => {
	const response_hash =
		getParamFromQueryString(
			url.substring(url.indexOf('?')),
			'response_hash'
		) ?? null
	const type =
		getParamFromQueryString(url.substring(url.indexOf('?')), 'type') ??
		DEFAULT_COMPARISON_METHOD
	const transpose = getParamFromQueryString(
		url.substring(url.indexOf('?')),
		'transpose',
		true
	)
	const predicatesList = getArrayParamFromQueryString(
		url.substring(url.indexOf('?')),
		'properties'
	)
	const contributionsList =
		without(
			uniq(
				getArrayParamFromQueryString(
					url.substring(url.indexOf('?')),
					'contributions'
				)
			),
			undefined,
			null,
			''
		) ?? []

	return {
		responseHash: response_hash,
		comparisonType: type,
		transpose,
		predicatesList,
		contributionsList
	}
}

/**
 * Make sure the the predicateList fits with the comparison approach
 * Merge approach -> the predicateList is a list of predicate ids
 * Path approach -> the predicateList is a list of paths
 * This assumes that there's  no Predicate ID that contains "/"
 * @param {Array} predicatesList properties ids from the query string
 * @param {String} _comparisonType Comparison type
 * @return {Boolean} the list of values
 */
const isPredicatesListCorrect = (propertyIds, _comparisonType) => {
	if (propertyIds.length === 0) {
		return true
	}
	if (_comparisonType === 'merge') {
		return propertyIds.every((element) => !element.includes('/'))
	}
	if (_comparisonType === 'path') {
		return propertyIds.some(
			(element) => element.includes('/') || !element.match(/^P([0-9])+$/)
		)
	}
	return true
}

/**
 * Create an extended version of propertyIds
 * (ADD the IDs of similar properties)
 * it's important to keep the order so the result table get a correct order
 * @param {Array} propertyIds properties ids from the query string
 * @param {String} data Comparison data
 */
const extendPropertyIds = (propertyIds, data) => {
	const result = []
	propertyIds.forEach((pID, index) => {
		result.push(pID)
		// loop on the predicates of comparison result
		for (const [pr, values] of Object.entries(data)) {
			// flat the all contribution values for the current predicate and
			// check if there similar predicate.
			// (the target similar predicate is supposed to be the last in the path of value)
			const allV = flattenDepth(values, 2).filter((value) => {
				if (
					value.path &&
					value.path.length > 0 &&
					value.path[value.path.length - 1] === pID &&
					pr !== pID
				) {
					return true
				}
				return false
			})
			if (allV.length > 0) {
				result.push(pr)
			}
		}
	})
	return result
}

/**
 * Get Similar properties labels by Label
 * (similar properties)
 * @param {String} propertyLabel property label
 * @param {Array} propertyData property comparison data
 */
const similarPropertiesByLabel = (propertyLabel, propertyData) => {
	const result = []
	// flat property values and add similar but not equal labels
	flattenDepth(propertyData, 2).forEach((value, index) => {
		if (
			value.pathLabels &&
			value.pathLabels.length > 0 &&
			value.pathLabels[value.pathLabels.length - 1] !== propertyLabel
		) {
			result.push(value.pathLabels[value.pathLabels.length - 1])
		}
	})
	return uniq(result)
}

/**
 * Generate Filter Control Data
 *
 * @param {Array} contributions Array of contributions
 * @param {Array} properties Array of properties
 * @param {Object} data Comparison Data object
 * @return {Array} Filter Control Data
 */
const generateFilterControlData = (contributions, properties, data) => {
	const controlData = [
		...properties.map((property) => ({
			property,
			rules: [],
			values: groupBy(
				flatten(
					contributions
						.map((_, index) => data[property.id][index])
						.filter(([first]) => Object.keys(first).length !== 0)
				),
				'label'
			)
		}))
	]
	controlData.forEach((item) => {
		Object.keys(item.values).forEach((key) => {
			item.values[key] = item.values[key].map(({ path }) => path[0])
		})
	})
	return controlData
}

/**
 * Get property object from comparison data
 * (This function is useful to make the property clickable when using the comparison type "path")
 * @param {Array} data Comparison data
 * @param {Object} value The property path
 * @return {Object} The property object
 */
const getPropertyObjectFromData = (data, value) => {
	// console.log(value);
	const notEmptyCell = find(
		flatten(data[value.id]),
		(v) => v?.path?.length > 0
	)
	return notEmptyCell &&
		notEmptyCell.path?.length &&
		notEmptyCell.pathLabels?.length
		? { id: last(notEmptyCell.path), label: last(notEmptyCell.pathLabels) }
		: value
}

module.exports = {
	getComparisonConfiguration,
	isPredicatesListCorrect,
	extendPropertyIds,
	similarPropertiesByLabel,
	generateFilterControlData,
	getPropertyObjectFromData
}
