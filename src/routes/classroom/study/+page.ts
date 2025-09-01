import type { PageLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";

export const load: PageLoad = async ({ parent }) => {
	const data = await parent();

	// Check if user is logged in
	if (data.loginRequired) {
		throw redirect(302, `${base}/auth`);
	}

	// Return models and tools data
	return {
		models: data.models || [],
		oldModels: data.oldModels || [],
		tools: data.tools || [],
		loginRequired: data.loginRequired || false,
	};
};
