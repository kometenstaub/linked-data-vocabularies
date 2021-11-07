self.onmessage = async function(e) {
	const parsedJSON = await JSON.parse(e.data)
	self.postMessage(parsedJSON)
}