// import { Cookies } from 'react-cookie';
const crossFetch = require('cross-fetch')
const fetch = crossFetch
const { Headers } = crossFetch
// const fetch = require('cross-fetch')
// const { Headers } = require('cross-fetch')

const submitGetRequest = (url, headers, send_token = false) => {
	if (!url) {
		throw new Error('Cannot submit GET request. URL is null or undefined.')
	}
	const myHeaders = headers ? new Headers(headers) : {}
	// if (send_token) {
	//     const cookies = new Cookies();
	//     const token = cookies.get('token') ? cookies.get('token') : null;
	//     if (token) {
	//         myHeaders.append('Authorization', `Bearer ${token}`);
	//     }
	// }

	return new Promise((resolve, reject) => {
		fetch(url, {
			method: 'GET',
			headers: myHeaders
		})
			.then((response) => {
				if (!response.ok) {
					reject({
						error: new Error(
							`Error response. (${response.status}) ${response.statusText}`
						),
						statusCode: response.status,
						statusText: response.statusText
					})
				} else {
					if (response.status === 204) {
						// 204 No Content
						return resolve(null)
					}
					const json = response.json()
					if (json.then) {
						json.then(resolve).catch(reject)
					} else {
						return resolve(json)
					}
				}
			})
			.catch(reject)
	})
}

module.exports = { submitGetRequest }
