if (import.meta.env.MODE === "test") {
	import("./mocks/node").then(({ server }) => {
		server.events.on("request:start", ({ request }) => {
			console.info("Outgoing:", request.method, request.url);
		});

		server.listen();
	});
}
