interface User {
	firstName: string;
	lastName: string;
}

export async function load() {
	return {
		user: await fetchUser(),
	};
}

async function fetchUser() {
	const response = await fetch("https://api.example.com/user");
	return response.json() as Promise<User>;
}
