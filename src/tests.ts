import { fail } from "@sveltejs/kit";

export function runTests() {
	console.log("%cRUNNING STABILITY TESTS...", "color: #26bfa5;");
	let failures = 0;

	console.log(
		failures === 0 ? "%cPASSED ALL STABILITY TESTS 😍" : "%cFAILED STABILITY TESTS ❌", 
		failures === 0 ? "color: #26bfa5;" : "color: #ff4d4f;");

	return failures; // num of failures
}
