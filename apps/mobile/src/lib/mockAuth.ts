export async function mockLogin(emailOrPhone: string, _password: string) {
	await new Promise((r) => setTimeout(r, 700));
	if (!emailOrPhone) throw new Error("Missing credentials");
	return "mock-token";
}

export async function mockRegister(_payload: { name: string; email: string; password: string }) {
	await new Promise((r) => setTimeout(r, 900));
	return "mock-token";
}