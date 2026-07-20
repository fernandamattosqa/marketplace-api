const { criarServidor } = require("../../mock-marketplace-api");

async function withApi(callback) {
	const server = criarServidor();
	await new Promise((resolve) => server.listen(0, resolve));
	const port = server.address().port;
	const baseUrl = `http://127.0.0.1:${port}`;

	try {
		return await callback(baseUrl);
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
}

async function request(baseUrl, method, path, body) {
	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers: body ? { "Content-Type": "application/json" } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});

	const result = {
		status: response.status,
		body: await response.json(),
	};

	return result;
}

async function requestWithEvidence(baseUrl, method, path, body, evidenceList) {
	const result = await request(baseUrl, method, path, body);

	if (Array.isArray(evidenceList)) {
		evidenceList.push({
			method,
			path,
			body: body || {},
			status: result.status,
			response: result.body,
		});
	}

	return result;
}

async function post(baseUrl, path, body) {
	return request(baseUrl, "POST", path, body);
}

async function get(baseUrl, path) {
	return request(baseUrl, "GET", path);
}

module.exports = {
	withApi,
	request,
	requestWithEvidence,
	post,
	get,
};
