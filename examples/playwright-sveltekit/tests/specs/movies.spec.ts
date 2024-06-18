import { http, HttpResponse } from "msw";
import { expect, test } from "../fixtures";

test.describe("home", () => {
	test("should list movies", async ({ page, worker }) => {
		/** Mocking a browser-initiated fetch */
		await worker.use(
			http.get("https://api.example.com/movies", () => {
				return HttpResponse.json({
					data: {
						movies: [
							{
								id: "6c6dba95-e027-4fe2-acab-e8c155a7f0ff",
								title: "The Lord of The Rings",
							},
							{
								id: "a2ae7712-75a7-47bb-82a9-8ed668e00fe3",
								title: "The Matrix",
							},
						],
					},
				});
			})
		);

		await page.goto("/");

		const button = page.getByRole("button");
		await button.click();

		const header = page.getByRole("heading");
		await expect(header).toBeVisible();
		await expect(header).toHaveText("Hello, John!");

		const movies = await page.getByRole("listitem").all();

		expect(movies).toHaveLength(2);
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		await expect(movies.at(0)!).toHaveText("The Lord of The Rings");
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		await expect(movies.at(1)!).toHaveText("The Matrix");
	});

	test("should show first name in heading", async ({ http, page, server }) => {
		/** Mocking a server-side fetch */
		await server.use(
			http.get("https://api.example.com/user", () => {
				return HttpResponse.json({ firstName: "Jane", lastName: "Doe" });
			})
		);

		await page.goto("/");

		const header = page.getByRole("heading");
		await expect(header).toBeVisible();
		await expect(header).toHaveText("Hello, Jane!");
	});
});
