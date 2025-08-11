<script lang="ts">
	import { base } from "$app/paths";
	import { goto } from "$app/navigation";
	import { getContext } from "svelte";
	import PublicHeader from "$lib/components/PublicHeader.svelte";

	// Carbon icons
	import CarbonBook from "~icons/carbon/book";
	import CarbonCalendar from "~icons/carbon/calendar";
	import CarbonCheckmark from "~icons/carbon/checkmark";
	import CarbonChartBubble from "~icons/carbon/chart-bubble";
	import CarbonTextAlignLeft from "~icons/carbon/text-align-left";
	import CarbonTextBold from "~icons/carbon/text-bold";
	import CarbonUserProfile from "~icons/carbon/user-profile";
	import CarbonUserMultiple from "~icons/carbon/user-multiple";
	import CarbonCollaborate from "~icons/carbon/collaborate";
	import CarbonMicrophone from "~icons/carbon/microphone";
	import CarbonFunction from "~icons/carbon/function";
	import CarbonCertificate from "~icons/carbon/certificate";

	const publicConfig = getContext("publicConfig");

	type QuizOption = {
		name: string;
		description: string;
		icon: any;
		q: string;
	};

	const quizOptions: QuizOption[] = [
		{ name: "English (Quiz Zone)", description: "Personalized English practice with AI-tailored options.", icon: CarbonBook, q: "Start English practice" },
		{ name: "Daily Challenge", description: "A new AI-crafted quiz every day with instant feedback.", icon: CarbonCalendar, q: "Start daily challenge" },
		{ name: "Quick Knowledge Check", description: "Fast true/false questions for quick revision.", icon: CarbonCheckmark, q: "Give me a quick knowledge check" },
		{ name: "Non-Verbal Reasoning", description: "AI-adapted visual reasoning challenges.", icon: CarbonChartBubble, q: "Practice non-verbal reasoning" },
		{ name: "Comprehension Practice", description: "Build comprehension with supportive exercises.", icon: CarbonTextAlignLeft, q: "Practice reading comprehension" },
		{ name: "Vocabulary Building", description: "AI-curated word challenges to expand vocabulary.", icon: CarbonTextBold, q: "Build my vocabulary" },
		{ name: "Self-Assessment", description: "AI-customized challenges at your own pace.", icon: CarbonUserProfile, q: "Run a self assessment" },
		{ name: "Peer Practice Hub", description: "Collaborative practice with AI-generated quizzes.", icon: CarbonUserMultiple, q: "Start peer practice" },
		{ name: "One-to-One Prep", description: "Personalized feedback like a dedicated tutor.", icon: CarbonUserProfile, q: "One-to-one prep session" },
		{ name: "Group Study", description: "AI-tailored group sessions for revision.", icon: CarbonCollaborate, q: "Start a group study session" },
		{ name: "Audio Questions", description: "Improve listening skills with audio questions.", icon: CarbonMicrophone, q: "Start audio questions practice" },
		{ name: "Maths Zone", description: "AI-adapted maths problems to strengthen skills.", icon: CarbonFunction, q: "Practice maths" },
		{ name: "Exam Style Simulations", description: "AI-simulated exams with performance insights.", icon: CarbonCertificate, q: "Start an exam simulation" },
	];

	function openOption(option: QuizOption) {
		const params = new URLSearchParams({ q: option.q });
		goto(`${base}/chat?${params.toString()}`);
	}
</script>

<svelte:head>
    <title>Revision & Study Materials - Previsely</title>
	<meta name="description" content="Access comprehensive study materials, practice tests, and revision tools across all subjects. Prepare for exams with AI-powered learning resources." />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<PublicHeader />
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="text-center">
				<h1 class="text-4xl md:text-5xl font-bold mb-4">
					Study Materials & Revision
				</h1>
				<p class="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
					Access comprehensive learning resources, practice materials, and AI-powered study tools 
					to excel in your academics.
				</p>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Quiz Options Grid -->
		<section class="mb-16">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Practice & Assessment</h2>
				<p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Choose a mode and start practicing with AI guidance, instant feedback, and progress tracking.</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each quizOptions as opt}
					<a
						href={
							opt.name === "English (Quiz Zone)" ? `${base}/quiz-play` :
							opt.name === "Daily Challenge" ? `${base}/quiz-play/daily-quiz-dashboard` :
							opt.name === "Quick Knowledge Check" ? `${base}/quiz-play/true-and-false-play` :
							opt.name === "Non-Verbal Reasoning" ? `${base}/non-verbal-reasoning` :
							opt.name === "Comprehension Practice" ? `${base}/fun-and-learn` :
							opt.name === "Vocabulary Building" ? `${base}/guess-the-word` :
							opt.name === "Self-Assessment" ? `${base}/self-learning` :
							opt.name === "Peer Practice Hub" ? `${base}/contest-play` :
							opt.name === "One-to-One Prep" ? `${base}/random-battle` :
							opt.name === "Group Study" ? `${base}/group-battle` :
							opt.name === "Audio Questions" ? `${base}/audio-questions` :
							opt.name === "Maths Zone" ? `${base}/math-mania` :
							`${base}/exam-module`
						}
						class="group block text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-6 hover:shadow-md transition-all"
					>
						<div class="mb-4 inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 size-10">
							<svelte:component this={opt.icon} class="w-5 h-5" />
						</div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{opt.name}</h3>
						<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{opt.description}</p>
						<div class="mt-4 text-sm text-blue-600 dark:text-blue-300">Start now →</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- Quick Stats -->
		<section class="mb-16">
			<div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
				<div class="text-center mb-8">
					<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Learning Made Effective</h2>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div class="text-center">
						<div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">10,000+</div>
						<div class="text-gray-600 dark:text-gray-300">Practice Questions</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">13</div>
						<div class="text-gray-600 dark:text-gray-300">Practice Modes</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
						<div class="text-gray-600 dark:text-gray-300">AI Assistance</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">95%</div>
						<div class="text-gray-600 dark:text-gray-300">Success Rate</div>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12">
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
				Ready to Start Studying?
			</h2>
			<p class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
				Access thousands of study materials, practice questions, and get personalized AI tutoring 
				to achieve your academic goals.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button 
					on:click={() => goto(`${base}/chat`)}
					class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
				>
					Start Learning Now
				</button>
				<button 
					on:click={() => goto(`${base}/pricing`)}
					class="px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition-colors duration-200"
				>
					View Pricing Plans
				</button>
			</div>
		</section>
	</div>
</div>