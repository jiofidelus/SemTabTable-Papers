const capitalize = require('capitalize')
const { CLASSES, PREDICATES } = require('./constants/graphSettings')

const qs = require('qs')

/**
 * Filter a list of statements by predicate id and return the object (including the statement id and created_at)
 *
 * @param {Array} statementsArray Array of statements
 * @param {String} predicateID Predicate ID
 * @param {String} classID Class ID
 * @param {String} subjectID Subject ID
 * @param {Boolean} isUnique if this predicate is unique and has one value
 */
const filterObjectOfStatementsByPredicateAndClass = (
	statementsArray,
	predicateID,
	isUnique = true,
	classID = null,
	subjectID = null
) => {
	if (!statementsArray) {
		return isUnique ? null : []
	}
	let result = statementsArray.filter(
		(statement) =>
			statement.predicate.id === predicateID &&
			(statement.subject.id === subjectID || subjectID === null)
	)
	if (classID) {
		result = statementsArray.filter(
			(statement) =>
				statement.object.classes &&
				statement.object.classes.includes(classID)
		)
	}
	if (result.length > 0 && isUnique) {
		return {
			...result[0].object,
			statementId: result[0].id,
			s_created_at: result[0].created_at
		}
	}
	if (result.length > 0 && !isUnique) {
		return result.map((s) => ({
			...s.object,
			statementId: s.id,
			s_created_at: s.created_at
		}))
	}
	return isUnique ? null : []
}

const getErrorMessage = (errors, field = null) => {
	if (!errors) {
		return null
	}
	if (field === null) {
		return errors.message
			? errors.message?.replace?.('Predicate', 'Property')
			: null
	}
	const fieldError = errors.errors
		? errors.errors.find((e) => e.field === field)
		: null
	return fieldError
		? capitalize(fieldError.message).replace('Predicate', 'Property')
		: null
}

/**
 * Parse comparison statements and return a comparison object
 * @param {Object} resource Comparison resource
 * @param {Array} comparisonStatements
 */
const getComparisonData = (resource, comparisonStatements) => {
	const description = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.DESCRIPTION,
		true
	)
	const contributions = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.COMPARE_CONTRIBUTION,
		false
	)
	const references = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.REFERENCE,
		false
	)
	const doi = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_DOI,
		true
	)
	const hasPreviousVersion = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_PREVIOUS_VERSION,
		true,
		CLASSES.COMPARISON
	)
	const icon = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.ICON,
		true
	)
	const type = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.TYPE,
		true
	)
	const order = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.ORDER,
		true
	)
	const onHomePage = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.ON_HOMEPAGE,
		true
	)
	const subject = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_SUBJECT,
		true,
		CLASSES.RESEARCH_FIELD
	)
	const resources = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.RELATED_RESOURCE,
		false,
		CLASSES.COMPARISON_RELATED_RESOURCE
	)
	const figures = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.RELATED_FIGURE,
		false,
		CLASSES.COMPARISON_RELATED_FIGURE
	)
	const visualizations = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_VISUALIZATION,
		false,
		CLASSES.VISUALIZATION
	)

	const video = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_VIDEO,
		true
	)
	const authors = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_AUTHOR,
		false
	)
	const properties = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.HAS_PROPERTY,
		false
	)
	const anonymized = filterObjectOfStatementsByPredicateAndClass(
		comparisonStatements,
		PREDICATES.IS_ANONYMIZED,
		true
	)

	return {
		...resource,
		label: resource.label ? resource.label : 'No Title',
		// sort authors by their statement creation time (s_created_at)
		authors: authors
			? authors.sort((a, b) =>
					a.s_created_at.localeCompare(b.s_created_at)
			  )
			: [],
		contributions,
		references,
		doi: doi ? doi.label : '',
		description: description ? description.label : '',
		icon: icon ? icon.label : '',
		order: order ? order.label : Infinity,
		type: type ? type.id : '',
		onHomePage: !!onHomePage,
		researchField: subject,
		hasPreviousVersion,
		visualizations,
		figures,
		resources,
		properties,
		video,
		anonymized: !!anonymized
	}
}

// https://stackoverflow.com/questions/42921220/is-any-solution-to-do-localstorage-setitem-in-asynchronous-way-in-javascript
const asyncLocalStorage = {
	setItem(key, value) {
		return Promise.resolve().then(() => {
			localStorage.setItem(key, value)
		})
	},
	getItem(key) {
		return Promise.resolve().then(() => localStorage.getItem(key))
	},
	removeItem(key) {
		return Promise.resolve().then(() => localStorage.removeItem(key))
	}
}

/**
 * Parse comma separated values from the query string
 *
 * @param {String} locationSearch useLocation().search
 * @param {String} param parameter name
 * @return {Array} the list of values
 */
function getArrayParamFromQueryString(locationSearch, param) {
	const values = qs.parse(locationSearch, {
		comma: true,
		ignoreQueryPrefix: true
	})[param]
	if (!values) {
		return []
	}
	if (typeof values === 'string' || values instanceof String) {
		return [values]
	}
	return values
}

/**
 * Parse value from the query string
 *
 * @param {String} locationSearch useLocation().search
 * @param {String} param parameter name
 * @param {Boolean} boolean return false instead of null
 * @return {String|Boolean} value
 */
function getParamFromQueryString(locationSearch, param, boolean = false) {
	const value = qs.parse(locationSearch, { ignoreQueryPrefix: true })[param]
	if (!value) {
		return boolean ? false : null
	}
	if (typeof value === 'string' || value instanceof String) {
		if (
			boolean &&
			(value === 'false' || !value || !['true', '1'].includes(value))
		) {
			return false
		}
		return boolean ? true : value
	}
	return value
}

module.exports = {
	filterObjectOfStatementsByPredicateAndClass,
	getErrorMessage,
	getComparisonData,
	asyncLocalStorage,
	getArrayParamFromQueryString,
	getParamFromQueryString
}
