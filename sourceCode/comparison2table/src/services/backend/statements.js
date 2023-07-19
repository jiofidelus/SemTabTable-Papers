const { url } = require('../../constants/misc')
const { submitGetRequest } = require('../../network')
const qs = require('qs')

const statementsUrl = `${url}statements/`

const getStatementsBySubject = ({
	id,
	page = 0,
	items: size = 9999,
	sortBy = 'created_at',
	desc = true
}) => {
	const sort = `${sortBy},${desc ? 'desc' : 'asc'}`
	const params = qs.stringify(
		{ page, size, sort },
		{
			skipNulls: true
		}
	)

	return submitGetRequest(
		`${statementsUrl}subject/${encodeURIComponent(id)}/?${params}`
	).then((res) => res.content)
}

const getStatementsBySubjectAndPredicate = ({
	subjectId,
	predicateId,
	page = 0,
	items: size = 9999,
	sortBy = 'created_at',
	desc = true
}) => {
	const sort = `${sortBy},${desc ? 'desc' : 'asc'}`
	const params = qs.stringify(
		{ page, size, sort },
		{
			skipNulls: true
		}
	)

	return submitGetRequest(
		`${statementsUrl}subject/${subjectId}/predicate/${predicateId}/?${params}`
	).then((res) => res.content)
}

module.exports = {
	statementsUrl,
	getStatementsBySubject,
	getStatementsBySubjectAndPredicate
}
